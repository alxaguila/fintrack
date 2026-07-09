import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Upload, Loader2, Landmark } from 'lucide-react'
import { useBankEntities } from '@/hooks/useBankEntities'
import {
  useCreateBankEntity, useUpdateBankEntity, useDeleteBankEntity,
  uploadBankLogo, MAX_BANK_LOGO_BYTES,
} from '@/hooks/useAdminBankEntities'
import { bankEntityFormSchema, fieldErrors } from '@/lib/validation'
import type { BankEntity } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

type FormState = { name: string; logo_url: string; sort_order: string }
const empty: FormState = { name: '', logo_url: '', sort_order: '0' }

export default function Bancos() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: entities = [], isLoading } = useBankEntities()
  const createM = useCreateBankEntity()
  const updateM = useUpdateBankEntity()
  const deleteM = useDeleteBankEntity()

  const [editing, setEditing] = useState<BankEntity | null | undefined>(undefined) // undefined=cerrado, null=nuevo
  const [toDelete, setToDelete] = useState<BankEntity | null>(null)

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <AdminHeader title={t('banks.title')} />

      <div className="flex justify-end">
        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4" /> {t('banks.add')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : entities.length === 0 ? (
        <p className="text-sm text-slate-500">{t('banks.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {entities.map((e) => (
            <div key={e.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {e.logo_url
                  ? <img src={e.logo_url} alt="" className="h-full w-full object-contain" />
                  : <Landmark className="h-4 w-4 text-slate-400" />}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 break-words font-medium">
                {e.name}
                {!e.reviewed && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title={t('banks.pending')} />
                )}
              </span>
              <button
                onClick={() => setEditing(e)}
                aria-label={tc('actions.edit')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setToDelete(e)}
                aria-label={tc('actions.delete')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#CB6391] hover:bg-[#CB6391]/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <BankDialog
          entity={editing}
          saving={createM.isPending || updateM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              // Al guardar una edición se marca como revisada (apaga el aviso rojo).
              if (editing) await updateM.mutateAsync({ id: editing.id, ...values, reviewed: true })
              else await createM.mutateAsync(values)
              toast({ title: t('banks.saved') })
              setEditing(undefined)
            } catch (err: any) {
              const dup = String(err?.message ?? '').includes('duplicate') || err?.code === '23505'
              toast({ title: dup ? t('banks.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('banks.delete_title')}</DialogTitle>
            <DialogDescription>{t('banks.delete_body', { name: toDelete?.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>{tc('actions.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteM.isPending}
              onClick={async () => {
                if (!toDelete) return
                try {
                  await deleteM.mutateAsync(toDelete)
                  toast({ title: t('banks.deleted') })
                } catch {
                  toast({ title: tc('errors.generic'), variant: 'destructive' })
                } finally {
                  setToDelete(null)
                }
              }}
            >
              {tc('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BankDialog({
  entity, saving, onClose, onSave,
}: {
  entity: BankEntity | null
  saving: boolean
  onClose: () => void
  onSave: (v: { name: string; logo_url: string | null; sort_order: number }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState<FormState>(
    entity ? { name: entity.name, logo_url: entity.logo_url ?? '', sort_order: String(entity.sort_order) } : empty,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({ title: t('banks.logo_invalid'), variant: 'destructive' })
      return
    }
    if (file.size > MAX_BANK_LOGO_BYTES) {
      toast({ title: t('banks.logo_too_big'), variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const url = await uploadBankLogo(file)
      setForm((f) => ({ ...f, logo_url: url }))
    } catch (err: any) {
      toast({ title: t('banks.logo_failed'), description: err?.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  function submit() {
    const values = { name: form.name, logo_url: form.logo_url, sort_order: Number(form.sort_order) || 0 }
    const parsed = bankEntityFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({ name: values.name.trim(), logo_url: values.logo_url.trim() || null, sort_order: values.sort_order })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{entity ? t('banks.edit_title') : t('banks.new_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('banks.name')}</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.name}`)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t('banks.logo')}</Label>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {form.logo_url
                  ? <img src={form.logo_url} alt="" className="h-full w-full object-contain" />
                  : <Landmark className="h-4 w-4 text-slate-400" />}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('banks.logo_upload')}
              </Button>
              {form.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}>
                  {tc('actions.remove')}
                </Button>
              )}
            </div>
            <Input
              className="mt-2"
              placeholder={t('banks.logo_url_ph')}
              value={form.logo_url}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
            />
            {errors.logo_url && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.logo_url}`)}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
          <Button onClick={submit} disabled={saving || uploading || !form.name.trim()}>{tc('actions.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Pencil, Trash2, Upload, Loader2, Store } from 'lucide-react'
import { useMerchants, useCreateMerchant, useUpdateMerchant, useDeleteMerchant, uploadMerchantLogo, linkMerchantTransactions, MAX_MERCHANT_LOGO_BYTES } from '@/hooks/useAdminMerchants'
import { merchantFormSchema, fieldErrors } from '@/lib/validation'
import type { Merchant } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

type FormState = { name: string; logo_url: string }
const empty: FormState = { name: '', logo_url: '' }

export default function Comercios() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: merchants = [], isLoading } = useMerchants()
  const createM = useCreateMerchant()
  const updateM = useUpdateMerchant()
  const deleteM = useDeleteMerchant()

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Merchant | null | undefined>(undefined) // undefined=cerrado, null=nuevo
  const [toDelete, setToDelete] = useState<Merchant | null>(null)

  const q = normalize(query.trim())
  const filtered = useMemo(
    () => (q ? merchants.filter((m) => normalize(m.name).includes(q)) : merchants),
    [merchants, q],
  )

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <AdminHeader title={t('comercios.title')} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder={t('comercios.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4" /> {t('comercios.add')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{q ? t('comercios.no_search_results') : t('comercios.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {m.logo_url
                  ? <img src={m.logo_url} alt="" className="h-full w-full object-contain" />
                  : <Store className="h-4 w-4 text-slate-400" />}
              </span>
              <span className="min-w-0 flex-1 break-words font-medium">{m.name}</span>
              <button
                onClick={() => setEditing(m)}
                aria-label={tc('actions.edit')}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setToDelete(m)}
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
        <MerchantDialog
          merchant={editing}
          saving={createM.isPending || updateM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              let merchantId: string
              if (editing) {
                await updateM.mutateAsync({ id: editing.id, ...values })
                merchantId = editing.id
              } else {
                merchantId = (await createM.mutateAsync(values)).id
              }
              toast({ title: t('comercios.saved') })
              setEditing(undefined)
              try {
                const count = await linkMerchantTransactions(merchantId)
                if (count > 0) toast({ title: t('comercios.linked_count', { count }) })
              } catch {
                // No bloquear el guardado del comercio si falla el enlace retroactivo.
                toast({ title: t('comercios.link_failed'), variant: 'destructive' })
              }
            } catch (err: any) {
              const dup = String(err?.message ?? '').includes('duplicate') || err?.code === '23505'
              toast({ title: dup ? t('comercios.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('comercios.delete_title')}</DialogTitle>
            <DialogDescription>{t('comercios.delete_body', { name: toDelete?.name })}</DialogDescription>
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
                  toast({ title: t('comercios.deleted') })
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

function MerchantDialog({
  merchant, saving, onClose, onSave,
}: {
  merchant: Merchant | null
  saving: boolean
  onClose: () => void
  onSave: (v: { name: string; logo_url: string | null }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState<FormState>(
    merchant ? { name: merchant.name, logo_url: merchant.logo_url ?? '' } : empty,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({ title: t('comercios.logo_invalid'), variant: 'destructive' })
      return
    }
    if (file.size > MAX_MERCHANT_LOGO_BYTES) {
      toast({ title: t('comercios.logo_too_big'), variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const url = await uploadMerchantLogo(file)
      setForm((f) => ({ ...f, logo_url: url }))
    } catch (err: any) {
      toast({ title: t('comercios.logo_failed'), description: err?.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  function submit() {
    const values = { name: form.name, logo_url: form.logo_url }
    const parsed = merchantFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({ name: values.name.trim(), logo_url: values.logo_url.trim() || null })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{merchant ? t('comercios.edit_title') : t('comercios.new_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('comercios.name')}</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.name}`)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t('comercios.logo')}</Label>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {form.logo_url
                  ? <img src={form.logo_url} alt="" className="h-full w-full object-contain" />
                  : <Store className="h-4 w-4 text-slate-400" />}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('comercios.logo_upload')}
              </Button>
              {form.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}>
                  {tc('actions.remove')}
                </Button>
              )}
            </div>
            <Input
              className="mt-2"
              placeholder={t('comercios.logo_url_ph')}
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

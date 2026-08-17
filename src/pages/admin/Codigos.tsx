import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Trash2, Ticket } from 'lucide-react'
import { SortHeader, nextSort, type SortDir } from './SortHeader'
import {
  usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode,
  type PromoCodeInput,
} from '@/hooks/useAdminPromoCodes'
import { promoCodeFormSchema, fieldErrors } from '@/lib/validation'
import type { PromoCode, PromoCodeType, PlanType } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePickerField } from '@/components/ui/date-picker-field'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

type FormState = {
  code: string
  type: PromoCodeType
  description: string
  owner_user_id: string
  reward_plan: '' | PlanType
  reward_days: string
  discount_type: '' | 'percent' | 'fixed'
  discount_value: string
  starts_at: string | undefined
  ends_at: string | undefined
  max_uses: string
  is_active: boolean
}

const emptyForm: FormState = {
  code: '', type: 'signup', description: '', owner_user_id: '',
  reward_plan: '', reward_days: '', discount_type: '', discount_value: '',
  starts_at: undefined, ends_at: undefined,
  max_uses: '', is_active: true,
}

type RewardKind = 'none' | 'plan' | 'discount'

type CodeSortKey = 'code' | 'use_count'

function isExpired(code: PromoCode): boolean {
  return !!code.ends_at && new Date(code.ends_at) < new Date()
}

export default function Codigos() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: codes = [], isLoading } = usePromoCodes()
  const createC = useCreatePromoCode()
  const updateC = useUpdatePromoCode()
  const deleteC = useDeletePromoCode()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: CodeSortKey; dir: SortDir }>({ key: 'code', dir: 'asc' })
  const [editing, setEditing] = useState<PromoCode | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<PromoCode | null>(null)

  const q = query.trim().toUpperCase()
  const filtered = useMemo(
    () => (q ? codes.filter((c) => c.code.includes(q)) : codes),
    [codes, q],
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const cmp = sort.key === 'code' ? a.code.localeCompare(b.code) : a.use_count - b.use_count
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort])

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <AdminHeader title={t('codigos.title')} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder={t('codigos.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4" /> {t('codigos.add')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{q ? t('codigos.no_search_results') : t('codigos.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <span className="w-9 shrink-0" aria-hidden="true" />
            <SortHeader
              label={t('codigos.col_code')}
              active={sort.key === 'code'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'code', false))}
              className="min-w-0 flex-1"
            />
            <SortHeader
              label={t('codigos.col_usage')}
              active={sort.key === 'use_count'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'use_count', true))}
              className="w-[90px] shrink-0"
            />
            <span className="w-8 shrink-0" aria-hidden="true" />
          </div>

          {sorted.map((c) => {
            const expired = isExpired(c)
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(c) } }}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Ticket className="h-4 w-4 text-slate-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-mono font-medium">{c.code}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {t(`codigos.types.${c.type}`)}
                    </span>
                    {!c.is_active && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {t('codigos.status_inactive')}
                      </span>
                    )}
                    {c.is_active && expired && (
                      <span className="inline-flex items-center rounded-full bg-[#CB6391]/10 px-2 py-0.5 text-xs font-medium text-[#CB6391]">
                        {t('codigos.status_expired')}
                      </span>
                    )}
                    {c.discount_type && (
                      <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-700">
                        {c.discount_type === 'percent' ? `-${c.discount_value}%` : `-${c.discount_value} €`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-[90px] shrink-0">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                    {c.use_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setToDelete(c) }}
                  aria-label={tc('actions.delete')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#CB6391] hover:bg-[#CB6391]/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {editing !== undefined && (
        <PromoCodeDialog
          promoCode={editing}
          saving={createC.isPending || updateC.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              if (editing) {
                await updateC.mutateAsync({ id: editing.id, ...values })
              } else {
                await createC.mutateAsync(values)
              }
              toast({ title: t('codigos.saved') })
              setEditing(undefined)
            } catch (err: any) {
              const dup = String(err?.message ?? '').includes('duplicate') || err?.code === '23505'
              toast({ title: dup ? t('codigos.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('codigos.delete_title')}</DialogTitle>
            <DialogDescription>{t('codigos.delete_body', { code: toDelete?.code })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>{tc('actions.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteC.isPending}
              onClick={async () => {
                if (!toDelete) return
                try {
                  await deleteC.mutateAsync(toDelete)
                  toast({ title: t('codigos.deleted') })
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

const PROMO_CODE_TYPES: PromoCodeType[] = ['signup', 'referral', 'campaign']
const REWARD_PLANS: PlanType[] = ['free', 'pro', 'premium']

function PromoCodeDialog({
  promoCode, saving, onClose, onSave,
}: {
  promoCode: PromoCode | null
  saving: boolean
  onClose: () => void
  onSave: (v: PromoCodeInput) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState<FormState>(
    promoCode
      ? {
          code: promoCode.code,
          type: promoCode.type,
          description: promoCode.description ?? '',
          owner_user_id: promoCode.owner_user_id ?? '',
          reward_plan: promoCode.reward_plan ?? '',
          reward_days: promoCode.reward_days != null ? String(promoCode.reward_days) : '',
          discount_type: promoCode.discount_type ?? '',
          discount_value: promoCode.discount_value != null ? String(promoCode.discount_value) : '',
          starts_at: promoCode.starts_at ? promoCode.starts_at.slice(0, 10) : undefined,
          ends_at: promoCode.ends_at ? promoCode.ends_at.slice(0, 10) : undefined,
          max_uses: promoCode.max_uses != null ? String(promoCode.max_uses) : '',
          is_active: promoCode.is_active,
        }
      : emptyForm,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const rewardKind: RewardKind = form.reward_plan ? 'plan' : form.discount_type ? 'discount' : 'none'

  function setRewardKind(kind: RewardKind) {
    setForm((f) => ({
      ...f,
      reward_plan: kind === 'plan' ? (f.reward_plan || 'pro') : '',
      reward_days: kind === 'plan' ? f.reward_days : '',
      discount_type: kind === 'discount' ? (f.discount_type || 'percent') : '',
      discount_value: kind === 'discount' ? f.discount_value : '',
    }))
  }

  function submit() {
    const values = {
      code: form.code,
      type: form.type,
      description: form.description,
      owner_user_id: form.type === 'referral' ? form.owner_user_id.trim() : '',
      reward_plan: form.reward_plan,
      reward_days: form.reward_days.trim() === '' ? null : Number(form.reward_days),
      discount_type: form.discount_type,
      discount_value: form.discount_value.trim() === '' ? null : Number(form.discount_value),
      starts_at: form.starts_at ?? null,
      ends_at: form.ends_at ?? null,
      max_uses: form.max_uses.trim() === '' ? null : Number(form.max_uses),
      is_active: form.is_active,
    }
    const parsed = promoCodeFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({
      code: parsed.data.code,
      type: parsed.data.type,
      description: parsed.data.description.trim() || null,
      owner_user_id: parsed.data.owner_user_id || null,
      reward_plan: parsed.data.reward_plan || null,
      reward_days: parsed.data.reward_days,
      discount_type: parsed.data.discount_type || null,
      discount_value: parsed.data.discount_value,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      max_uses: parsed.data.max_uses,
      is_active: parsed.data.is_active,
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{promoCode ? t('codigos.edit_title') : t('codigos.new_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('codigos.code')}</Label>
            <Input
              className="font-mono uppercase"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            {errors.code && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.code}`)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t('codigos.type')}</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as PromoCodeType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROMO_CODE_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`codigos.types.${ty}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.type === 'referral' && (
            <div className="space-y-1.5">
              <Label>{t('codigos.owner')}</Label>
              <Input
                placeholder={t('codigos.owner_ph')}
                value={form.owner_user_id}
                onChange={(e) => setForm((f) => ({ ...f, owner_user_id: e.target.value }))}
              />
              <p className="text-xs text-slate-500">{t('codigos.owner_hint')}</p>
              {errors.owner_user_id && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.owner_user_id}`)}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t('codigos.description')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            {errors.description && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.description}`)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t('codigos.reward_kind')}</Label>
            <Select value={rewardKind} onValueChange={(v) => setRewardKind(v as RewardKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('codigos.reward_kind_none')}</SelectItem>
                <SelectItem value="plan">{t('codigos.reward_kind_plan')}</SelectItem>
                <SelectItem value="discount">{t('codigos.reward_kind_discount')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rewardKind === 'plan' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('codigos.reward_plan')}</Label>
                <Select
                  value={form.reward_plan || 'pro'}
                  onValueChange={(v) => setForm((f) => ({ ...f, reward_plan: v as PlanType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REWARD_PLANS.map((p) => <SelectItem key={p} value={p}>{t(`codigos.plans.${p}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('codigos.reward_days')}</Label>
                <Input
                  type="number" min={1}
                  value={form.reward_days}
                  onChange={(e) => setForm((f) => ({ ...f, reward_days: e.target.value }))}
                />
                {errors.reward_days && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.reward_days}`)}</p>}
              </div>
            </div>
          )}

          {rewardKind === 'discount' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('codigos.discount_type')}</Label>
                <Select
                  value={form.discount_type || 'percent'}
                  onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as 'percent' | 'fixed' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">{t('codigos.discount_percent')}</SelectItem>
                    <SelectItem value="fixed">{t('codigos.discount_fixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('codigos.discount_value')}</Label>
                <Input
                  type="number" min={1} max={form.discount_type === 'percent' ? 100 : undefined}
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                />
                {errors.discount_value && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.discount_value}`)}</p>}
              </div>
            </div>
          )}
          {errors.discount_type && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.discount_type}`)}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('codigos.starts_at')}</Label>
              <DatePickerField
                value={form.starts_at}
                onChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                placeholder={t('codigos.no_limit')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('codigos.ends_at')}</Label>
              <DatePickerField
                value={form.ends_at}
                onChange={(v) => setForm((f) => ({ ...f, ends_at: v }))}
                placeholder={t('codigos.no_limit')}
              />
              {errors.ends_at && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.ends_at}`)}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('codigos.max_uses')}</Label>
            <Input
              type="number" min={1}
              placeholder={t('codigos.no_limit')}
              value={form.max_uses}
              onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
            />
            {errors.max_uses && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.max_uses}`)}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span>{t('codigos.is_active')}</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tc('actions.cancel')}</Button>
          <Button onClick={submit} disabled={saving}>{tc('actions.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Trash2, Upload, Loader2, Store, X } from 'lucide-react'
import { SortHeader, nextSort, type SortDir } from './SortHeader'
import { useMerchants, useCreateMerchant, useUpdateMerchant, useDeleteMerchant, useMerchantUsageCounts, uploadMerchantLogo, linkMerchantTransactions, addMerchantPatterns, MAX_MERCHANT_LOGO_BYTES } from '@/hooks/useAdminMerchants'
import { useMerchantPatterns, useAddMerchantPattern, useDeleteMerchantPattern } from '@/hooks/useMerchantPatterns'
import { useDictionaryRules, useSaveDictionaryRule } from '@/hooks/useDictionaryRules'
import { useCategories, useCategoryGroups } from '@/hooks/useCategories'
import { normalizePattern, matchBuiltinCategory } from '@/lib/categoryRules'
import { merchantFormSchema, merchantPatternSchema, fieldErrors, firstError } from '@/lib/validation'
import type { Merchant, DictionaryRule } from '@/lib/database.types'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { WordDialog } from './Reglas'
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
type MerchantSortKey = 'name' | 'use_count'

export default function Comercios() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: merchants = [], isLoading } = useMerchants()
  const { data: usageCounts } = useMerchantUsageCounts()
  const { data: dictionaryRules = [] } = useDictionaryRules()
  const { data: categories = [] } = useCategories()
  const { data: groups = [] } = useCategoryGroups()
  const createM = useCreateMerchant()
  const updateM = useUpdateMerchant()
  const deleteM = useDeleteMerchant()
  const saveDictRuleM = useSaveDictionaryRule()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: MerchantSortKey; dir: SortDir }>({ key: 'use_count', dir: 'desc' })
  const [editing, setEditing] = useState<Merchant | null | undefined>(undefined) // undefined=cerrado, null=nuevo
  const [toDelete, setToDelete] = useState<Merchant | null>(null)
  // Comercio desde el que se pulsó "+" para crear su regla de clasificación
  // (mismo diálogo que /admin/reglas, prellenado, sin salir de esta pantalla).
  const [quickCreateRuleFrom, setQuickCreateRuleFrom] = useState<Merchant | null>(null)
  // Regla ya enlazada en la que se pulsó la pastilla de categoría, para editarla.
  const [editingRule, setEditingRule] = useState<DictionaryRule | null>(null)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  // Regla de diccionario ya enlazada a cada comercio: prioriza el FK explícito
  // (dictionary_rules.merchant_id) y, para pares antiguos que el backfill no
  // haya cubierto (p. ej. coinciden solo por comodín), cae a la misma
  // heurística por texto que ya usa /admin/reglas en el sentido contrario.
  const ruleByMerchant = useMemo(() => {
    const map = new Map<string, DictionaryRule>()
    for (const r of dictionaryRules) {
      if (r.merchant_id) map.set(r.merchant_id, r)
    }
    for (const m of merchants) {
      if (map.has(m.id)) continue
      const match = matchBuiltinCategory(m.name, dictionaryRules)
      if (match) map.set(m.id, match)
    }
    return map
  }, [dictionaryRules, merchants])

  const q = normalize(query.trim())
  const filtered = useMemo(
    () => (q ? merchants.filter((m) => normalize(m.name).includes(q)) : merchants),
    [merchants, q],
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const cmp = sort.key === 'name'
        ? a.name.localeCompare(b.name)
        : (usageCounts?.get(a.id) ?? 0) - (usageCounts?.get(b.id) ?? 0)
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort, usageCounts])

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
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <span className="w-9 shrink-0" aria-hidden="true" />
            <SortHeader
              label={t('comercios.col_name')}
              active={sort.key === 'name'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'name', false))}
              className="min-w-0 flex-1"
            />
            <span className="w-[150px] shrink-0">{t('rules.col_category')}</span>
            <SortHeader
              label={t('comercios.col_usage')}
              active={sort.key === 'use_count'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'use_count', true))}
              className="hidden w-[110px] shrink-0 sm:block"
            />
            <span className="w-8 shrink-0" aria-hidden="true" />
          </div>

          {sorted.map((m) => {
            const rule = ruleByMerchant.get(m.id)
            const cat = rule ? categoryById.get(rule.category_id) : undefined
            const CatIcon = categoryIcon(cat?.icon)
            const color = cat?.group?.color ?? '#64748b'
            return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(m)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(m) } }}
              className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {m.logo_url
                  ? <img src={m.logo_url} alt="" className="h-full w-full object-contain" />
                  : <Store className="h-4 w-4 text-slate-400" />}
              </span>
              <span className="min-w-0 flex-1 break-words font-medium">{m.name}</span>
              <div className="w-[150px] shrink-0">
                {rule ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingRule(rule) }}
                    title={t('comercios.rule_linked', { category: categoryLabel(cat?.slug, cat?.slug ?? '') })}
                    aria-label={t('comercios.rule_linked', { category: categoryLabel(cat?.slug, cat?.slug ?? '') })}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <CatIcon className="h-3.5 w-3.5" />
                    {categoryLabel(cat?.slug, cat?.slug ?? '')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setQuickCreateRuleFrom(m) }}
                    aria-label={t('comercios.create_rule')}
                    title={t('comercios.create_rule')}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-teal-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="hidden w-[110px] shrink-0 sm:block">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                  {t('comercios.used_count', { count: usageCounts?.get(m.id) ?? 0 })}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setToDelete(m) }}
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
        <MerchantDialog
          merchant={editing}
          saving={createM.isPending || updateM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              let merchantId: string
              if (editing) {
                await updateM.mutateAsync({ id: editing.id, name: values.name, logo_url: values.logo_url })
                merchantId = editing.id
              } else {
                merchantId = (await createM.mutateAsync({ name: values.name, logo_url: values.logo_url })).id
                if (values.patterns?.length) {
                  try {
                    await addMerchantPatterns(merchantId, values.patterns)
                  } catch (e) {
                    console.error('No se pudieron guardar las variaciones escritas al crear el comercio:', e)
                  }
                }
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

      {quickCreateRuleFrom && (
        <WordDialog
          rule={null}
          categories={categories}
          groups={groups}
          existingRules={dictionaryRules}
          initialPattern={normalizePattern(quickCreateRuleFrom.name)}
          merchantId={quickCreateRuleFrom.id}
          saving={saveDictRuleM.isPending}
          onClose={() => setQuickCreateRuleFrom(null)}
          onSave={async (values) => {
            try {
              await saveDictRuleM.mutateAsync(values)
              toast({ title: t('rules.dictionary.saved') })
              setQuickCreateRuleFrom(null)
            } catch (err: any) {
              const dup = err?.code === '23505' || String(err?.message ?? '').includes('duplicate')
              toast({ title: dup ? t('rules.dictionary.duplicate') : tc('errors.generic'), variant: 'destructive' })
            }
          }}
        />
      )}

      {editingRule && (
        <WordDialog
          rule={editingRule}
          categories={categories}
          groups={groups}
          existingRules={dictionaryRules}
          saving={saveDictRuleM.isPending}
          onClose={() => setEditingRule(null)}
          onSave={async (values) => {
            try {
              await saveDictRuleM.mutateAsync({ id: editingRule.id, ...values })
              toast({ title: t('rules.dictionary.saved') })
              setEditingRule(null)
            } catch (err: any) {
              const dup = err?.code === '23505' || String(err?.message ?? '').includes('duplicate')
              toast({ title: dup ? t('rules.dictionary.duplicate') : tc('errors.generic'), variant: 'destructive' })
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

/** Exportado para reutilizarlo desde Reglas.tsx (crear comercio directamente
 *  desde una palabra del diccionario, sin salir de esa pantalla). */
export function MerchantDialog({
  merchant, initialName, saving, onClose, onSave,
}: {
  merchant: Merchant | null
  /** Nombre de partida al crear (p. ej. desde una palabra del diccionario). Ignorado si `merchant` no es null. */
  initialName?: string
  saving: boolean
  onClose: () => void
  /** `patterns` solo se rellena al crear (variaciones escritas antes de que existiera el comercio); al editar, ya están guardadas en BD una a una. */
  onSave: (v: { name: string; logo_url: string | null; patterns?: string[] }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [form, setForm] = useState<FormState>(
    merchant ? { name: merchant.name, logo_url: merchant.logo_url ?? '' } : { name: initialName ?? '', logo_url: '' },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Comercio ya existente: las variaciones viven en BD (añadir/borrar pega al
  // momento). Comercio nuevo (aún sin id): se guardan en estado local y se
  // insertan de una vez cuando el comercio se crea (ver onSave del padre).
  const { data: dbPatterns = [] } = useMerchantPatterns(merchant?.id)
  const addPattern = useAddMerchantPattern()
  const deletePattern = useDeleteMerchantPattern()
  const [pendingPatterns, setPendingPatterns] = useState<string[]>([])
  const [newPattern, setNewPattern] = useState('')
  const [patternError, setPatternError] = useState<string | null>(null)

  async function handleAddPattern() {
    const value = normalizePattern(newPattern)
    const parsed = merchantPatternSchema.safeParse(value)
    const err = firstError(parsed)
    setPatternError(err)
    if (!parsed.success) return

    if (!merchant) {
      if (pendingPatterns.includes(value)) { setNewPattern(''); return }
      setPendingPatterns((p) => [...p, value])
      setNewPattern('')
      return
    }

    try {
      await addPattern.mutateAsync({ merchantId: merchant.id, pattern: value })
      setNewPattern('')
      const count = await linkMerchantTransactions(merchant.id)
      if (count > 0) toast({ title: t('comercios.linked_count', { count }) })
    } catch (err: any) {
      const dup = String(err?.message ?? '').includes('duplicate') || err?.code === '23505'
      toast({ title: dup ? t('comercios.pattern_duplicate') : tc('errors.generic'), variant: 'destructive' })
    }
  }

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
    onSave({
      name: values.name.trim(),
      logo_url: values.logo_url.trim() || null,
      patterns: merchant ? undefined : pendingPatterns,
    })
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

          <div className="space-y-1.5">
            <Label>{t('comercios.patterns_title')}</Label>
            <p className="text-xs text-slate-500">{t('comercios.patterns_hint')}</p>
            {(merchant ? dbPatterns.length > 0 : pendingPatterns.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {merchant
                  ? dbPatterns.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {p.pattern}
                        <button
                          type="button"
                          onClick={() => deletePattern.mutate(p)}
                          aria-label={tc('actions.delete')}
                          className="text-slate-400 hover:text-[#CB6391]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  : pendingPatterns.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {p}
                        <button
                          type="button"
                          onClick={() => setPendingPatterns((arr) => arr.filter((x) => x !== p))}
                          aria-label={tc('actions.delete')}
                          className="text-slate-400 hover:text-[#CB6391]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={t('comercios.patterns_ph')}
                value={newPattern}
                onChange={(e) => { setNewPattern(e.target.value); setPatternError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPattern() } }}
              />
              <Button type="button" variant="outline" disabled={addPattern.isPending || !newPattern.trim()} onClick={handleAddPattern}>
                {t('comercios.pattern_add')}
              </Button>
            </div>
            {patternError && <p className="text-xs text-[#CB6391]">{tc(`errors.${patternError}`)}</p>}
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

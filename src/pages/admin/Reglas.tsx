import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useAdminCommunityRules, useCommunityUsageMap, COMMUNITY_VOTE_THRESHOLD } from '@/hooks/useCommunityRules'
import {
  useDictionaryRules, useSaveDictionaryRule, useDeleteDictionaryRule, nextDictionarySortOrder,
} from '@/hooks/useDictionaryRules'
import { useCategories, useCategoryGroups } from '@/hooks/useCategories'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { dictionaryRuleFormSchema, fieldErrors } from '@/lib/validation'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { cn } from '@/lib/utils'
import type { Category, CategoryGroup, DictionaryRule } from '@/lib/database.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// El motor de coincidencia (categoryRules.ts) compara conceptos ya normalizados
// (mayúsculas, sin acentos): si aquí solo hiciéramos toUpperCase(), una palabra
// con tilde (p. ej. "café") nunca haría match contra el concepto normalizado.
function normalizePattern(s: string): string {
  return s.trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ')
}

type SortDir = 'asc' | 'desc'

/** Cabecera de columna clicable, para las tablas de diccionario y comunidad. */
function SortHeader({ label, active, dir, onClick, className }: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-1 text-left text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700', className)}
    >
      {label}
      {active ? (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  )
}

/** Alterna la dirección si ya se ordena por esa columna; si no, la activa con
 *  una dirección por defecto (numéricas → desc primero, texto → asc primero). */
function nextSort<K extends string>(prev: { key: K; dir: SortDir }, key: K, numeric: boolean): { key: K; dir: SortDir } {
  if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: numeric ? 'desc' : 'asc' }
}

/** Admin: reglas de clasificación — diccionario integrado + comunidad. */
export default function Reglas() {
  const { t } = useTranslation('admin')

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <AdminHeader title={t('rules.title')} />

      <Tabs defaultValue="dictionary">
        <TabsList className="w-full">
          <TabsTrigger value="dictionary" className="flex-1">{t('rules.tab_dictionary')}</TabsTrigger>
          <TabsTrigger value="community" className="flex-1">{t('rules.tab_community')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dictionary">
          <DictionaryPanel />
        </TabsContent>

        <TabsContent value="community">
          <CommunityPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// DICCIONARIO
// ============================================================
type DictSortKey = 'pattern' | 'category' | 'use_count'

function DictionaryPanel() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: rules = [], isLoading } = useDictionaryRules()
  const { data: categories = [] } = useCategories()
  const { data: groups = [] } = useCategoryGroups()
  const saveM = useSaveDictionaryRule()
  const deleteM = useDeleteDictionaryRule()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: DictSortKey; dir: SortDir }>({ key: 'pattern', dir: 'asc' })
  const [editing, setEditing] = useState<DictionaryRule | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<DictionaryRule | null>(null)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const q = normalize(query.trim())
  const filtered = useMemo(() => {
    if (!q) return rules
    return rules.filter((r) => {
      const cat = categoryById.get(r.category_id)
      return normalize(r.pattern).includes(q) || normalize(categoryLabel(cat?.slug, cat?.slug ?? '')).includes(q)
    })
  }, [rules, q, categoryById])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sort.key === 'pattern') cmp = a.pattern.localeCompare(b.pattern)
      else if (sort.key === 'category') {
        const la = categoryLabel(categoryById.get(a.category_id)?.slug, '')
        const lb = categoryLabel(categoryById.get(b.category_id)?.slug, '')
        cmp = la.localeCompare(lb)
      } else {
        cmp = (a.use_count ?? 0) - (b.use_count ?? 0)
      }
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort, categoryById])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder={t('rules.dictionary.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{t('rules.dictionary.count', { count: filtered.length })}</p>
        <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> {t('rules.dictionary.add_word')}</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{q ? t('rules.dictionary.no_search_results') : t('rules.dictionary.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
            <SortHeader
              label={t('rules.dictionary.col_pattern')}
              active={sort.key === 'pattern'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'pattern', false))}
              className="min-w-0 flex-1"
            />
            <SortHeader
              label={t('rules.col_category')}
              active={sort.key === 'category'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'category', false))}
              className="w-[150px] shrink-0"
            />
            <SortHeader
              label={t('rules.col_usage')}
              active={sort.key === 'use_count'} dir={sort.dir}
              onClick={() => setSort((s) => nextSort(s, 'use_count', true))}
              className="hidden w-[110px] shrink-0 sm:flex"
            />
            <span className="w-8 shrink-0" aria-hidden="true" />
          </div>

          {sorted.map((r) => {
            const cat = categoryById.get(r.category_id)
            const CatIcon = categoryIcon(cat?.icon)
            const color = cat?.group?.color ?? '#64748b'
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(r)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(r) } }}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
              >
                <p className="min-w-0 flex-1 truncate font-mono text-sm uppercase">{r.pattern}</p>
                <div className="w-[150px] shrink-0">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <CatIcon className="h-3.5 w-3.5" />
                    {categoryLabel(cat?.slug, cat?.slug ?? '')}
                  </span>
                </div>
                <div className="hidden w-[110px] shrink-0 sm:block">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                    {t('rules.used_count', { count: r.use_count ?? 0 })}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setToDelete(r) }}
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
        <WordDialog
          rule={editing}
          categories={categories}
          groups={groups}
          existingRules={rules}
          saving={saveM.isPending}
          onClose={() => setEditing(undefined)}
          onSave={async (values) => {
            try {
              await saveM.mutateAsync(editing ? { id: editing.id, ...values } : values)
              toast({ title: t('rules.dictionary.saved') })
              setEditing(undefined)
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
            <DialogTitle>{t('rules.dictionary.delete_title')}</DialogTitle>
            <DialogDescription>{t('rules.dictionary.delete_body', { name: toDelete?.pattern ?? '' })}</DialogDescription>
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
                  toast({ title: t('rules.dictionary.deleted') })
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

function WordDialog({
  rule, categories, groups, existingRules, saving, onClose, onSave,
}: {
  rule: DictionaryRule | null
  categories: Category[]
  groups: CategoryGroup[]
  existingRules: DictionaryRule[]
  saving: boolean
  onClose: () => void
  onSave: (v: { pattern: string; category_id: string; applies_to_bizum: boolean; sort_order: number }) => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const isEdit = !!rule
  const [pattern, setPattern] = useState(rule?.pattern ?? '')
  const [categoryId, setCategoryId] = useState(rule?.category_id ?? '')
  const [alwaysBizum, setAlwaysBizum] = useState(rule?.applies_to_bizum ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit() {
    const normalizedPattern = normalizePattern(pattern)
    const values = { pattern: normalizedPattern, category_id: categoryId, applies_to_bizum: alwaysBizum }
    const parsed = dictionaryRuleFormSchema.safeParse(values)
    setErrors(fieldErrors(parsed))
    if (!parsed.success) return
    onSave({
      ...values,
      sort_order: rule ? rule.sort_order : nextDictionarySortOrder(existingRules),
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('rules.dictionary.edit_word') : t('rules.dictionary.new_word')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('rules.dictionary.pattern')}</Label>
            <Input
              className="font-mono uppercase"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-slate-400">{t('rules.dictionary.pattern_hint')}</p>
            {errors.pattern && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.pattern}`)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{t('rules.dictionary.category')}</Label>
            <CategoryCombobox
              type=""
              groups={groups}
              categories={categories}
              value={categoryId}
              onChange={(catId) => setCategoryId(catId)}
              placeholder={t('rules.dictionary.pick_category')}
            />
            {errors.category_id && <p className="text-xs text-[#CB6391]">{tc(`errors.${errors.category_id}`)}</p>}
          </div>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={alwaysBizum}
              onChange={(e) => setAlwaysBizum(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span>
              {t('rules.dictionary.applies_to_bizum')}
              <span className="mt-0.5 block text-xs font-normal text-slate-400">{t('rules.dictionary.applies_to_bizum_hint')}</span>
            </span>
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

// ============================================================
// COMUNIDAD
// ============================================================
type CommunitySortKey = 'merchant_key' | 'category' | 'votes' | 'use_count'

function CommunityPanel() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: rules = [], isLoading } = useAdminCommunityRules()
  const { data: categories = [] } = useCategories()
  const { data: usageMap = new Map<string, number>() } = useCommunityUsageMap()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: CommunitySortKey; dir: SortDir }>({ key: 'votes', dir: 'desc' })

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const q = normalize(query.trim())
  const filtered = q ? rules.filter((r) => normalize(r.merchant_key).includes(q)) : rules

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sort.key === 'merchant_key') cmp = a.merchant_key.localeCompare(b.merchant_key)
      else if (sort.key === 'category') {
        const la = categoryLabel(categoryById.get(a.category_id)?.slug, '')
        const lb = categoryLabel(categoryById.get(b.category_id)?.slug, '')
        cmp = la.localeCompare(lb)
      } else if (sort.key === 'votes') {
        cmp = a.votes - b.votes
      } else {
        cmp = (usageMap.get(a.merchant_key) ?? 0) - (usageMap.get(b.merchant_key) ?? 0)
      }
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort, categoryById, usageMap])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder={t('rules.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="text-sm text-slate-500">{t('rules.threshold_note', { count: COMMUNITY_VOTE_THRESHOLD })}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">{tc('actions.loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{q ? t('rules.no_search_results') : t('rules.empty')}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
              <SortHeader
                label={t('rules.col_merchant')}
                active={sort.key === 'merchant_key'} dir={sort.dir}
                onClick={() => setSort((s) => nextSort(s, 'merchant_key', false))}
                className="min-w-0 flex-1"
              />
              <SortHeader
                label={t('rules.col_category')}
                active={sort.key === 'category'} dir={sort.dir}
                onClick={() => setSort((s) => nextSort(s, 'category', false))}
                className="w-[150px] shrink-0"
              />
              <SortHeader
                label={t('rules.col_votes')}
                active={sort.key === 'votes'} dir={sort.dir}
                onClick={() => setSort((s) => nextSort(s, 'votes', true))}
                className="w-[90px] shrink-0"
              />
              <SortHeader
                label={t('rules.col_usage')}
                active={sort.key === 'use_count'} dir={sort.dir}
                onClick={() => setSort((s) => nextSort(s, 'use_count', true))}
                className="hidden w-[110px] shrink-0 sm:flex"
              />
            </div>

            {sorted.map((r) => {
              const category = categoryById.get(r.category_id)
              const CatIcon = categoryIcon(category?.icon)
              const color = category?.group?.color ?? '#64748b'
              const active = r.votes >= COMMUNITY_VOTE_THRESHOLD
              return (
                <div
                  key={`${r.merchant_key}-${r.category_id}`}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm uppercase">{r.merchant_key}</p>
                  </div>
                  <div className="w-[150px] shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${color}1f`, color }}
                    >
                      <CatIcon className="h-3.5 w-3.5" />
                      {categoryLabel(category?.slug, category?.slug ?? '')}
                    </span>
                  </div>
                  <div className="w-[90px] shrink-0">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                        active ? 'bg-teal-500/10 text-teal-600' : 'bg-slate-100 text-slate-600',
                      )}
                      title={active ? t('rules.active') : t('rules.inactive')}
                    >
                      {t('rules.votes', { count: r.votes })}
                    </span>
                  </div>
                  <div className="hidden w-[110px] shrink-0 sm:block">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                      {t('rules.used_count', { count: usageMap.get(r.merchant_key) ?? 0 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

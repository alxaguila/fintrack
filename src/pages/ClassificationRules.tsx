import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, Tags, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useKeywordRules, useUpdateKeywordRule, useDeleteKeywordRule, useCreateKeywordRule } from '@/hooks/useKeywordRules'
import { invalidateTransactionData } from '@/hooks/useTransactions'
import { useCategories, useCategoryGroups } from '@/hooks/useCategories'
import { useLimitGate } from '@/hooks/usePlan'
import { ruleCommunityKey, syncCommunityVoteOnEdit, deleteCommunityVote, upsertCommunityVote } from '@/hooks/useCommunityRules'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import { ruleFormSchema, firstError, LIMITS } from '@/lib/validation'
import { LimitReachedDialog } from '@/components/plan/LimitReachedDialog'
import type { KeywordRule, TransactionType } from '@/lib/database.types'

type RuleType = '' | 'gasto' | 'ingreso'
interface RuleForm {
  keyword: string
  type: RuleType
  group_id: string
  category_id: string
  amount_min: string
  amount_max: string
}

const EMPTY_FORM: RuleForm = { keyword: '', type: '', group_id: '', category_id: '', amount_min: '', amount_max: '' }

function parseAmount(s: string): number | null {
  const n = Number(s.trim().replace(',', '.'))
  return s.trim() === '' || isNaN(n) ? null : n
}

export default function ClassificationRules() {
  const { t } = useTranslation('transactions')
  const { t: tc } = useTranslation('common')
  const { t: tcat } = useTranslation('categories')

  const { activeProfile } = useProfile()
  const qc = useQueryClient()
  const { data: rules = [], isLoading } = useKeywordRules()
  const { data: categories = [] } = useCategories()
  const { data: groups = [] } = useCategoryGroups()
  const updateRule = useUpdateKeywordRule()
  const deleteRule = useDeleteKeywordRule()
  const createRule = useCreateKeywordRule()
  const rulesLimit = useLimitGate('rules')

  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  // Diálogo único para crear/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<KeywordRule | null>(null)
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Búsqueda en tiempo real: por palabra clave o por nombre de la categoría
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rules
    return rules.filter(r => {
      const cat = categories.find(c => c.id === r.category_id)
      const catName = cat ? categoryLabel(cat.slug).toLowerCase() : ''
      return r.keyword.toLowerCase().includes(q) || catName.includes(q)
    })
  }, [rules, categories, search, tcat])

  const dialogGroups = groups.filter(g => g.type === form.type)
  const dialogCats = categories.filter(c => c.group_id === form.group_id)

  function openCreate() {
    if (rulesLimit.limited) {
      setShowLimitDialog(true)
      return
    }
    setEditingRule(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(r: KeywordRule) {
    const cat = categories.find(c => c.id === r.category_id)
    const grp = groups.find(g => g.id === cat?.group_id)
    const type: RuleType = grp?.type === 'gasto' || grp?.type === 'ingreso' ? grp.type : ''
    setEditingRule(r)
    setForm({
      keyword: r.keyword,
      type,
      group_id: cat?.group_id ?? '',
      category_id: r.category_id,
      amount_min: r.amount_min != null ? String(r.amount_min) : '',
      amount_max: r.amount_max != null ? String(r.amount_max) : '',
    })
    setDialogOpen(true)
  }

  async function saveRule() {
    const keyword = form.keyword.trim()
    if (!keyword || !form.category_id) return
    const amount_min = parseAmount(form.amount_min)
    const amount_max = parseAmount(form.amount_max)
    // Validación (defensa en profundidad): longitud de la keyword y rango de importes.
    const invalid = firstError(ruleFormSchema.safeParse({ keyword, amount_min, amount_max, category_id: form.category_id }))
    if (invalid) {
      toast({ variant: 'destructive', title: tc('errors.invalid_input') })
      return
    }
    setSaving(true)
    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          keyword,
          category_id: form.category_id,
          amount_min,
          amount_max,
          match_type: editingRule.match_type,
          profile_id: editingRule.profile_id,
        })
        await syncCommunityVoteOnEdit(editingRule, { keyword, match_type: editingRule.match_type, category_id: form.category_id, amount_min, amount_max })
        invalidateTransactionData(qc)
        toast({ variant: 'success', title: tc('actions.save') })
      } else {
        // Crear regla nueva (coincidencia por "contiene", todos los perfiles)
        await createRule.mutateAsync({ keyword, match_type: 'contains', category_id: form.category_id, priority: 50, is_active: true, user_id: '', profile_id: null, amount_min, amount_max } as never)
        // Voto a la comunidad solo si es un comercio reconocible y sin condición de importe
        await upsertCommunityVote(ruleCommunityKey({ keyword, match_type: 'contains', amount_min, amount_max }), form.category_id)
        // Reclasificar los movimientos del perfil que casen (texto + importe)
        const applied = await reclassifyMatching(keyword, amount_min, amount_max, form.category_id, form.type as TransactionType)
        invalidateTransactionData(qc)
        toast({ variant: 'success', title: t('rules.create_done', { count: applied }) })
      }
      await qc.invalidateQueries({ queryKey: ['keyword_rules'] })
      await qc.invalidateQueries({ queryKey: ['community_rules'] })
      setDialogOpen(false)
    } catch {
      toast({ variant: 'destructive', title: tc('errors.save_failed') })
    } finally {
      setSaving(false)
    }
  }

  // Aplica una categoría a todos los movimientos del perfil cuyo concepto contenga
  // el texto Y cuyo importe (abs) cumpla los límites. Devuelve cuántos se cambiaron.
  async function reclassifyMatching(keyword: string, min: number | null, max: number | null, categoryId: string, type: TransactionType): Promise<number> {
    if (!activeProfile) return 0
    const { data: rows } = await supabase
      .from('transactions')
      .select('id, concept, amount')
      .eq('profile_id', activeProfile.id)
    const kw = keyword.toUpperCase()
    const ids = ((rows ?? []) as { id: string; concept: string; amount: number }[])
      .filter(r => {
        if (!r.concept.toUpperCase().includes(kw)) return false
        const abs = Math.abs(r.amount)
        if (min != null && abs < min) return false
        if (max != null && abs > max) return false
        return true
      })
      .map(r => r.id)
    if (!ids.length) return 0
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId, transaction_type: type, is_reviewed: true, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) throw error
    return ids.length
  }

  async function confirmDelete() {
    if (!deleteId) return
    const rule = rules.find(r => r.id === deleteId)
    try {
      await deleteRule.mutateAsync(deleteId)
      if (rule) await deleteCommunityVote(ruleCommunityKey(rule))
      toast({ variant: 'success', title: tc('actions.delete') })
    } catch {
      toast({ variant: 'destructive', title: tc('errors.delete_failed') })
    }
    setDeleteId(null)
  }

  // Texto de la condición de importe para la tarjeta (o null si no tiene)
  function amountLabel(r: KeywordRule): string | null {
    if (r.amount_min != null && r.amount_max != null) return `${formatCurrency(r.amount_min)} – ${formatCurrency(r.amount_max)}`
    if (r.amount_min != null) return `> ${formatCurrency(r.amount_min)}`
    if (r.amount_max != null) return `< ${formatCurrency(r.amount_max)}`
    return null
  }

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado fijo */}
      <div className="shrink-0 space-y-4 p-6 pb-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('rules.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('rules.subtitle')}</p>
        </div>

        {/* Buscador en tiempo real + crear */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('rules.search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> {t('rules.new_rule')}</Button>
        </div>

        {!isLoading && rules.length > 0 && (
          <p className="text-sm text-muted-foreground">{t('rules.count', { count: filtered.length })}</p>
        )}
      </div>

      {/* Área desplazable: solo las tarjetas */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Tags className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">{t('rules.empty_title')}</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t('rules.empty_body1')}</p>
            <p className="font-medium text-foreground">{t('rules.empty_body2')}</p>
            <p>{t('rules.empty_body3')}</p>
          </div>
          <p className="mt-2 rounded-lg border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            {t('rules.empty_cta')}
          </p>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> {t('rules.new_rule')}</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{t('rules.no_results')}</div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(r => {
            const cat = categories.find(c => c.id === r.category_id)
            const grp = groups.find(g => g.id === cat?.group_id)
            const CatIcon = categoryIcon(cat?.icon)
            const catColor = grp?.color ?? '#94a3b8'
            const amount = amountLabel(r)
            return (
              <div
                key={r.id}
                onClick={() => openEdit(r)}
                className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                {/* Cabecera: categoría (pastilla con icono + color) y borrar */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${catColor}1f`, color: catColor }}
                    title={cat ? categoryLabel(cat.slug) : '—'}
                  >
                    <CatIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{cat ? categoryLabel(cat.slug) : '—'}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); setDeleteId(r.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>

                {/* Condiciones */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{t('rules.cond.contains')}</span>
                    <span className="truncate font-mono uppercase" title={r.keyword}>{r.keyword}</span>
                  </div>
                  {amount ? (
                    <div className="flex items-baseline gap-2">
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">{t('rules.cond.amount')}</span>
                      <span className="truncate">{amount}</span>
                    </div>
                  ) : (
                    /* Fila invisible: reserva la altura para que todas las tarjetas
                       midan lo mismo, tengan o no condición de importe. */
                    <div className="invisible flex items-baseline gap-2" aria-hidden="true">
                      <span className="w-16 shrink-0 text-xs">{t('rules.cond.amount')}</span>
                      <span>—</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Diálogo crear / editar */}
      <Dialog open={dialogOpen} onOpenChange={o => !o && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRule ? t('rules.edit') : t('rules.create_title')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('rules.fields.keyword')}</Label>
              <Input value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder={t('rules.fields.keyword_placeholder')} maxLength={LIMITS.keyword} />
              <p className="text-xs text-muted-foreground">{t('rules.fields.keyword_help')}</p>
            </div>

            {/* Condición de importe (opcional) */}
            <div className="space-y-1.5">
              <Label>{t('rules.fields.amount')} <span className="font-normal text-muted-foreground">· {t('rules.fields.optional')}</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input type="number" inputMode="decimal" step="0.01" placeholder={t('rules.fields.amount_min')} value={form.amount_min} onChange={e => setForm(f => ({ ...f, amount_min: e.target.value }))} />
                  <p className="text-[11px] text-muted-foreground">{t('rules.fields.amount_min_help')}</p>
                </div>
                <div className="space-y-1">
                  <Input type="number" inputMode="decimal" step="0.01" placeholder={t('rules.fields.amount_max')} value={form.amount_max} onChange={e => setForm(f => ({ ...f, amount_max: e.target.value }))} />
                  <p className="text-[11px] text-muted-foreground">{t('rules.fields.amount_max_help')}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('rules.fields.amount_note')}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('rules.fields.type')}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as RuleType, group_id: '', category_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasto">{tc('transaction_type.gasto')}</SelectItem>
                  <SelectItem value="ingreso">{tc('transaction_type.ingreso')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type && (
              <div className="space-y-1.5">
                <Label>{t('rules.fields.category_group')}</Label>
                <Select value={form.group_id} onValueChange={v => setForm(f => ({ ...f, group_id: v, category_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{dialogGroups.map(g => <SelectItem key={g.id} value={g.id}>{tcat(`category_group.${g.slug}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {form.group_id && (
              <div className="space-y-1.5">
                <Label>{t('rules.fields.category')}</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{dialogCats.map(c => <SelectItem key={c.id} value={c.id}>{categoryLabel(c.slug)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('actions.cancel')}</Button>
            <Button onClick={saveRule} disabled={saving || !form.keyword.trim() || !form.category_id}>
              {saving ? tc('actions.loading') : tc('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tc('confirm_delete.title')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('rules.delete_confirm')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{tc('confirm_delete.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{tc('confirm_delete.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rulesLimit.limit != null && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          dimension="rules"
          plan={rulesLimit.plan!}
          limit={rulesLimit.limit}
        />
      )}
    </div>
  )
}

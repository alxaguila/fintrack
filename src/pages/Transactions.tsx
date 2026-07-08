import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, FilterX, Check, CheckCheck, Euro } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { useTransactions, useTransactionCounts, useMarkFilteredAsRead, type TransactionFilters } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories, useCategoryGroups } from '@/hooks/useCategories'
import { useUpdateTransaction, invalidateTransactionData } from '@/hooks/useTransactions'
import { useCreateKeywordRule } from '@/hooks/useKeywordRules'
import { upsertCommunityVote, ruleCommunityKey } from '@/hooks/useCommunityRules'
import { merchantKey } from '@/lib/categoryRules'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import { keywordSchema, firstError, LIMITS } from '@/lib/validation'
import type { Transaction, TransactionType } from '@/lib/database.types'

const PAGE_SIZE = 50

// Paleta de marca (igual que el Dashboard): teal = ingreso, rosa palo = gasto.
const C_INCOME = '#14B8A6'
const C_EXPENSE = '#CB6391'

// Estilo del badge de Tipo en la tabla, por tipo de movimiento.
const TYPE_BADGE: Record<TransactionType, string> = {
  ingreso: 'border-green-500 bg-green-500/10 text-green-600',
  gasto: 'border-rose-500 bg-rose-500/10 text-rose-600',
  no_computable: 'border-slate-400 bg-slate-400/10 text-slate-500',
}

// Convierte un texto de importe en número (o null si vacío/ inválido).
function parseAmountInput(s: string): number | null {
  const n = Number(s.trim().replace(',', '.'))
  return s.trim() === '' || isNaN(n) ? null : n
}

/**
 * Aplica en SERVIDOR los filtros de una regla (perfil + concepto contiene +
 * importe en valor absoluto entre min/max) a un builder de PostgREST. Sirve para
 * el recuento (select head) y para la reclasificación (update), evitando traer
 * el histórico al cliente y el tope de 1000 filas de un escaneo local.
 */
function applyRuleFilters(
  q: any,
  opts: { profileId: string; keyword: string; min: number | null; max: number | null },
): any {
  let out = q.eq('profile_id', opts.profileId).ilike('concept', `%${opts.keyword}%`)
  // |amount| <= max  →  -max <= amount <= max
  if (opts.max != null) out = out.gte('amount', -opts.max).lte('amount', opts.max)
  // |amount| >= min  →  amount >= min  OR  amount <= -min
  if (opts.min != null) out = out.or(`amount.gte.${opts.min},amount.lte.${-opts.min}`)
  return out
}

// Minúsculas + sin acentos, para casar nombres de (sub)categoría con la búsqueda.
function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default function Transactions() {
  const { t } = useTranslation('transactions')
  const { t: tc } = useTranslation('common')
  const { t: tcat } = useTranslation('categories')
  const qc = useQueryClient()
  const { activeProfile } = useProfile()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const f: TransactionFilters = {}
    const cat = searchParams.get('categoryId'); if (cat) f.categoryId = cat
    const df = searchParams.get('dateFrom'); if (df) f.dateFrom = df
    const dt = searchParams.get('dateTo'); if (dt) f.dateTo = dt
    const ty = searchParams.get('transactionType'); if (ty) f.transactionType = ty as TransactionType
    const acc = searchParams.get('accountId'); if (acc) f.accountId = acc
    if (searchParams.get('uncategorized') === 'true') f.uncategorized = true
    return f
  })
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryTx, setCategoryTx] = useState<Transaction | null>(null)
  const [selGroupId, setSelGroupId] = useState('')
  const [selCategoryId, setSelCategoryId] = useState('')
  const [selType, setSelType] = useState<TransactionType | ''>('')
  const [similarIds, setSimilarIds] = useState<string[]>([])
  // Comentario libre del movimiento (col. notes). `noteOpen` controla si el
  // campo está desplegado en el diálogo (abierto por defecto si ya hay nota).
  const [noteText, setNoteText] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  // Paso 2 del diálogo: preview editable de la regla antes de confirmarla.
  const [rulePreview, setRulePreview] = useState(false)
  const [ruleKeyword, setRuleKeyword] = useState('')
  const [ruleAmountMin, setRuleAmountMin] = useState('')
  const [ruleAmountMax, setRuleAmountMax] = useState('')
  const [ruleMatchCount, setRuleMatchCount] = useState<number | null>(null)
  const createRule = useCreateKeywordRule()

  const NOTE_MAX = 50

  const { data: counts } = useTransactionCounts(activeProfile?.id)
  // Incluimos archivadas para poder etiquetar movimientos de cuentas ya ocultas;
  // el desplegable de filtro solo lista las activas (ver más abajo).
  const { data: accounts = [] } = useAccounts(activeProfile?.id, { includeArchived: true })
  const { data: categories = [] } = useCategories()
  const { data: groups = [] } = useCategoryGroups()
  const updateTx = useUpdateTransaction()
  const markAllRead = useMarkFilteredAsRead()

  // Ids de (sub)categorías cuyo nombre —o el de su grupo— casa con la búsqueda.
  // La resolución es en cliente (el nombre es i18n); luego la query casa concepto
  // OR category_id. Respeta las comillas dobles (palabra completa).
  const searchCategoryIds = useMemo(() => {
    const raw = search.trim()
    if (!raw) return [] as string[]
    const isQuoted = raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')
    const term = normalizeText(isQuoted ? raw.slice(1, -1).trim() : raw)
    if (!term) return []
    const wordRe = isQuoted ? new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) : null
    const hit = (label: string) => {
      const l = normalizeText(label)
      return wordRe ? wordRe.test(l) : l.includes(term)
    }
    const groupById = new Map(groups.map(g => [g.id, g]))
    return categories
      .filter(c => {
        const grp = groupById.get(c.group_id)
        const gLabel = grp ? tcat(`category_group.${grp.slug}`) : ''
        return hit(categoryLabel(c.slug)) || (!!gLabel && hit(gLabel))
      })
      .map(c => c.id)
  }, [search, categories, groups, tcat])

  const { data: result, isLoading } = useTransactions(
    activeProfile?.id,
    { ...filters, search: search || undefined, searchCategoryIds: searchCategoryIds.length ? searchCategoryIds : undefined },
    page,
  )

  const transactions = result?.transactions ?? []
  const total = result?.total ?? 0

  // 3-way reviewed filter state derived from filters.isReviewed
  const reviewedMode: 'all' | 'reviewed' | 'unreviewed' =
    filters.isReviewed === true ? 'reviewed' : filters.isReviewed === false ? 'unreviewed' : 'all'

  function setReviewedMode(mode: 'all' | 'reviewed' | 'unreviewed') {
    setFilters(f => ({ ...f, isReviewed: mode === 'all' ? undefined : mode === 'reviewed' }))
    setPage(0)
  }

  function clearFilters() {
    setFilters({})
    setSearch('')
    setPage(0)
  }

  // ¿Hay algún filtro activo? (para habilitar "Limpiar filtros")
  const hasActiveFilters = !!(
    filters.accountId || filters.transactionType || filters.uncategorized ||
    filters.dateFrom || filters.dateTo || filters.amountMin != null || filters.amountMax != null ||
    filters.isReviewed != null || search
  )

  async function openCategoryDialog(tx: Transaction) {
    setCategoryTx(tx)
    setRulePreview(false)
    // Abrir un movimiento lo marca como leído (estilo WhatsApp).
    if (!tx.is_reviewed) updateTx.mutate({ id: tx.id, is_reviewed: true })
    // Comentario: si el movimiento ya tiene nota, el campo se muestra desplegado.
    setNoteText(tx.notes ?? '')
    setNoteOpen(!!tx.notes)
    // Tipo por defecto: si el movimiento ya está revisado respetamos lo guardado;
    // si no, lo sugerimos por el signo del importe (positivo → ingreso, negativo → gasto).
    const signType: TransactionType = tx.amount < 0 ? 'gasto' : 'ingreso'
    const type: TransactionType = tx.is_reviewed ? (tx.transaction_type ?? signType) : signType
    const existing = categories.find(c => c.id === tx.category_id)
    // Solo conservamos la categoría guardada si su grupo concuerda con el Tipo resultante;
    // así un ingreso positivo no arrastra una categoría de gasto mal asignada.
    const keepCat = !!existing && existing.group?.type === type
    setSelGroupId(keepCat ? (existing!.group_id ?? '') : '')
    setSelCategoryId(keepCat ? (tx.category_id ?? '') : '')
    setSelType(type)
    // Buscar movimientos "claramente similares" (misma clave de comercio)
    setSimilarIds([tx.id])
    const key = merchantKey(tx.concept)
    if (key && activeProfile) {
      const { data } = await supabase
        .from('transactions')
        .select('id,concept')
        .eq('profile_id', activeProfile.id)
      const ids = ((data ?? []) as { id: string; concept: string }[])
        .filter(r => merchantKey(r.concept) === key)
        .map(r => r.id)
      if (ids.length) setSimilarIds(ids)
    }
  }

  // Clave de comercio del movimiento abierto: si existe, se puede crear regla
  const ruleKey = categoryTx ? merchantKey(categoryTx.concept) : ''
  const canCreateRule = !!ruleKey
  // El comentario cambió respecto al guardado → permite guardar solo la nota.
  const noteChanged = !!categoryTx && (noteText.trim() || null) !== (categoryTx.notes ?? null)
  const canSave = !!selCategoryId || noteChanged

  // Movimientos del perfil que casarían con la regla en construcción (preview):
  // concepto contiene el texto Y el importe (abs) cumple los límites opcionales.
  // Recuento en SERVIDOR de los movimientos que casarían la regla (head count),
  // debounced al editar. Evita el tope de 1000 filas de un escaneo en cliente.
  useEffect(() => {
    if (!rulePreview || !activeProfile) return
    const kw = ruleKeyword.trim()
    if (!kw) { setRuleMatchCount(0); return }
    const min = parseAmountInput(ruleAmountMin)
    const max = parseAmountInput(ruleAmountMax)
    let cancelled = false
    setRuleMatchCount(null)
    const timer = setTimeout(async () => {
      const base = supabase.from('transactions').select('*', { count: 'exact', head: true })
      const { count, error } = await applyRuleFilters(base, { profileId: activeProfile.id, keyword: kw, min, max })
      if (!cancelled && !error) setRuleMatchCount(count ?? 0)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [rulePreview, ruleKeyword, ruleAmountMin, ruleAmountMax, activeProfile])

  /**
   * Aplica la categoría a los movimientos indicados. Si `createRuleFlag`, además
   * guarda una keyword_rule para el comercio y aporta un voto a la comunidad.
   */
  async function applyCategory(targetIds: string[], createRuleFlag: boolean) {
    if (!categoryTx) return
    const catId = selCategoryId || null
    const hasCat = !!selCategoryId
    // El comentario se guarda solo en el movimiento abierto (no se propaga a los
    // similares), y únicamente si ha cambiado respecto al valor original.
    const noteVal = noteText.trim() || null
    const noteChanged = noteVal !== (categoryTx.notes ?? null)
    // El tipo guardado siempre debe concordar con la categoría elegida: si hay
    // categoría, lo derivamos del tipo de su grupo (vía group_id, sin depender del
    // embed); si no, usamos el Tipo seleccionado.
    const selCat = categories.find(c => c.id === selCategoryId)
    const selGroupType = selCat ? groups.find(g => g.id === selCat.group_id)?.type : undefined
    const txType = ((selGroupType ?? selType) || null) as TransactionType | null
    try {
      // Aplicar categoría (y marcar como leído) solo si hay categoría elegida.
      if (hasCat) {
        const { error } = await supabase
          .from('transactions')
          .update({ category_id: catId, transaction_type: txType, is_reviewed: true, updated_at: new Date().toISOString() })
          .in('id', targetIds)
        if (error) throw error

        // Aprender: crear regla para futuras importaciones + votar en la comunidad
        if (createRuleFlag && ruleKey && catId) {
          try {
            await createRule.mutateAsync({ keyword: ruleKey, match_type: 'contains', category_id: catId, priority: 50, is_active: true, user_id: '', profile_id: null } as any)
            await upsertCommunityVote(ruleKey, catId)
          } catch (e) { console.warn('[Transactions] create rule failed:', e) }
        }
      }

      // Guardar el comentario (solo en el movimiento abierto).
      if (noteChanged) {
        const { error } = await supabase
          .from('transactions')
          .update({ notes: noteVal, updated_at: new Date().toISOString() })
          .eq('id', categoryTx.id)
        if (error) throw error
      }

      invalidateTransactionData(qc)
      await qc.invalidateQueries({ queryKey: ['keyword_rules'] })
      await qc.invalidateQueries({ queryKey: ['community_rules'] })
      toast({ variant: 'success', title: t('category_dialog.saved', { count: hasCat ? targetIds.length : 1 }) })
    } catch (err: any) {
      toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
    }
    closeDialog()
  }

  function applyOnlyThis() {
    if (categoryTx) applyCategory([categoryTx.id], false)
  }

  // Guarda SOLO la nota (acción independiente de la categoría) sin cerrar el
  // diálogo. Actualiza el tx en estado para que el enlace "Guardar" se desactive.
  async function saveNoteOnly() {
    if (!categoryTx) return
    const noteVal = noteText.trim() || null
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ notes: noteVal, updated_at: new Date().toISOString() })
        .eq('id', categoryTx.id)
      if (error) throw error
      invalidateTransactionData(qc)
      setCategoryTx({ ...categoryTx, notes: noteVal })
      toast({ variant: 'success', title: t('category_dialog.note_saved') })
    } catch (err: any) {
      toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
    }
  }

  // Paso 1 → Paso 2: abre la preview de la regla con valores por defecto y carga
  // los movimientos del perfil para poder contar/aplicar los que casen.
  function goToRulePreview() {
    if (!categoryTx) return
    // Palabras clave e importe arrancan vacíos (no existen en el paso 1); en cambio
    // Tipo/Categoría/Subcategoría se conservan tal cual los dejaste en el paso 1.
    // El recuento de coincidencias lo calcula el efecto (en servidor).
    setRuleKeyword('')
    setRuleAmountMin('')
    setRuleAmountMax('')
    setRuleMatchCount(null)
    setRulePreview(true)
  }

  // Paso 2: crea la regla con los valores (editables) de la preview, vota en la
  // comunidad si procede y reclasifica todos los movimientos que casan.
  async function confirmRule() {
    if (!categoryTx || !selCategoryId || !activeProfile) return
    const keyword = ruleKeyword.trim()
    if (!keyword) return
    // Validación (defensa en profundidad): longitud de la keyword.
    if (firstError(keywordSchema.safeParse(keyword))) {
      toast({ variant: 'destructive', title: tc('errors.invalid_input') })
      return
    }
    const catId = selCategoryId
    const amount_min = parseAmountInput(ruleAmountMin)
    const amount_max = parseAmountInput(ruleAmountMax)
    const selCat = categories.find(c => c.id === catId)
    const selGroupType = selCat ? groups.find(g => g.id === selCat.group_id)?.type : undefined
    const txType = ((selGroupType ?? selType) || null) as TransactionType | null
    try {
      await createRule.mutateAsync({ keyword, match_type: 'contains', category_id: catId, amount_min, amount_max, priority: 50, is_active: true, user_id: '', profile_id: null } as any)
      await upsertCommunityVote(ruleCommunityKey({ keyword, match_type: 'contains', amount_min, amount_max }), catId)

      // Reclasificar en servidor todos los que casan (mismos filtros que el
      // recuento). El UPDATE afecta a todas las filas coincidentes, sin traer ids
      // ni chocar con el tope de 1000.
      const upd = supabase
        .from('transactions')
        .update({ category_id: catId, transaction_type: txType, is_reviewed: true, updated_at: new Date().toISOString() })
      const { error: updErr } = await applyRuleFilters(upd, { profileId: activeProfile.id, keyword, min: amount_min, max: amount_max })
      if (updErr) throw updErr

      // Guardar el comentario del movimiento abierto si cambió.
      const noteVal = noteText.trim() || null
      if (noteVal !== (categoryTx.notes ?? null)) {
        await supabase.from('transactions').update({ notes: noteVal, updated_at: new Date().toISOString() }).eq('id', categoryTx.id)
      }

      invalidateTransactionData(qc)
      await qc.invalidateQueries({ queryKey: ['keyword_rules'] })
      await qc.invalidateQueries({ queryKey: ['community_rules'] })
      toast({ variant: 'success', title: t('category_dialog.saved', { count: ruleMatchCount ?? 1 }) })
    } catch (err: any) {
      toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
    }
    closeDialog()
  }

  function closeDialog() {
    setRulePreview(false)
    setCategoryTx(null)
  }

  async function handleMarkAllRead() {
    if (!activeProfile) return
    try {
      await markAllRead.mutateAsync({ profileId: activeProfile.id, filters: { ...filters, search: search || undefined, searchCategoryIds: searchCategoryIds.length ? searchCategoryIds : undefined } })
      toast({ variant: 'success', title: t('mark_all_read.done') })
    } catch (err: any) {
      toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
    }
  }

  async function toggleReviewed(tx: Transaction, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await updateTx.mutateAsync({ id: tx.id, is_reviewed: !tx.is_reviewed })
    } catch {
      toast({ variant: 'destructive', title: tc('errors.save_failed') })
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
            <FilterX className="h-4 w-4" />
            {t('filters.clear_filters')}
          </Button>
        </div>
      </div>

      {/* Filas 1 y 2 juntas (buscador/selección arriba, rangos debajo) */}
      <div className="space-y-2">
        {/* Fila 1: búsqueda + cuenta + tipo (campos en blanco) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="bg-card pl-9"
              placeholder={t('filters.search_placeholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
          </div>
          <Select
            value={filters.accountId ?? '__all__'}
            onValueChange={v => { setFilters(f => ({...f, accountId: v === '__all__' ? undefined : v})); setPage(0) }}
          >
            <SelectTrigger className="w-44 bg-card"><SelectValue placeholder={t('filters.all_accounts')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filters.all_accounts')}</SelectItem>
              {accounts.filter(a => a.is_active).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.transactionType ?? '__all__'}
            onValueChange={v => { setFilters(f => ({...f, transactionType: v === '__all__' ? undefined : v as TransactionType})); setPage(0) }}
          >
            <SelectTrigger className="w-40 bg-card"><SelectValue placeholder={t('filters.all_types')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filters.all_types')}</SelectItem>
              <SelectItem value="gasto">{tc('transaction_type.gasto')}</SelectItem>
              <SelectItem value="ingreso">{tc('transaction_type.ingreso')}</SelectItem>
              <SelectItem value="no_computable">{tc('transaction_type.no_computable')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fila 2: rangos (fechas + importes), siempre visibles y del mismo ancho.
            El label va dentro del campo como placeholder atenuado. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DatePickerField
            value={filters.dateFrom}
            placeholder={t('filters.date_from')}
            onChange={v => { setFilters(f => ({...f, dateFrom: v})); setPage(0) }}
          />
          <DatePickerField
            value={filters.dateTo}
            placeholder={t('filters.date_to')}
            onChange={v => { setFilters(f => ({...f, dateTo: v})); setPage(0) }}
          />
          <div className="relative">
            <Input type="number" placeholder={t('filters.amount_min')} className="bg-card pr-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={filters.amountMin ?? ''} onChange={e => { setFilters(f => ({...f, amountMin: e.target.value ? Number(e.target.value) : undefined})); setPage(0) }} />
            <Euro className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input type="number" placeholder={t('filters.amount_max')} className="bg-card pr-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={filters.amountMax ?? ''} onChange={e => { setFilters(f => ({...f, amountMax: e.target.value ? Number(e.target.value) : undefined})); setPage(0) }} />
            <Euro className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Fila 3 (justo encima de la tabla): estado + sin categoría + marcar todo */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-card p-0.5 text-sm">
          {(['all', 'unreviewed', 'reviewed'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setReviewedMode(mode)}
              className={`rounded-md px-2.5 py-0.5 transition-colors ${reviewedMode === mode ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t(`reviewed_filter.${mode}`)}
              {mode === 'unreviewed' && !!counts?.unread && (
                <span className="ml-1 font-semibold text-[#CB6391]">({counts.unread})</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setFilters(f => ({ ...f, uncategorized: f.uncategorized ? undefined : true })); setPage(0) }}
          className={`rounded-lg border px-2.5 py-1 text-sm transition-colors ${filters.uncategorized ? 'border-primary bg-primary/10 font-medium text-primary' : 'bg-card text-muted-foreground hover:text-foreground'}`}
        >
          {t('filters.uncategorized')}
          {!!counts?.uncategorized && (
            <span className="ml-1 font-semibold text-[#CB6391]">({counts.uncategorized})</span>
          )}
        </button>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleMarkAllRead}
          disabled={!counts?.unread || markAllRead.isPending}
        >
          <CheckCheck className="h-4 w-4" />
          {t('mark_all_read.button')}
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="w-6 px-2 py-3" aria-hidden />
              <th className="px-4 py-3 text-left font-medium">{t('columns.date')}</th>
              <th className="px-4 py-3 text-left font-medium md:min-w-[360px] lg:min-w-[480px]">{t('columns.concept')}</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t('columns.entity')}</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t('columns.category')}</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{t('columns.type')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('columns.amount')}</th>
              <th className="px-4 py-3 text-center font-medium">{t('columns.reviewed')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({length: 8}).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-3" />
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 md:min-w-[360px] lg:min-w-[480px]"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                  </tr>
                ))
              : transactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id)
                  const grp = groups.find(g => g.id === cat?.group_id)
                  const account = accounts.find(a => a.id === tx.account_id)
                  // Pastilla de categoría: icono + color del grupo (igual que el Dashboard).
                  const CatIcon = categoryIcon(cat?.icon)
                  const catColor = grp?.color ?? '#94a3b8'
                  return (
                    <tr key={tx.id} className={`border-t cursor-pointer transition-colors ${tx.is_reviewed ? 'bg-muted/40 text-muted-foreground hover:bg-muted/60' : 'hover:bg-muted/20'}`} onClick={() => openCategoryDialog(tx)}>
                      <td className="px-2 py-3 text-center">
                        {!tx.is_reviewed && (
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500" title={t('row.pending')} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 max-w-[180px] sm:max-w-[240px] md:max-w-[360px] lg:max-w-[480px]">
                        <div className="truncate font-mono uppercase">{tx.concept}</div>
                        {tx.notes && (
                          <div className="truncate text-xs font-normal normal-case text-muted-foreground">{tx.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{account?.entity ?? '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${catColor}1f`, color: catColor }}
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                          {cat ? categoryLabel(cat.slug) : t('row.uncategorized')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {tx.transaction_type && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[tx.transaction_type]}`}>
                            {tc(`transaction_type.${tx.transaction_type}`)}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-medium"
                        style={{ color: tx.transaction_type === 'no_computable' ? '#64748b' : tx.amount < 0 ? C_EXPENSE : C_INCOME }}
                      >
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={e => toggleReviewed(tx, e)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${tx.is_reviewed ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-muted-foreground/30 text-muted-foreground hover:border-green-400 hover:text-green-600'}`}
                        >
                          {tx.is_reviewed ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          {tx.is_reviewed ? t('row.reviewed') : t('row.pending')}
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
        {!isLoading && transactions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>{t('empty.description')}</p>
          </div>
        )}
      </div>

      {/* Total (siempre visible bajo la tabla) + paginación cuando procede */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total > PAGE_SIZE
              ? t('pagination.showing', { from: page * PAGE_SIZE + 1, to: Math.min((page + 1) * PAGE_SIZE, total), total })
              : t('summary.count', { count: total })}
          </p>
          {total > PAGE_SIZE && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('pagination.previous')}</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>{t('pagination.next')}</Button>
            </div>
          )}
        </div>
      )}

      {/* Category dialog */}
      <Dialog open={!!categoryTx} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="break-words font-mono text-base uppercase text-foreground">
              {categoryTx?.concept}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview de la regla (paso 2): texto e importe editables */}
            {rulePreview && (
              <>
                <div className="space-y-1.5">
                  <Label>{t('rules.fields.keyword')}</Label>
                  <Input className="bg-card" value={ruleKeyword} onChange={e => setRuleKeyword(e.target.value)} placeholder={t('rules.fields.keyword_placeholder')} maxLength={LIMITS.keyword} />
                  <p className="text-xs text-muted-foreground">{t('rules.fields.keyword_help')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('rules.fields.amount')} <span className="font-normal text-muted-foreground">· {t('rules.fields.optional')}</span></Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input className="bg-card" type="number" inputMode="decimal" step="0.01" placeholder={t('rules.fields.amount_min')} value={ruleAmountMin} onChange={e => setRuleAmountMin(e.target.value)} />
                    <Input className="bg-card" type="number" inputMode="decimal" step="0.01" placeholder={t('rules.fields.amount_max')} value={ruleAmountMax} onChange={e => setRuleAmountMax(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('rules.fields.amount_note')}</p>
                </div>
              </>
            )}

            {/* Nota — solo en el paso 1 (pertenece al movimiento, no a la regla). */}
            {!rulePreview && (
            <div>
              {noteOpen ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>{t('category_dialog.note_label')}</Label>
                    <button
                      type="button"
                      onClick={saveNoteOnly}
                      disabled={!noteChanged}
                      className="text-sm text-primary underline underline-offset-4 hover:opacity-80 disabled:opacity-40 disabled:no-underline"
                    >
                      {tc('actions.save')}
                    </button>
                  </div>
                  <Input
                    className="bg-card"
                    maxLength={NOTE_MAX}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder={t('category_dialog.note_placeholder')}
                    autoFocus
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {t('category_dialog.note_counter', { count: NOTE_MAX - noteText.length })}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {t('category_dialog.add_note')}
                </button>
              )}
            </div>
            )}

            {/* Separación a sangre (toca los bordes del diálogo) entre
                concepto+nota y la zona de categorización. */}
            <Separator className="-mx-6 w-auto bg-slate-300" />

            <div className="space-y-1.5">
              <Label>{t('category_dialog.type')}</Label>
              <Select value={selType} onValueChange={v => { setSelType(v as TransactionType); setSelGroupId(''); setSelCategoryId('') }}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasto">{tc('transaction_type.gasto')}</SelectItem>
                  <SelectItem value="ingreso">{tc('transaction_type.ingreso')}</SelectItem>
                  <SelectItem value="no_computable">{tc('transaction_type.no_computable')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('category_dialog.select_group')}</Label>
              <CategoryCombobox
                type={selType}
                groups={groups}
                categories={categories}
                value={selCategoryId}
                onChange={(catId, groupId) => { setSelCategoryId(catId); setSelGroupId(groupId) }}
              />
            </div>

            {/* Paso 2: cuántos movimientos casan. Paso 1: pista de "crear regla". */}
            {rulePreview ? (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">
                  {ruleMatchCount == null
                    ? t('category_dialog.rule_counting')
                    : t('category_dialog.rule_apply_count', { count: ruleMatchCount })}
                </span>
              </p>
            ) : canCreateRule ? (
              <p className="text-xs text-muted-foreground">
                {similarIds.length > 1
                  ? t('category_dialog.rule_hint_similar', { count: similarIds.length })
                  : t('category_dialog.rule_hint')}
              </p>
            ) : null}
          </div>
          <DialogFooter className="sm:justify-between sm:items-center gap-2">
            {rulePreview ? (
              <>
                <Button variant="outline" onClick={() => setRulePreview(false)}>{tc('actions.back')}</Button>
                <Button onClick={confirmRule} disabled={!selCategoryId || !ruleKeyword.trim()}>{tc('actions.confirm')}</Button>
              </>
            ) : canCreateRule ? (
              <>
                <button
                  onClick={applyOnlyThis}
                  disabled={!canSave}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50 disabled:no-underline"
                >
                  {t('category_dialog.apply_only_this')}
                </button>
                <Button onClick={goToRulePreview} disabled={!selCategoryId}>
                  {t('category_dialog.create_rule_button')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>{tc('actions.cancel')}</Button>
                <Button onClick={applyOnlyThis} disabled={!canSave}>{t('category_dialog.save')}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

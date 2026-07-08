import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Transaction, TransactionType } from '@/lib/database.types'

/**
 * Invalida TODAS las consultas derivadas de movimientos (lista, mes y las
 * agregaciones del dashboard) para que las vistas dinámicas se recalculen.
 * Llamar siempre que se cambie tipo/categoría/subcategoría de un movimiento,
 * se aplique/cree una regla o se importe un fichero.
 */
export function invalidateTransactionData(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['transactions'] })
  qc.invalidateQueries({ queryKey: ['transactions_counts'] })
  qc.invalidateQueries({ queryKey: ['transactions_month'] })
  qc.invalidateQueries({ queryKey: ['dashboard_totals'] })
  qc.invalidateQueries({ queryKey: ['dashboard_breakdown'] })
}

export interface TransactionFilters {
  accountId?: string
  categoryId?: string
  transactionType?: TransactionType
  dateFrom?: string
  dateTo?: string
  search?: string
  amountMin?: number
  amountMax?: number
  isReviewed?: boolean
  uncategorized?: boolean
  // Ids de (sub)categorías cuyo nombre casa con la búsqueda (resueltos en el
  // cliente, porque el nombre es i18n). La búsqueda casa concepto OR categoría.
  searchCategoryIds?: string[]
}

const PAGE_SIZE = 50

// Escapa los metacaracteres de una regex POSIX (para búsqueda por palabra exacta).
function escapePgRegex(s: string): string {
  return s.replace(/[.^$*+?()[\]{}|\\]/g, '\\$&')
}

/**
 * Aplica el filtro de búsqueda. Casa por CONCEPTO y, además, por (sub)categoría
 * (los ids se resuelven en el cliente porque el nombre es i18n). Si el texto va
 * entre comillas dobles ("bar"), el concepto casa por PALABRA COMPLETA (límites
 * `\y`, insensible a mayúsculas → "bar" no casa "barcelona"); si no, subcadena.
 */
function applyConceptSearch(q: any, search: string, categoryIds: string[] = []): any {
  const s = search.trim()
  const isQuoted = s.length >= 2 && s.startsWith('"') && s.endsWith('"')
  const term = isQuoted ? s.slice(1, -1).trim() : s
  if (!term) return q

  // Condición de concepto en formato de or() de PostgREST (patrón probado: valor
  // sin comillas). - con comillas dobles en la búsqueda: ~* con límite de palabra
  // `\y`; - si no: ilike por subcadena `%term%`.
  const conceptCond = isQuoted
    ? `concept.imatch.\\y${escapePgRegex(term)}\\y`
    : `concept.ilike.%${term}%`

  if (categoryIds.length === 0) {
    // Sin categorías que casen → una sola condición (más robusta que or()).
    return isQuoted
      ? q.filter('concept', 'imatch', `\\y${escapePgRegex(term)}\\y`)
      : q.ilike('concept', `%${term}%`)
  }
  return q.or(`${conceptCond},category_id.in.(${categoryIds.join(',')})`)
}

/**
 * Aplica los filtros activos a un builder de PostgREST. Sirve tanto para la
 * consulta de la lista (select) como para acciones masivas (update), porque
 * ambos comparten los mismos métodos de filtro (.eq/.gte/.lte/.ilike/.is).
 */
function applyTransactionFilters(query: any, filters: TransactionFilters): any {
  let q = query
  if (filters.accountId)        q = q.eq('account_id', filters.accountId)
  if (filters.categoryId)       q = q.eq('category_id', filters.categoryId)
  if (filters.transactionType)  q = q.eq('transaction_type', filters.transactionType)
  if (filters.dateFrom)         q = q.gte('date', filters.dateFrom)
  if (filters.dateTo)           q = q.lte('date', filters.dateTo)
  if (filters.amountMin != null) q = q.gte('amount', filters.amountMin)
  if (filters.amountMax != null) q = q.lte('amount', filters.amountMax)
  if (filters.isReviewed != null) q = q.eq('is_reviewed', filters.isReviewed)
  if (filters.uncategorized)    q = q.is('category_id', null)
  if (filters.search)           q = applyConceptSearch(q, filters.search, filters.searchCategoryIds)
  return q
}

export function useTransactions(profileId?: string, filters: TransactionFilters = {}, page = 0) {
  return useQuery({
    queryKey: ['transactions', profileId, filters, page],
    enabled: !!profileId,
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, account:accounts(id,name,entity,color,type), category:categories(id,slug,group_id)', { count: 'exact' })
        .eq('profile_id', profileId!)
        // Orden estricto cronológico: más recientes primero.
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      query = applyTransactionFilters(query, filters)

      const { data, error, count } = await query
      if (error) throw error
      return { transactions: data as Transaction[], total: count ?? 0 }
    },
  })
}

/**
 * Totales globales del perfil para los botones de filtro (no leídos y sin
 * categoría). Independientes de los filtros activos: dan sensación de "backlog
 * por revisar". Cuentas en cabecera (head: true), sin traer filas.
 */
export function useTransactionCounts(profileId?: string) {
  return useQuery({
    queryKey: ['transactions_counts', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const base = () =>
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('profile_id', profileId!)
      const [unread, uncat] = await Promise.all([
        base().eq('is_reviewed', false),
        base().is('category_id', null),
      ])
      if (unread.error) throw unread.error
      if (uncat.error) throw uncat.error
      return { unread: unread.count ?? 0, uncategorized: uncat.count ?? 0 }
    },
  })
}

/**
 * Marca como leídos todos los no leídos que cuadran con los filtros activos
 * (acción del botón "Marcar todo como leído"). Solo afecta a is_reviewed=false.
 */
export function useMarkFilteredAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profileId, filters }: { profileId: string; filters: TransactionFilters }) => {
      let q = supabase
        .from('transactions')
        .update({ is_reviewed: true, updated_at: new Date().toISOString() })
        .eq('profile_id', profileId)
        .eq('is_reviewed', false)
      q = applyTransactionFilters(q, filters)
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => invalidateTransactionData(qc),
  })
}

// ── Agregaciones del Dashboard ───────────────────────────────────────────
// La agregación se hace en la base de datos (vistas v_dashboard_*), de modo
// que cada consulta devuelve unas pocas filas y nunca se acerca al tope de
// filas de PostgREST, sea cual sea el volumen de movimientos del perfil.

/** Fila de la serie de la gráfica: total por (mes × tipo). */
export interface DashboardTotalRow {
  month: string                         // 'YYYY-MM-DD' (día 1 del mes)
  transaction_type: TransactionType | null
  total: number                         // con signo
  total_abs: number                     // magnitud
}

/** Fila del desglose: total por (mes × subcategoría × tipo). */
export interface DashboardBreakdownRow {
  month: string                         // 'YYYY-MM-DD' (día 1 del mes)
  category_id: string | null            // null = sin categoría
  transaction_type: TransactionType | null
  total_abs: number
  count: number
}

// PostgREST puede serializar los `numeric` (SUM) como string; coaccionamos.
const num = (v: unknown) => Number(v ?? 0)

// Serie de la gráfica (todo el histórico, grano mes × tipo). Muy ligera.
export function useDashboardTotals(profileId?: string) {
  return useQuery({
    queryKey: ['dashboard_totals', profileId],
    enabled: !!profileId,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardTotalRow[]> => {
      const { data, error } = await supabase
        .from('v_dashboard_totals')
        .select('month, transaction_type, total, total_abs')
        .eq('profile_id', profileId!)
        .order('month', { ascending: true })
      if (error) throw error
      return (data ?? []).map((r: any) => ({
        month: r.month,
        transaction_type: r.transaction_type,
        total: num(r.total),
        total_abs: num(r.total_abs),
      }))
    },
  })
}

// Desglose por subcategoría del periodo activo (filtrado por rango de fechas).
// Acotado al nº de subcategorías del periodo → minúsculo. Cacheado por rango.
export function useDashboardBreakdown(profileId?: string, range?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['dashboard_breakdown', profileId, range?.from, range?.to],
    enabled: !!profileId && !!range,
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardBreakdownRow[]> => {
      const { data, error } = await supabase
        .from('v_dashboard_breakdown')
        .select('month, category_id, transaction_type, total_abs, count')
        .eq('profile_id', profileId!)
        .gte('month', range!.from)
        .lte('month', range!.to)
      if (error) throw error
      return (data ?? []).map((r: any) => ({
        month: r.month,
        category_id: r.category_id,
        transaction_type: r.transaction_type,
        total_abs: num(r.total_abs),
        count: num(r.count),
      }))
    },
  })
}

// Serie mensual de UNA subcategoría (todo el histórico), para filtrar la gráfica
// de evolución al pulsar una subcategoría. categoryId === null = "sin categoría".
export function useDashboardCategorySeries(
  profileId?: string,
  categoryId?: string | null,
  transactionType?: TransactionType,
  enabled?: boolean,
) {
  return useQuery({
    queryKey: ['dashboard_cat_series', profileId, categoryId ?? '__null__', transactionType],
    enabled: !!profileId && !!transactionType && !!enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<{ month: string; total_abs: number }[]> => {
      let q = supabase
        .from('v_dashboard_breakdown')
        .select('month, total_abs')
        .eq('profile_id', profileId!)
        .eq('transaction_type', transactionType!)
        .order('month', { ascending: true })
      q = categoryId == null ? q.is('category_id', null) : q.eq('category_id', categoryId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []).map((r: any) => ({ month: r.month, total_abs: num(r.total_abs) }))
    },
  })
}

export function useMonthTransactions(profileId?: string, month?: string) {
  return useQuery({
    queryKey: ['transactions_month', profileId, month],
    enabled: !!profileId && !!month,
    queryFn: async () => {
      const [year, m] = month!.split('-')
      const from = `${year}-${m}-01`
      const lastDay = new Date(Number(year), Number(m), 0).getDate()
      const to = `${year}-${m}-${lastDay}`

      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(id,slug,group_id,group:category_groups(id,slug,type,color))')
        .eq('profile_id', profileId!)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })

      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => invalidateTransactionData(qc),
  })
}

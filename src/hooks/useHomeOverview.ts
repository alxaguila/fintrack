import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/lib/database.types'

export interface AccountBalanceInfo {
  accountId: string
  balance: number | null
  balanceDate: string | null
  lastMovementDate: string | null
  lastImportAt: string | null
  daysSinceImport: number | null
}

/**
 * Días de calendario transcurridos desde `iso` hasta hoy.
 *
 * Se compara por FECHA de calendario (no por milisegundos transcurridos), de
 * modo que la hora del día no altera el resultado: una importación de "ayer a
 * las 23:00" cuenta como 1 día aunque hayan pasado <24h. Además, si el
 * timestamp no trae zona horaria explícita se interpreta como UTC (Supabase
 * guarda `imported_at` en UTC) para no desplazarlo según la zona del navegador.
 */
function calendarDaysSince(iso: string): number {
  const hasTz = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(iso)
  const d = new Date(hasTz ? iso : iso + 'Z')
  const then  = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - then.getTime()) / 86_400_000)
}

/**
 * Saldo actual por cuenta = `opening_balance + SUMA de los importes` (modelo de
 * saldo por suma). Se lee de la vista agregada `v_account_balances`, que suma en la
 * BD (evita el tope de 1000 filas de PostgREST). `balance` es NULL cuando la cuenta
 * no tiene saldo inicial fijado ("sin saldo"). Se añade la fecha de última
 * importación por cuenta (para el aviso "actualizado hace X días").
 */
export function useAccountBalances(profileId: string | undefined, accounts: Account[]) {
  const accountIds = accounts.map(a => a.id)
  return useQuery({
    queryKey: ['account_balances', profileId, accountIds],
    enabled: !!profileId && accounts.length > 0,
    queryFn: async (): Promise<Map<string, AccountBalanceInfo>> => {
      const [balRes, importRows] = await Promise.all([
        supabase
          .from('v_account_balances')
          .select('account_id, balance, last_movement_date')
          .eq('profile_id', profileId!),
        supabase
          .from('import_batches')
          .select('account_id, imported_at')
          .eq('profile_id', profileId!)
          .then(({ data, error }) => {
            if (error) throw error
            return data ?? []
          }),
      ])
      if (balRes.error) throw balRes.error

      const balByAccount = new Map<string, { balance: number | null; lastMovementDate: string | null }>()
      for (const r of (balRes.data ?? []) as any[]) {
        balByAccount.set(r.account_id, {
          // Number() coercion porque PostgREST puede serializar `numeric` como string
          balance: r.balance == null ? null : Number(r.balance),
          lastMovementDate: r.last_movement_date ?? null,
        })
      }

      const lastImportByAccount = new Map<string, string>()
      for (const row of importRows) {
        const prev = lastImportByAccount.get(row.account_id)
        if (!prev || row.imported_at > prev) lastImportByAccount.set(row.account_id, row.imported_at)
      }

      const map = new Map<string, AccountBalanceInfo>()
      for (const account of accounts) {
        const b = balByAccount.get(account.id)
        const lastImportAt = lastImportByAccount.get(account.id) ?? null
        const daysSinceImport = lastImportAt != null ? calendarDaysSince(lastImportAt) : null
        map.set(account.id, {
          accountId: account.id,
          balance: b?.balance ?? null,
          balanceDate: b?.lastMovementDate ?? null,
          lastMovementDate: b?.lastMovementDate ?? null,
          lastImportAt,
          daysSinceImport,
        })
      }
      return map
    },
  })
}

export interface BalanceHistoryPoint {
  date: string
  balance: number
}

export interface SpendingHistoryPoint {
  date: string  // YYYY-MM-DD (primer día del mes)
  amount: number
}

/** Redondeo a 2 decimales evitando el ruido de coma flotante. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Histórico de saldo por cuenta bancaria = saldo acumulado mes a mes desde el
 * `opening_balance`: se lee el flujo mensual (SUMA de importes por mes) de la vista
 * `v_account_monthly_flow` y se va acumulando sobre el saldo inicial. Una cuenta sin
 * `opening_balance` no produce puntos (no hay referencia desde la que acumular).
 */
export function useAccountBalanceHistory(profileId: string | undefined, accounts: Account[]) {
  const bankAccounts = accounts.filter(a => a.type === 'cuenta_corriente' || a.type === 'ahorro')
  const accountIds = bankAccounts.map(a => a.id)
  return useQuery({
    queryKey: ['account_balance_history', profileId, accountIds],
    enabled: !!profileId && bankAccounts.length > 0,
    queryFn: async (): Promise<Map<string, BalanceHistoryPoint[]>> => {
      const { data, error } = await supabase
        .from('v_account_monthly_flow')
        .select('account_id, month, flow')
        .eq('profile_id', profileId!)
        .order('month', { ascending: true })
      if (error) throw error

      // Agrupar el flujo mensual por cuenta (ya viene ordenado por mes ascendente).
      const flowByAccount = new Map<string, { month: string; flow: number }[]>()
      for (const r of (data ?? []) as any[]) {
        const arr = flowByAccount.get(r.account_id) ?? []
        arr.push({ month: r.month, flow: Number(r.flow) })
        flowByAccount.set(r.account_id, arr)
      }

      const map = new Map<string, BalanceHistoryPoint[]>()
      for (const account of bankAccounts) {
        if (account.opening_balance == null) { map.set(account.id, []); continue }
        let running = Number(account.opening_balance)
        const points: BalanceHistoryPoint[] = []
        for (const f of flowByAccount.get(account.id) ?? []) {
          running += f.flow
          points.push({ date: f.month, balance: round2(running) })
        }
        map.set(account.id, points)
      }
      return map
    },
  })
}

/** Suma de gastos en tarjetas de los últimos 30 días, por cuenta. */
export function useCardSpending30Days(profileId: string | undefined, accounts: Account[]) {
  const cardAccounts = accounts.filter(a => a.type === 'tarjeta_credito' || a.type === 'tarjeta_debito')
  const accountIds = cardAccounts.map(a => a.id)
  return useQuery({
    queryKey: ['card_spending_30d', profileId, accountIds],
    enabled: !!profileId && cardAccounts.length > 0,
    queryFn: async (): Promise<Map<string, number>> => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const sinceIso = since.toISOString().slice(0, 10)

      const results = await Promise.all(
        cardAccounts.map(async (account) => {
          const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .eq('account_id', account.id)
            .eq('transaction_type', 'gasto')
            .gte('date', sinceIso)
          if (error) throw error
          const total = (data ?? []).reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0)
          return { accountId: account.id, total }
        }),
      )

      const map = new Map<string, number>()
      for (const { accountId, total } of results) map.set(accountId, total)
      return map
    },
  })
}

/** Gasto mensual en tarjetas (histórico completo), para la gráfica. */
export function useCardSpendingHistory(profileId: string | undefined, accounts: Account[]) {
  const cardAccounts = accounts.filter(a => a.type === 'tarjeta_credito' || a.type === 'tarjeta_debito')
  const accountIds = cardAccounts.map(a => a.id)
  return useQuery({
    queryKey: ['card_spending_history', profileId, accountIds],
    enabled: !!profileId && cardAccounts.length > 0,
    queryFn: async (): Promise<Map<string, SpendingHistoryPoint[]>> => {
      const results = await Promise.all(
        cardAccounts.map(async (account) => {
          const { data, error } = await supabase
            .from('transactions')
            .select('amount, date')
            .eq('account_id', account.id)
            .eq('transaction_type', 'gasto')
            .order('date', { ascending: true })
          if (error) throw error

          const byMonth = new Map<string, number>()
          for (const row of data ?? []) {
            const month = row.date.slice(0, 7)
            byMonth.set(month, (byMonth.get(month) ?? 0) + Math.abs(Number(row.amount)))
          }
          const points = [...byMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ date: `${month}-01`, amount }))
          return { accountId: account.id, points }
        }),
      )
      const map = new Map<string, SpendingHistoryPoint[]>()
      for (const { accountId, points } of results) map.set(accountId, points)
      return map
    },
  })
}

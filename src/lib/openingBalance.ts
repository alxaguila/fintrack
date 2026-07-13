import { supabase } from '@/lib/supabase'

/**
 * Re-anclaje del `opening_balance` (modelo de saldo por suma: saldo mostrado =
 * opening_balance + Σ importes).
 *
 * Debe ejecutarse tras CUALQUIER operación que cambie los movimientos de una
 * cuenta bancaria (importar extracto, reasignar lote, borrar lote). A diferencia
 * del diseño anterior (fijar el opening solo una vez, en el primer import), aquí
 * se recalcula siempre desde el saldo conocido más reciente:
 *
 *     ancla   = movimiento con `balance` no nulo más reciente (date, created_at)
 *     opening = balance(ancla) − Σ(importes hasta el ancla, incluido)
 *
 * Así `opening + Σ(todos)` = saldo del ancla + movimientos posteriores al ancla:
 * el saldo mostrado coincide siempre con la última referencia del banco, aunque
 * los extractos lleguen desordenados, solapados, con backfill o con huecos.
 * Sirve igual para cuentas con columna de saldo en el extracto (el `balance` por
 * fila es el real del banco) y sin ella (el `balance` por fila es el calculado
 * que se guardó al importar).
 */

/** Movimientos de la cuenta en orden cronológico (paginado: PostgREST corta a 1000). */
async function fetchAccountMovementsChrono(accountId: string) {
  const pageSize = 1000
  // PostgREST puede serializar `numeric` como string en runtime; normalizamos con Number().
  const out: { amount: number; balance: number | null }[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, balance')
      .eq('account_id', accountId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    out.push(...data.map(r => ({ amount: Number(r.amount), balance: r.balance == null ? null : Number(r.balance) })))
    if (data.length < pageSize) break
  }
  return out
}

/**
 * Recalcula y guarda el `opening_balance` de una cuenta bancaria.
 *
 * - Cuenta no bancaria → no hace nada.
 * - Sin movimientos → opening_balance = NULL (la referencia pierde su base).
 * - Sin ningún saldo por fila (sin ancla) → no toca nada (no hay referencia).
 * - Con ancla → recalcula y actualiza SIEMPRE, aunque ya tuviera valor.
 */
export async function reanchorOpeningBalance(accountId: string) {
  const { data: acc, error } = await supabase
    .from('accounts')
    .select('type, opening_balance')
    .eq('id', accountId)
    .maybeSingle()
  if (error) throw error
  if (!acc || (acc.type !== 'cuenta_corriente' && acc.type !== 'ahorro')) return

  const movements = await fetchAccountMovementsChrono(accountId)

  if (movements.length === 0) {
    if (acc.opening_balance == null) return
    const { error: upErr } = await supabase.from('accounts').update({ opening_balance: null }).eq('id', accountId)
    if (upErr) throw upErr
    return
  }

  let anchorIdx = -1
  for (let i = movements.length - 1; i >= 0; i--) {
    if (movements[i].balance != null) { anchorIdx = i; break }
  }
  if (anchorIdx === -1) return // sin saldo de referencia

  let sumUpToAnchor = 0
  for (let i = 0; i <= anchorIdx; i++) sumUpToAnchor += movements[i].amount
  const opening = Math.round((movements[anchorIdx].balance! - sumUpToAnchor + Number.EPSILON) * 100) / 100

  if (acc.opening_balance != null && Number(acc.opening_balance) === opening) return
  const { error: upErr } = await supabase.from('accounts').update({ opening_balance: opening }).eq('id', accountId)
  if (upErr) throw upErr
}

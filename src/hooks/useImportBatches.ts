import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AccountType, ImportBatch } from '@/lib/database.types'

/** Lote de importación con la cuenta destino embebida (para la tabla de Historial). */
export interface ImportBatchRow extends ImportBatch {
  account: {
    id: string
    name: string
    entity: string
    type: AccountType
    is_active: boolean
  } | null
  // Rango de fechas de los movimientos del lote (agregado en BD). NULL si el lote
  // ya no tiene movimientos (p.ej. reasignados/borrados).
  date_from: string | null
  date_to: string | null
}

/**
 * Historial de subidas (lotes de importación) del perfil, con la cuenta destino
 * embebida y ordenadas de la más reciente a la más antigua.
 */
export function useImportBatches(profileId?: string) {
  return useQuery({
    queryKey: ['import_batches', profileId],
    enabled: !!profileId,
    queryFn: async (): Promise<ImportBatchRow[]> => {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*, account:accounts(id, name, entity, type, is_active)')
        .eq('profile_id', profileId!)
        .order('imported_at', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as unknown as ImportBatchRow[]

      // Rango de fechas (Desde/Hasta) de los movimientos de cada lote, agregado
      // en BD (vista v_import_batch_range) para no traer movimientos al cliente.
      const { data: ranges, error: rErr } = await supabase
        .from('v_import_batch_range')
        .select('import_batch_id, date_from, date_to')
        .eq('profile_id', profileId!)
      if (rErr) throw rErr
      const rangeById = new Map<string, { from: string; to: string }>()
      for (const r of (ranges ?? []) as { import_batch_id: string; date_from: string; date_to: string }[]) {
        rangeById.set(r.import_batch_id, { from: r.date_from, to: r.date_to })
      }

      return rows.map(b => ({
        ...b,
        date_from: rangeById.get(b.id)?.from ?? null,
        date_to: rangeById.get(b.id)?.to ?? null,
      }))
    },
  })
}

/**
 * ¿El perfil tiene al menos un extracto subido? Conteo ligero (head) para el
 * onboarding: mientras sea `false` se muestra la pastilla "sube tu primer
 * extracto". Se invalida con la clave `['import_batches']` (tras importar/borrar).
 */
export function useHasStatements(profileId?: string) {
  return useQuery({
    queryKey: ['import_batches', 'has', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('import_batches')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId!)
      if (error) throw error
      return (count ?? 0) > 0
    },
  })
}

/**
 * Purga de la caché toda query que dependa de movimientos, saldos o lotes tras un
 * borrado/reasignación. Usamos `removeQueries` (no `invalidateQueries`) a propósito:
 * `invalidateQueries` solo refresca las queries ACTIVAS (montadas); pantallas como
 * Posición Global o Análisis están desmontadas mientras se opera en Historial y se
 * quedarían con el dato cacheado. `removeQueries` borra el dato: cualquier pantalla
 * lo vuelve a leer en frío de la BD al montarse (o de inmediato si está activa).
 */
function invalidateAfterBatchChange(qc: ReturnType<typeof useQueryClient>) {
  const keys = [
    ['import_batches'],
    ['accounts'],
    ['account_balances'],
    ['account_balance_history'],
    ['card_spending_30d'],
    ['card_spending_history'],
    ['transactions'],
    ['transactions_counts'],
    ['transactions_month'],
    ['dashboard_totals'],
    ['dashboard_breakdown'],
  ]
  for (const key of keys) qc.removeQueries({ queryKey: key })
}

// ── Mantenimiento de `opening_balance` (modelo de saldo por suma) ──────────────
// El saldo inicial vive en la CUENTA, no en el extracto. Al mover/borrar hay que
// hacer que la referencia siga a los datos: si una cuenta se queda sin movimientos,
// su saldo inicial pierde sentido → NULL; si una cuenta recibe movimientos y no
// tenía saldo inicial, se deriva de los saldos por fila importados.

/** Trae los movimientos de la cuenta en orden cronológico (paginado a 1000). */
async function fetchAccountMovementsChrono(accountId: string) {
  const pageSize = 1000
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

/** Deriva y fija `opening_balance` si es cuenta bancaria y aún no lo tiene. */
async function deriveOpeningIfMissing(accountId: string) {
  const { data: acc, error } = await supabase
    .from('accounts')
    .select('type, opening_balance')
    .eq('id', accountId)
    .maybeSingle()
  if (error) throw error
  if (!acc) return
  const isBank = acc.type === 'cuenta_corriente' || acc.type === 'ahorro'
  if (!isBank || acc.opening_balance != null) return

  const movs = await fetchAccountMovementsChrono(accountId)
  let anchorIdx = -1
  for (let i = movs.length - 1; i >= 0; i--) { if (movs[i].balance != null) { anchorIdx = i; break } }
  if (anchorIdx === -1) return
  let sum = 0
  for (let i = 0; i <= anchorIdx; i++) sum += movs[i].amount
  const opening = Math.round((movs[anchorIdx].balance! - sum + Number.EPSILON) * 100) / 100
  const { error: upErr } = await supabase.from('accounts').update({ opening_balance: opening }).eq('id', accountId)
  if (upErr) throw upErr
}

/** Si la cuenta se queda sin movimientos, su `opening_balance` deja de tener base → NULL. */
async function nullOpeningIfEmpty(accountId: string) {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
  if (error) throw error
  if ((count ?? 0) === 0) {
    const { error: upErr } = await supabase.from('accounts').update({ opening_balance: null }).eq('id', accountId)
    if (upErr) throw upErr
  }
}

/** Error lanzado cuando la cuenta destino ya contiene esos movimientos. */
export const REASSIGN_DUPLICATE_ERROR = 'REASSIGN_DUPLICATE_ERROR'

/**
 * Reasigna un lote (y todos sus movimientos) a otra cuenta del mismo perfil:
 * corrige el caso de haber subido un extracto a la cuenta equivocada.
 *
 * IMPORTANTE: solo cambia `account_id`; NO toca la columna `balance` de los
 * movimientos. Ese saldo es el importado (el real del banco o el retrocalculado en
 * su momento) y es la referencia inmutable de la cuenta a la que pertenece el
 * extracto. Reescribirlo corrompía los datos y hacía que mover ida/vuelta diera
 * saldos absurdos. Al no tocarlo, la reasignación es reversible exacta.
 */
export function useReassignBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      batchId,
      fromAccountId,
      toAccountId,
    }: {
      batchId: string
      fromAccountId: string
      toAccountId: string
      profileId: string
    }) => {
      if (fromAccountId === toAccountId) return

      const { error: txErr } = await supabase
        .from('transactions')
        .update({ account_id: toAccountId, updated_at: new Date().toISOString() })
        .eq('import_batch_id', batchId)
      if (txErr) {
        // 23505 = choque con UNIQUE(account_id, dedup_hash): la cuenta destino ya
        // tiene esos movimientos. El update es atómico → no se movió nada.
        if ((txErr as { code?: string }).code === '23505') throw new Error(REASSIGN_DUPLICATE_ERROR)
        throw txErr
      }

      const { error: batchErr } = await supabase
        .from('import_batches')
        .update({ account_id: toAccountId })
        .eq('id', batchId)
      if (batchErr) throw batchErr

      // La referencia (saldo inicial) sigue a los datos: si el origen se queda vacío
      // pierde su saldo inicial; el destino, si no tenía, lo deriva de lo recibido.
      // No bloqueante: el movimiento ya está hecho, no lo abortamos si esto falla.
      try {
        await nullOpeningIfEmpty(fromAccountId)
        await deriveOpeningIfMissing(toAccountId)
      } catch (e) {
        console.error('Mantenimiento de saldo inicial tras reasignar falló:', e)
      }
    },
    onSuccess: () => invalidateAfterBatchChange(qc),
  })
}

/**
 * Elimina un lote completo: borra sus movimientos y el propio registro del lote.
 * No reescribe saldos de las filas que quedan (el saldo importado de cada una sigue
 * siendo válido; el "saldo actual" pasa a ser el del movimiento con saldo más
 * reciente que quede).
 */
export function useDeleteBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      batchId,
      accountId,
    }: {
      batchId: string
      accountId: string
      profileId: string
    }) => {
      const { error: txErr } = await supabase
        .from('transactions')
        .delete()
        .eq('import_batch_id', batchId)
      if (txErr) throw txErr

      const { error: batchErr } = await supabase
        .from('import_batches')
        .delete()
        .eq('id', batchId)
      if (batchErr) throw batchErr

      // Si la cuenta se queda sin movimientos, su saldo inicial deja de tener base.
      // No bloqueante: el borrado ya está hecho.
      try {
        await nullOpeningIfEmpty(accountId)
      } catch (e) {
        console.error('Mantenimiento de saldo inicial tras borrar falló:', e)
      }
    },
    onSuccess: () => invalidateAfterBatchChange(qc),
  })
}

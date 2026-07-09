import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { parseCSV, detectDelimiter } from '@/lib/parsers/csv'
import { parseXLSX } from '@/lib/parsers/xlsx'
import { generateDedupHash } from '@/lib/dedup'
import { classifyConcept } from '@/lib/classify'
import { invalidateTransactionData } from '@/hooks/useTransactions'
import { findTransferPairs } from '@/lib/transferMatch'
import { isCardSettlementConcept } from '@/lib/cardSettlement'
import { propagateBalances } from '@/lib/computeBalances'
import type { AccountType, BankFormat, Category, CategoryGroup, KeywordRule, Transaction, TransactionType } from '@/lib/database.types'
import { parse, isValid, format } from 'date-fns'

export interface ParsedRow {
  date: string        // YYYY-MM-DD
  concept: string
  amount: number
  balance: number | null
  dedup_hash: string
  isDuplicate: boolean
  categoryId: string | null
  transactionType: TransactionType
  rawLine: Record<string, string>
  /** Clave (fecha|hora|importe|concepto) usada para detectar colisiones exactas. */
  dupKey: string
  /** Índice de ocurrencia (0,1,2…) entre filas con la misma dupKey en el fichero. */
  occurrence: number
}

interface UseImportOptions {
  accountId: string
  profileId: string
  bankFormat: BankFormat
  rules: KeywordRule[]
  categories: Category[]
  /** Grupos de categoría (para resolver el tipo gasto/ingreso/no_computable por group_id). */
  groups: CategoryGroup[]
  /** Mapa merchant_key → category_id de la comunidad (≥ umbral de votos). */
  communityMap: Map<string, string>
  /** Tipo de cuenta destino: en tarjetas de crédito se normaliza el signo del importe. */
  accountType?: AccountType
}

export function useParseFile() {
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])

  async function parseFile(file: File, delimiter = ',', skipRows = 0) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    let result

    if (ext === 'csv') {
      // Detectar delimitador automáticamente si no se especifica
      const sample = await file.slice(0, 2000).text()
      const detectedDelim = delimiter === ',' ? detectDelimiter(sample) : delimiter
      result = await parseCSV(file, detectedDelim, skipRows)
    } else {
      result = await parseXLSX(file, skipRows)
    }

    setHeaders(result.headers)
    setPreviewRows(result.rows.slice(0, 5))
    return result
  }

  return { headers, previewRows, parseFile }
}

// Formatos candidatos (orden europeo primero). Cubren barras, guiones y puntos.
const DATE_PARSE_FORMATS = [
  'dd/MM/yyyy', 'd/M/yyyy',
  'dd-MM-yyyy', 'd-M-yyyy',
  'dd.MM.yyyy', 'd.M.yyyy',
  'yyyy-MM-dd', 'yyyy/MM/dd',
  'yyyyMMdd',
  'MM/dd/yyyy',
]

function parseDate(raw: string, dateFormat: string): string | null {
  if (!raw) return null
  // El extracto puede traer la hora pegada a la fecha ("25-06-2026 15:00" o
  // "2026-06-25T15:00"). Nos quedamos solo con la parte de fecha.
  const dateOnly = raw.trim().split(/[ T]/)[0].trim()
  if (!dateOnly) return null

  // El formato indicado por el usuario va primero; luego probamos comunes.
  const formats = [dateFormat, ...DATE_PARSE_FORMATS]
  for (const fmt of formats) {
    const parsed = parse(dateOnly, fmt, new Date())
    if (isValid(parsed)) {
      // Formatear en hora LOCAL (no toISOString, que pasa a UTC y resta un día
      // en zonas con offset positivo como España).
      return format(parsed, 'yyyy-MM-dd')
    }
  }
  return null
}

function normalizeTime(raw: string): string {
  const m = raw.trim().match(/(\d{1,2}):(\d{2})/)
  if (!m) return ''
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export function parseAmount(raw: string): number | null {
  if (raw == null) return null
  let s = String(raw).trim()
  if (!s) return null

  // ── Detección de negativos en formatos no estándar ─────────────────────────
  // (123,45) entre paréntesis, 123,45- con signo final, o -123,45 al inicio.
  let negative = false
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1) }
  if (/-\s*$/.test(s) || /^\s*-/.test(s)) negative = true

  // Quitar todo lo que no sea dígito o separador (símbolos de moneda, espacios,
  // NBSP, el propio signo ya capturado…)
  s = s.replace(/[^\d.,]/g, '')
  if (!s) return null

  // ── Detección del separador DECIMAL (en vez de asumir formato español) ──────
  // Un .xlsx binario llega como "37.86" (punto decimal) y un CSV español como
  // "37,86" (coma decimal): hay que distinguirlos, no asumir.
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  let decimalSep = ''

  if (lastDot !== -1 && lastComma !== -1) {
    // Conviven ambos → el que va el último es el decimal (1.234,56 ó 1,234.56)
    decimalSep = lastDot > lastComma ? '.' : ','
  } else if (lastComma !== -1) {
    const parts = s.split(',')
    // Una sola coma con ≠3 decimales → decimal (37,86). Varias o 3 dígitos → miles.
    decimalSep = parts.length === 2 && parts[1].length !== 3 ? ',' : ''
  } else if (lastDot !== -1) {
    const parts = s.split('.')
    decimalSep = parts.length === 2 && parts[1].length !== 3 ? '.' : ''
  }

  let normalized: string
  if (decimalSep === '') {
    // No hay decimales: todos los separadores son de miles
    normalized = s.replace(/[.,]/g, '')
  } else {
    const groupSep = decimalSep === '.' ? ',' : '.'
    normalized = s.split(groupSep).join('').replace(decimalSep, '.')
  }

  const n = parseFloat(normalized)
  if (isNaN(n)) return null
  return negative ? -Math.abs(n) : n
}

export function useProcessRows() {
  return async function processRows(
    rows: Record<string, string>[],
    opts: UseImportOptions,
  ): Promise<ParsedRow[]> {
    const { accountId, profileId, bankFormat, rules, categories, groups, communityMap, accountType } = opts

    // Mapa slug → categoría (para resolver el diccionario integrado)
    const catBySlug = new Map(categories.map(c => [c.slug, c]))
    // Mapa group_id → tipo. Resolvemos el tipo por aquí (no por el embed `category.group`,
    // que no siempre llega poblado) para que la regla del signo sea fiable.
    const groupTypeById = new Map(groups.map(g => [g.id, g.type]))

    // Obtener hashes existentes para este account
    const { data: existing } = await supabase
      .from('transactions')
      .select('dedup_hash')
      .eq('account_id', accountId)

    const existingHashes = new Set((existing ?? []).map(r => r.dedup_hash))

    const result: ParsedRow[] = []
    // Cuenta ocurrencias por clave (fecha|hora|importe|concepto) dentro del fichero
    const occCounter = new Map<string, number>()

    const isCreditCard = accountType === 'tarjeta_credito'

    // ── PASO 1: importe y campos base de cada fila ───────────────────────────
    type BaseRow = {
      date: string
      rawConcept: string
      time: string
      amount: number
      balance: number | null
      row: Record<string, string>
    }
    const base: BaseRow[] = []
    for (const row of rows) {
      const rawDate = row[bankFormat.date_column] ?? ''
      const rawConcept = row[bankFormat.concept_column] ?? ''

      const date = parseDate(rawDate, bankFormat.date_format)
      if (!date) continue

      let amount: number | null = null

      if (bankFormat.sign_convention === 'split_columns') {
        const debit  = parseAmount(row[bankFormat.debit_column  ?? ''] ?? '')
        const credit = parseAmount(row[bankFormat.credit_column ?? ''] ?? '')
        if (debit  !== null && debit  !== 0) amount = -Math.abs(debit)
        if (credit !== null && credit !== 0) amount =  Math.abs(credit)
      } else if (isCreditCard && bankFormat.amount_column) {
        // Tarjetas: nos quedamos con el signo BRUTO del importe. El marcador de una
        // columna "Tipo" (p.ej. "COMPRA NORMAL") no es un indicador fiable de
        // Cargo/Abono en tarjetas; el signo final se normaliza más abajo por la
        // polaridad dominante del extracto.
        amount = parseAmount(row[bankFormat.amount_column] ?? '')
      } else if (bankFormat.sign_convention === 'signed' && bankFormat.amount_column) {
        amount = parseAmount(row[bankFormat.amount_column] ?? '')
      } else if (bankFormat.sign_convention === 'unsigned_type' && bankFormat.amount_column && bankFormat.type_column) {
        const raw = parseAmount(row[bankFormat.amount_column] ?? '')
        const typeVal = (row[bankFormat.type_column] ?? '').trim().toUpperCase()
        const debitMarker = (bankFormat.debit_marker ?? 'D').toUpperCase()
        if (raw !== null) {
          amount = typeVal.includes(debitMarker) ? -Math.abs(raw) : Math.abs(raw)
        }
      }

      if (amount === null) continue

      const balance = bankFormat.balance_column
        ? parseAmount(row[bankFormat.balance_column] ?? '')
        : null

      // Hora (si el extracto la trae): distingue movimientos a distinta hora
      const rawTime = bankFormat.time_column ? (row[bankFormat.time_column] ?? '') : ''
      const time = normalizeTime(rawTime)

      base.push({ date, rawConcept, time, amount, balance, row })
    }

    // ── Tarjetas de crédito: normalizar el signo por la polaridad dominante ──
    // En un extracto de tarjeta la inmensa mayoría de movimientos son compras
    // (gastos). Si el fichero trae los importes mayoritariamente en positivo,
    // invertimos el signo de TODOS: así las compras (mayoría) cuentan como gasto y
    // los pocos movimientos de signo contrario (un pago o una devolución de la
    // tarjeta) quedan como abono/ingreso. Si ya vienen mayoritariamente en
    // negativo, se respeta el signo (convención habitual gasto = negativo).
    if (isCreditCard) {
      let pos = 0, neg = 0
      for (const b of base) { if (b.amount > 0) pos++; else if (b.amount < 0) neg++ }
      if (pos > neg) for (const b of base) b.amount = -b.amount
    }

    // ── PASO 2: dedup, clasificación y tipo con el importe ya normalizado ────
    for (const { date, rawConcept, time, amount, balance, row } of base) {
      const normConcept = rawConcept.toLowerCase().trim().replace(/\s+/g, ' ')
      const dupKey = `${date}|${time}|${amount.toFixed(2)}|${normConcept}`
      const occurrence = occCounter.get(dupKey) ?? 0
      occCounter.set(dupKey, occurrence + 1)

      const dedup_hash = await generateDedupHash(date, time, amount, rawConcept, occurrence)
      const isDuplicate = existingHashes.has(dedup_hash)

      // Categorización: 1) regla de usuario → 2) comunidad → 3) diccionario → 4) sin categoría
      let { categoryId, category: matchedCat } = classifyConcept(rawConcept, {
        userRules: rules,
        communityMap,
        categories,
        catBySlug,
        profileId,
        amount,
      })
      // El signo del importe manda: un movimiento positivo no puede ser un gasto
      // (p.ej. una nómina). Si la categoría casada contradice el signo, la descartamos
      // y caemos en "sin categoría", dejando que el tipo lo fije el signo.
      const signType: TransactionType = amount < 0 ? 'gasto' : 'ingreso'
      const matchedType = matchedCat ? groupTypeById.get(matchedCat.group_id) : undefined
      if ((matchedType === 'gasto' || matchedType === 'ingreso') && matchedType !== signType) {
        categoryId = null
        matchedCat = undefined
      }
      // Tipo: del grupo de la categoría casada (incluye no_computable); si no hay, por el signo
      let transactionType: TransactionType =
        (matchedCat ? groupTypeById.get(matchedCat.group_id) : undefined) ?? signType

      // Recibo/liquidación de tarjeta de crédito: un abono (importe positivo) cuyo
      // concepto es una liquidación no es un ingreso real, sino la recuperación del
      // crédito ya gastado → no_computable con la subcategoría "Recibo de tarjeta".
      if (isCreditCard && amount > 0 && isCardSettlementConcept(rawConcept)) {
        categoryId = catBySlug.get('card_settlement')?.id ?? null
        transactionType = 'no_computable'
      }

      result.push({ date, concept: rawConcept, amount, balance, dedup_hash, isDuplicate, categoryId, transactionType, rawLine: row, dupKey, occurrence })
    }

    return result
  }
}

/**
 * Reconciliación de transferencias entre cuentas propias del perfil.
 *
 * Recorre TODOS los movimientos del perfil (no solo los recién importados, porque
 * las dos patas pueden subirse en cualquier orden), detecta las parejas espejo
 * (importe opuesto, cuentas distintas, ≤3 días, concepto de transferencia) y marca
 * ambas como `no_computable` con la categoría `inter_account_transfer`, para que no
 * cuenten como ingreso ni gasto real.
 *
 * Devuelve el nº de parejas enlazadas. Es idempotente: los movimientos ya marcados
 * `no_computable` se ignoran como candidatos, así que volver a ejecutarla no duplica.
 */
export async function reconcileProfileTransfers(profileId: string): Promise<number> {
  // Solo las cuentas bancarias (corriente/ahorro) participan en transferencias
  // entre cuentas; una tarjeta de crédito/débito nunca es origen ni destino.
  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .select('id, type')
    .eq('profile_id', profileId)
  if (accErr) throw accErr
  const bankAccountIds = (accounts ?? [])
    .filter(a => a.type === 'cuenta_corriente' || a.type === 'ahorro')
    .map(a => a.id)
  if (bankAccountIds.length < 2) return 0 // hacen falta ≥2 cuentas bancarias

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, account_id, date, amount, concept, transaction_type')
    .eq('profile_id', profileId)
    .in('account_id', bankAccountIds)
  if (error) throw error

  const pairs = findTransferPairs(txs ?? [])
  if (pairs.length === 0) return 0

  // Categoría destino (grupo non_computable → tipo no_computable).
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'inter_account_transfer')
    .maybeSingle()
  const categoryId = cat?.id ?? null

  const ids = pairs.flat()
  const { error: upErr } = await supabase
    .from('transactions')
    .update({ transaction_type: 'no_computable', category_id: categoryId })
    .in('id', ids)
  if (upErr) throw upErr

  return pairs.length
}

/** Saldo conocido que ancla el cálculo cuando el extracto no trae columna de saldo. */
export interface ManualBalance {
  /** Saldo actual de la cuenta introducido por el usuario. */
  balance: number
  /** Fecha a la que corresponde ese saldo (informativa: hoy o fecha de extracción). */
  date: string
}

/**
 * Trae TODOS los movimientos de una cuenta (paginado: PostgREST corta a 1000),
 * ordenados cronológicamente, para anclar y propagar saldos.
 */
async function fetchAllAccountMovements(accountId: string) {
  const pageSize = 1000
  // PostgREST puede serializar `numeric` como string en runtime; lo normalizamos
  // con Number() en quien consume. El tipo generado los declara como number.
  const out: { date: string; amount: number; balance: number | null; created_at: string }[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, balance, created_at')
      .eq('account_id', accountId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < pageSize) break
  }
  return out
}

/**
 * Calcula el saldo de cada movimiento nuevo cuando la cuenta no aporta columna de
 * saldo. Fusiona los movimientos ya guardados con los nuevos en una única lista
 * cronológica, elige un ancla y propaga el resto de saldos desde ella.
 *
 * Ancla:
 *  - Primer import (`manualBalance` presente): el saldo introducido por el usuario,
 *    anclado al movimiento NUEVO más reciente del extracto.
 *  - Imports posteriores (sin `manualBalance`): el saldo conocido más reciente ya
 *    guardado en la cuenta → encadenado en silencio.
 *
 * Devuelve un array paralelo a `newRows` con el saldo calculado (o `null` si no hay
 * ancla posible, en cuyo caso se deja el saldo sin fijar).
 */
async function resolveComputedBalances(
  accountId: string,
  newRows: ParsedRow[],
  manualBalance?: ManualBalance | null,
): Promise<(number | null)[] | null> {
  if (newRows.length === 0) return null

  const existing = await fetchAllAccountMovements(accountId)

  type Node = { date: string; amount: number; src: 'old' | 'new'; rank: number; balance: number | null }
  const nodes: Node[] = [
    ...existing.map((e, i): Node => ({
      date: e.date,
      amount: Number(e.amount),
      src: 'old',
      rank: i,
      balance: e.balance == null ? null : Number(e.balance),
    })),
    ...newRows.map((r, i): Node => ({ date: r.date, amount: r.amount, src: 'new', rank: i, balance: null })),
  ]

  // Orden cronológico. En empate de fecha: primero los ya guardados, luego los
  // nuevos; dentro de cada grupo se respeta el orden de fichero (`rank`).
  nodes.sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1
      : a.src !== b.src ? (a.src === 'old' ? -1 : 1)
      : a.rank - b.rank,
  )

  // Elegir el ancla.
  let anchorIndex = -1
  let anchorBalance = 0
  if (manualBalance) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].src === 'new') { anchorIndex = i; break }
    }
    anchorBalance = manualBalance.balance
  } else {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].balance != null) { anchorIndex = i; anchorBalance = nodes[i].balance!; break }
    }
  }
  if (anchorIndex === -1) return null // sin saldo de referencia → no se puede calcular

  const balances = propagateBalances(nodes.map(n => ({ date: n.date, amount: n.amount })), anchorIndex, anchorBalance)

  // Volcar los saldos de los nodos nuevos a su posición original en `newRows`.
  const result: (number | null)[] = new Array(newRows.length).fill(null)
  nodes.forEach((n, i) => { if (n.src === 'new') result[n.rank] = balances[i] })
  return result
}

/**
 * Fija el `opening_balance` (saldo inicial) de una cuenta bancaria si aún no está.
 * Modelo de saldo por suma: saldo = opening_balance + Σ(importes). Se deriva de los
 * saldos por fila que la importación acaba de guardar:
 *   opening = balance(ancla) − Σ(importes hasta e incluyendo el ancla),
 * donde el ancla es el movimiento con saldo no nulo más reciente.
 *
 * Solo el PRIMER import lo fija; los siguientes no lo tocan (los nuevos movimientos
 * simplemente suman). Si no hay ningún saldo de referencia, se deja sin fijar.
 */
async function ensureOpeningBalance(accountId: string, accountType: AccountType) {
  if (accountType !== 'cuenta_corriente' && accountType !== 'ahorro') return
  const { data: acc, error } = await supabase
    .from('accounts')
    .select('opening_balance')
    .eq('id', accountId)
    .maybeSingle()
  if (error) throw error
  if (!acc || acc.opening_balance != null) return

  const movements = await fetchAllAccountMovements(accountId) // orden cronológico asc
  let anchorIdx = -1
  for (let i = movements.length - 1; i >= 0; i--) {
    if (movements[i].balance != null) { anchorIdx = i; break }
  }
  if (anchorIdx === -1) return // sin saldo de referencia

  let sumUpToAnchor = 0
  for (let i = 0; i <= anchorIdx; i++) sumUpToAnchor += Number(movements[i].amount)
  const opening = Math.round((Number(movements[anchorIdx].balance) - sumUpToAnchor + Number.EPSILON) * 100) / 100

  const { error: upErr } = await supabase
    .from('accounts')
    .update({ opening_balance: opening })
    .eq('id', accountId)
  if (upErr) throw upErr
}

export function useConfirmImport() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      rows,
      accountId,
      accountType,
      profileId,
      bankFormatId,
      filename,
      hasBalanceColumn,
      manualBalance,
    }: {
      rows: ParsedRow[]
      accountId: string
      accountType: AccountType
      profileId: string
      bankFormatId: string | null
      filename: string
      /** El extracto trae columna de saldo (entonces no calculamos nada). */
      hasBalanceColumn: boolean
      /** Saldo de referencia para cuentas bancarias sin columna de saldo (1er import). */
      manualBalance?: ManualBalance | null
    }) => {
      const newRows = rows.filter(r => !r.isDuplicate)
      if (newRows.length === 0) return { imported: 0, skipped: rows.length }

      // Cuentas bancarias sin columna de saldo: reconstruimos el saldo corrido a
      // partir del ancla (saldo introducido en el 1er import o saldo ya guardado).
      const isBankAccount = accountType === 'cuenta_corriente' || accountType === 'ahorro'
      const computedBalances = isBankAccount && !hasBalanceColumn
        ? await resolveComputedBalances(accountId, newRows, manualBalance)
        : null

      const dates = newRows.map(r => r.date).sort()
      const batchData = {
        profile_id: profileId,
        account_id: accountId,
        bank_format_id: bankFormatId,
        filename,
        rows_total: rows.length,
        rows_imported: newRows.length,
        rows_skipped: rows.length - newRows.length,
        rows_failed: 0,
        date_from: dates[0],
        date_to: dates[dates.length - 1],
      }

      const { data: batch, error: batchError } = await supabase
        .from('import_batches')
        .insert(batchData)
        .select()
        .single()
      if (batchError) throw batchError

      const transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[] = newRows.map((r, i) => ({
        profile_id: profileId,
        account_id: accountId,
        import_batch_id: batch.id,
        date: r.date,
        concept: r.concept,
        amount: r.amount,
        balance: computedBalances ? computedBalances[i] : r.balance,
        transaction_type: r.transactionType,
        category_id: r.categoryId,
        notes: null,
        is_manual: false,
        is_reviewed: false,
        dedup_hash: r.dedup_hash,
      }))

      const { error: txError } = await supabase
        .from('transactions')
        .upsert(transactions, { onConflict: 'account_id,dedup_hash', ignoreDuplicates: true })
      if (txError) {
        // No dejar lotes huérfanos si falla el insert de movimientos
        await supabase.from('import_batches').delete().eq('id', batch.id)
        throw txError
      }

      // Fijar el saldo inicial de la cuenta si aún no está (modelo de saldo por
      // suma). No bloquea un import ya confirmado si falla.
      try {
        await ensureOpeningBalance(accountId, accountType)
      } catch (e) {
        console.error('No se pudo fijar el saldo inicial (opening_balance):', e)
      }

      // Detectar transferencias entre cuentas propias y marcarlas no computables.
      // Solo cuando el extracto es de una cuenta bancaria (corriente/ahorro): una
      // tarjeta de crédito/débito nunca es una transferencia entre cuentas.
      // El import ya está confirmado: si la reconciliación falla, no la abortamos.
      if (accountType === 'cuenta_corriente' || accountType === 'ahorro') {
        try {
          await reconcileProfileTransfers(profileId)
        } catch (e) {
          console.error('Reconciliación de transferencias fallida:', e)
        }
      }

      return { imported: newRows.length, skipped: rows.length - newRows.length }
    },
    onSuccess: () => {
      invalidateTransactionData(qc)
      // El saldo (opening + suma) y su gráfica dependen de estos; forzamos relectura.
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['account_balances'] })
      qc.invalidateQueries({ queryKey: ['account_balance_history'] })
      qc.invalidateQueries({ queryKey: ['card_spending_30d'] })
      qc.invalidateQueries({ queryKey: ['card_spending_history'] })
      // Historial de extractos + onboarding "sube tu primer extracto".
      qc.invalidateQueries({ queryKey: ['import_batches'] })
    },
  })
}

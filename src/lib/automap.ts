/**
 * Auto-detects which column in a parsed file corresponds to date / concept /
 * amount / balance based on the column header names.
 *
 * Covers most Spanish bank export formats (Openbank, Santander, BBVA, CaixaBank,
 * ING, Sabadell, Unicaja, Bankinter…).
 */

import type { SignConventionType } from './database.types'

// ── Pattern lists (lowercased substrings to match against header names) ───────

const DATE_PAT     = ['fecha', 'date', 'f.valor', 'f. valor', 'fecha valor', 'fecha operac', 'fec. op', 'fec.op', 'data', 'fecha mov', 'datum']
// Fecha de liquidación/cierre: cuando un extracto trae varias columnas de fecha
// (p.ej. Revolut: "Started Date" / "Completed Date"), esta se prueba PRIMERO
// para quedarnos con la más fiel al momento real del movimiento en vez de la
// primera columna que aparezca en el fichero.
const COMPLETED_DATE_PAT = [
  'completed', 'completion', 'settlement', 'value date', 'fecha valor', 'fecha operac',
  'fec. op', 'fec.op', 'buchungsdatum', 'date de valeur', 'data valuta',
]
const TIME_PAT     = ['hora', 'time', 'hour', 'hh:mm']
const CONCEPT_PAT  = [
  'concepto', 'description', 'descripci', 'movimiento', 'detalle', 'observac', 'texto', 'motivo', 'concept',
  'libellé', 'libelle', 'verwendungszweck', 'omschrijving', 'descrizione', 'descrição', 'descricao',
]
const AMOUNT_PAT   = [
  'importe', 'amount', 'cargo/abono', 'impte', 'importe (eur', 'importe eur', 'movimiento', 'cantidad',
  'montant', 'betrag', 'importo', 'montante',
]
const BALANCE_PAT  = [
  'saldo', 'balance', 'disponible', 'saldo (eur', 'saldo eur', 'saldo actual',
  'solde', 'kontostand',
]
const DEBIT_PAT    = ['cargo', 'débito', 'debito', 'debit', 'salida', 'debe']
const CREDIT_PAT   = ['abono', 'crédito', 'credito', 'credit', 'entrada', 'haber']
const TYPE_PAT     = ['tipo', 'd/h', 'debe/haber', 'db/cr', 'deb/cred']
// Estado de la transacción (Revolut, Wise, N26...): "State"/"Status"/"Estado".
// "state" a secas se comprueba por igualdad exacta, no por substring, porque es
// una palabra corta que aparece dentro de otras cabeceras ("Statement date").
const STATE_PAT       = ['estado', 'status']
const STATE_EXACT_PAT = ['state']
const CURRENCY_PAT    = ['currency', 'moneda', 'divisa', 'währung', 'wahrung', 'devise', 'valuta']
// Retención/impuesto y comisión que algunos brokers (Trade Republic...) separan
// del importe bruto en su propia columna: el importe real es amount+tax+fee.
const TAX_PAT = ['tax', 'impuesto', 'retenc', 'withholding']
const FEE_PAT = ['fee', 'comisi']

// Estados de transacción que representan dinero que nunca llegó a moverse (o
// se revirtió). Se descartan al importar. Cubre EN + ES; ampliar aquí cubre
// cualquier banco/fintech que use este vocabulario, sin tocar el resto del
// pipeline.
export const NON_FINAL_STATE_VALUES = [
  'pending', 'reverted', 'declined', 'failed', 'cancelled', 'canceled',
  'pendiente', 'revertido', 'rechazado', 'fallido', 'cancelado',
]

function match(header: string, patterns: string[]): boolean {
  const h = header.toLowerCase().trim()
  return patterns.some(p => h.includes(p))
}

function matchExact(header: string, values: string[]): boolean {
  return values.includes(header.toLowerCase().trim())
}

// ── Date format detection from a sample value ─────────────────────────────────

export function detectDateFormat(sample: string): string {
  // El extracto puede traer la hora pegada ("25-06-2026 15:00"); nos quedamos
  // solo con la parte de fecha antes de reconocer el patrón.
  const s = sample.trim().split(/[ T]/)[0].trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s))          return 'yyyy-MM-dd'   // 2024-03-15
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s))         return 'dd/MM/yyyy'   // 15/03/2024
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s))     return 'd/M/yyyy'     // 5/3/2024
  if (/^\d{2}-\d{2}-\d{4}$/.test(s))           return 'dd-MM-yyyy'   // 15-03-2024
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s))         return 'dd.MM.yyyy'   // 15.03.2024
  if (/^\d{8}$/.test(s))                        return 'yyyyMMdd'     // 20240315
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(s))         return 'dd/MM/yy'     // 15/03/24
  return 'dd/MM/yyyy'
}

// ── Decimal separator detection (for display/confirmation) ───────────────────
// Mirrors the per-value logic in parseAmount: when '.' and ',' coexist the last
// one is the decimal; a lone separator followed by ≠3 digits is the decimal.
// Returns the majority separator across the sampled values, or null if unknown.

export function detectDecimalSeparator(values: string[]): '.' | ',' | null {
  let dot = 0
  let comma = 0
  for (const v of values) {
    const s = String(v ?? '').replace(/[^\d.,]/g, '')
    if (!s) continue
    const lastDot = s.lastIndexOf('.')
    const lastComma = s.lastIndexOf(',')
    if (lastDot !== -1 && lastComma !== -1) {
      if (lastDot > lastComma) dot++; else comma++
    } else if (lastComma !== -1) {
      const parts = s.split(',')
      if (parts.length === 2 && parts[1].length !== 3) comma++
    } else if (lastDot !== -1) {
      const parts = s.split('.')
      if (parts.length === 2 && parts[1].length !== 3) dot++
    }
  }
  if (dot === 0 && comma === 0) return null
  return dot >= comma ? '.' : ','
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface AutoMapResult {
  dateCol:        string
  timeCol:        string
  conceptCol:     string
  amountCol:      string
  typeCol:        string
  debitCol:       string
  creditCol:      string
  balanceCol:     string
  signConvention: SignConventionType
  dateFormat:     string
  /** Columna de estado de la transacción (Revolut/Wise/N26...), si el extracto trae una. */
  stateCol:       string
  /** Columna de moneda, si el extracto trae una (usada solo para avisar de mezcla de monedas). */
  currencyCol:    string
  /** Columna de retención/impuesto a restar del importe bruto (Trade Republic...), si la hay. */
  taxCol:         string
  /** Columna de comisión a restar del importe bruto, si la hay. */
  feeCol:         string
}

export function autoDetectColumns(
  headers: string[],
  sampleRows: Record<string, string>[],
): Partial<AutoMapResult> {
  const result: Partial<AutoMapResult> = {}

  // ── Required fields ──────────────────────────────────────────────────────
  // Si hay varias columnas de fecha (p.ej. Revolut: "Started Date" / "Completed
  // Date"), se prioriza la de liquidación/cierre; si no hay ninguna así, se cae
  // a la primera columna que parezca una fecha.
  const dateHeader    = headers.find(h => match(h, COMPLETED_DATE_PAT)) ?? headers.find(h => match(h, DATE_PAT))
  const conceptHeader = headers.find(h => match(h, CONCEPT_PAT))
  if (dateHeader)    result.dateCol    = dateHeader
  if (conceptHeader) result.conceptCol = conceptHeader

  // ── Optional: estado de la transacción / moneda ───────────────────────────
  const stateHeader = headers.find(h => match(h, STATE_PAT) || matchExact(h, STATE_EXACT_PAT))
  if (stateHeader) result.stateCol = stateHeader
  const currencyHeader = headers.find(h => match(h, CURRENCY_PAT))
  if (currencyHeader) result.currencyCol = currencyHeader

  // ── Optional: time (used for deduplication, not stored) ──────────────────
  const timeHeader = headers.find(h => h !== dateHeader && match(h, TIME_PAT))
  if (timeHeader) result.timeCol = timeHeader

  // ── Optional: balance ────────────────────────────────────────────────────
  const balanceHeader = headers.find(h => match(h, BALANCE_PAT))
  if (balanceHeader) result.balanceCol = balanceHeader

  // ── Sign convention detection ─────────────────────────────────────────────
  const debitHeader  = headers.find(h => match(h, DEBIT_PAT))
  const creditHeader = headers.find(h => match(h, CREDIT_PAT))
  const typeHeader   = headers.find(h => match(h, TYPE_PAT))
  // Amount column: pick the first match that isn't already assigned to balance/debit/credit
  const amountHeader = headers.find(h =>
    match(h, AMOUNT_PAT) &&
    h !== balanceHeader &&
    h !== debitHeader &&
    h !== creditHeader,
  )

  if (debitHeader && creditHeader) {
    result.signConvention = 'split_columns'
    result.debitCol       = debitHeader
    result.creditCol      = creditHeader
  } else if (typeHeader && amountHeader) {
    result.signConvention = 'unsigned_type'
    result.amountCol      = amountHeader
    result.typeCol        = typeHeader
  } else if (amountHeader) {
    result.signConvention = 'signed'
    result.amountCol      = amountHeader
  }

  // ── Optional: retención/impuesto y comisión (Trade Republic...) ──────────
  // Excluidas las columnas ya asignadas a otro campo para no robárselas.
  const assigned = new Set([dateHeader, conceptHeader, stateHeader, currencyHeader, timeHeader, balanceHeader, debitHeader, creditHeader, typeHeader, amountHeader])
  const taxHeader = headers.find(h => match(h, TAX_PAT) && !assigned.has(h))
  if (taxHeader) result.taxCol = taxHeader
  const feeHeader = headers.find(h => match(h, FEE_PAT) && !assigned.has(h) && h !== taxHeader)
  if (feeHeader) result.feeCol = feeHeader

  // ── Date format from first non-empty sample value ────────────────────────
  if (result.dateCol) {
    const sampleDate = sampleRows.find(r => r[result.dateCol!]?.trim())?.[result.dateCol!]
    if (sampleDate) result.dateFormat = detectDateFormat(sampleDate)
  }

  return result
}

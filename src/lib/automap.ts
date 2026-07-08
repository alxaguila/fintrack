/**
 * Auto-detects which column in a parsed file corresponds to date / concept /
 * amount / balance based on the column header names.
 *
 * Covers most Spanish bank export formats (Openbank, Santander, BBVA, CaixaBank,
 * ING, Sabadell, Unicaja, Bankinter…).
 */

import type { SignConventionType } from './database.types'

// ── Pattern lists (lowercased substrings to match against header names) ───────

const DATE_PAT     = ['fecha', 'date', 'f.valor', 'f. valor', 'fecha valor', 'fecha operac', 'fec. op', 'fec.op', 'data', 'fecha mov']
const TIME_PAT     = ['hora', 'time', 'hour', 'hh:mm']
const CONCEPT_PAT  = ['concepto', 'description', 'descripci', 'movimiento', 'detalle', 'observac', 'texto', 'motivo', 'concept']
const AMOUNT_PAT   = ['importe', 'amount', 'cargo/abono', 'impte', 'importe (eur', 'importe eur', 'movimiento', 'cantidad']
const BALANCE_PAT  = ['saldo', 'balance', 'disponible', 'saldo (eur', 'saldo eur', 'saldo actual']
const DEBIT_PAT    = ['cargo', 'débito', 'debito', 'debit', 'salida', 'debe']
const CREDIT_PAT   = ['abono', 'crédito', 'credito', 'credit', 'entrada', 'haber']
const TYPE_PAT     = ['tipo', 'd/h', 'debe/haber', 'db/cr', 'deb/cred']

function match(header: string, patterns: string[]): boolean {
  const h = header.toLowerCase().trim()
  return patterns.some(p => h.includes(p))
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
}

export function autoDetectColumns(
  headers: string[],
  sampleRows: Record<string, string>[],
): Partial<AutoMapResult> {
  const result: Partial<AutoMapResult> = {}

  // ── Required fields ──────────────────────────────────────────────────────
  const dateHeader    = headers.find(h => match(h, DATE_PAT))
  const conceptHeader = headers.find(h => match(h, CONCEPT_PAT))
  if (dateHeader)    result.dateCol    = dateHeader
  if (conceptHeader) result.conceptCol = conceptHeader

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

  // ── Date format from first non-empty sample value ────────────────────────
  if (result.dateCol) {
    const sampleDate = sampleRows.find(r => r[result.dateCol!]?.trim())?.[result.dateCol!]
    if (sampleDate) result.dateFormat = detectDateFormat(sampleDate)
  }

  return result
}

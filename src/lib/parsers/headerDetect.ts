// ── Auto-detect which row contains the real column headers ───────────────────
// Banks embed metadata rows (account name, download date, document title…) before
// the actual table. We scan for the first row whose cells collectively mention at
// least 2 distinct finance-domain keywords — that row is the real header row.
//
// Shared by every parser (CSV, binary XLSX, HTML-as-xls) so a leading title cell
// in A1 is never mistaken for the column headers.

const HEADER_KEYWORDS = [
  'fecha', 'importe', 'saldo', 'concepto', 'descripci',
  'movimiento', 'cargo', 'abono', 'valor', 'amount',
  'balance', 'haber', 'debe', 'operaci',
]

export function detectHeaderRowIndex(rawRows: string[][]): number {
  for (let i = 0; i < Math.min(rawRows.length, 40); i++) {
    const row = rawRows[i]

    // Skip rows that are nearly empty (a lone title cell is not a header row)
    const nonEmpty = row.filter(c => c.trim() !== '').length
    if (nonEmpty < 2) continue

    // Count how many distinct keywords appear across all cells in this row
    const found = new Set<string>()
    for (const cell of row) {
      const c = cell.toLowerCase().trim()
      for (const kw of HEADER_KEYWORDS) {
        if (c.includes(kw)) found.add(kw)
      }
    }

    if (found.size >= 2) return i   // ← this row looks like real headers
  }
  return 0  // fallback: treat first row as headers
}

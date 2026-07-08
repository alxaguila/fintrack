/**
 * Defensa frente a CSV / Formula Injection.
 *
 * La app importa conceptos y notas de extractos externos (datos no confiables).
 * Hoy NO existe exportación, pero cuando se implemente (CSV con PapaParse o XLSX
 * con SheetJS) hay que pasar TODO valor de texto por `sanitizeForSpreadsheet`
 * antes de escribirlo: si una celda empieza por `= + - @` (o tab/CR), Excel y
 * LibreOffice la interpretan como fórmula y podrían ejecutar contenido malicioso
 * al abrir el fichero (p. ej. `=HYPERLINK(...)`, `=cmd|...`).
 *
 * Prefijar con un apóstrofo neutraliza la interpretación como fórmula sin
 * cambiar el valor visible.
 */
export function sanitizeForSpreadsheet(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

/** Aplica `sanitizeForSpreadsheet` a cada celda de una fila. */
export function sanitizeRow(row: unknown[]): string[] {
  return row.map(sanitizeForSpreadsheet)
}

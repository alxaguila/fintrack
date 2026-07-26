// Formateo compartido por las calculadoras de la landing (coma decimal es-ES,
// igual que formatCurrency) — evita el "8.0" con punto en vez de "8,0".

export function formatDecimal(v: number): string {
  return v.toFixed(1).replace('.', ',')
}

export function formatPercent(v: number): string {
  return `${formatDecimal(v)}%`
}

/** Entero con separador de miles (es-ES) — para los inputs numéricos de importes en €. */
export function formatThousands(v: number): string {
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Inverso de formatThousands: quita separadores de miles (y cualquier otro carácter que no sea dígito o signo) antes de parsear. */
export function parseThousands(raw: string): number {
  return Number(raw.replace(/[^\d-]/g, ''))
}

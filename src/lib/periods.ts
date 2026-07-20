// Helpers para agrupar movimientos por periodo temporal (mes / trimestre / año).
// Las claves son ordenables lexicográficamente dentro de cada granularidad.

export type Granularity = 'month' | 'quarter' | 'year'

/** date en 'YYYY-MM-DD' → clave de periodo */
export function bucketKey(date: string, g: Granularity): string {
  const [y, m] = date.split('-')
  if (g === 'year') return y
  if (g === 'quarter') return `${y}-Q${Math.floor((Number(m) - 1) / 3) + 1}`
  return `${y}-${m}`
}

/** Etiqueta corta para el eje (ej. "Ene 26", "1T 26", "2026") */
export function bucketLabel(key: string, g: Granularity, monthNames: string[]): string {
  if (g === 'year') return key
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return `${q}T ${y.slice(2)}`
  }
  const [y, m] = key.split('-')
  return `${monthNames[Number(m) - 1]} ${y.slice(2)}`
}

/** Clave del periodo anterior/siguiente dentro de la misma granularidad. */
export function prevPeriodKey(key: string, g: Granularity): string {
  if (g === 'year') return String(Number(key) - 1)
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return Number(q) === 1 ? `${Number(y) - 1}-Q4` : `${y}-Q${Number(q) - 1}`
  }
  const [y, m] = key.split('-')
  return Number(m) === 1 ? `${Number(y) - 1}-12` : `${y}-${String(Number(m) - 1).padStart(2, '0')}`
}

export function nextPeriodKey(key: string, g: Granularity): string {
  if (g === 'year') return String(Number(key) + 1)
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return Number(q) === 4 ? `${Number(y) + 1}-Q1` : `${y}-Q${Number(q) + 1}`
  }
  const [y, m] = key.split('-')
  return Number(m) === 12 ? `${Number(y) + 1}-01` : `${y}-${String(Number(m) + 1).padStart(2, '0')}`
}

/** Rango de fechas [from, to] (YYYY-MM-DD) que cubre un periodo */
export function bucketRange(key: string, g: Granularity): { from: string; to: string } {
  if (g === 'year') return { from: `${key}-01-01`, to: `${key}-12-31` }
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    const startM = (Number(q) - 1) * 3 + 1
    const endM = startM + 2
    const lastDay = new Date(Number(y), endM, 0).getDate()
    return {
      from: `${y}-${String(startM).padStart(2, '0')}-01`,
      to: `${y}-${String(endM).padStart(2, '0')}-${lastDay}`,
    }
  }
  const [y, m] = key.split('-')
  const lastDay = new Date(Number(y), Number(m), 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` }
}

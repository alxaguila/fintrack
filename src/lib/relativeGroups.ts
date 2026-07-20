// Agrupación de movimientos por fecha relativa a "hoy" (Hoy / Ayer / Esta
// semana / ...), para la vista de Movimientos. A diferencia de src/lib/periods.ts
// (buckets de calendario fijos: mes/trimestre/año), aquí los buckets se mueven
// con la fecha actual del usuario.
import {
  isToday, isYesterday, isSameWeek, isSameMonth, isSameYear,
  subWeeks, subMonths, subYears, parseISO,
} from 'date-fns'

export type RelativeGroupKey =
  | 'today' | 'yesterday' | 'this_week' | 'last_week'
  | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'older'

const ORDER: RelativeGroupKey[] = [
  'today', 'yesterday', 'this_week', 'last_week',
  'this_month', 'last_month', 'this_year', 'last_year', 'older',
]

/**
 * Clasifica una fecha 'YYYY-MM-DD' en su bucket relativo a `today` (por defecto
 * la fecha actual). `today` es un parámetro para que la función sea pura.
 * La semana empieza en lunes (weekStartsOn: 1), igual que date-picker-field.tsx.
 */
export function relativeGroupKey(dateStr: string, today: Date = new Date()): RelativeGroupKey {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'today'
  if (isYesterday(d)) return 'yesterday'
  if (isSameWeek(d, today, { weekStartsOn: 1 })) return 'this_week'
  if (isSameWeek(d, subWeeks(today, 1), { weekStartsOn: 1 })) return 'last_week'
  if (isSameMonth(d, today)) return 'this_month'
  if (isSameMonth(d, subMonths(today, 1))) return 'last_month'
  if (isSameYear(d, today)) return 'this_year'
  if (isSameYear(d, subYears(today, 1))) return 'last_year'
  return 'older'
}

export interface RelativeGroup<T> {
  key: RelativeGroupKey
  items: T[]
}

/**
 * Agrupa `items` (ya ordenados date desc) por bucket relativo, preservando el
 * orden de entrada dentro de cada grupo y el orden de los grupos (today primero).
 */
export function groupByRelativeDate<T extends { date: string }>(
  items: T[],
  today: Date = new Date(),
): RelativeGroup<T>[] {
  const buckets = new Map<RelativeGroupKey, T[]>()
  for (const item of items) {
    const key = relativeGroupKey(item.date, today)
    const bucket = buckets.get(key)
    if (bucket) bucket.push(item)
    else buckets.set(key, [item])
  }
  return ORDER.filter(k => buckets.has(k)).map(key => ({ key, items: buckets.get(key)! }))
}

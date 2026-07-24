// Agrupación de movimientos por fecha relativa a "hoy" (Hoy / Ayer / Esta
// semana / ...), para la vista de Movimientos. A diferencia de src/lib/periods.ts
// (buckets de calendario fijos: mes/trimestre/año), aquí los buckets se mueven
// con la fecha actual del usuario.
import {
  isToday, isYesterday, isSameWeek, isSameMonth, isSameYear,
  subWeeks, subMonths, subYears, parseISO, format,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'

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

export interface DayGroup<T> {
  dateStr: string
  items: T[]
}

/**
 * Agrupa `items` (ya ordenados date desc) por día exacto, preservando el orden
 * de entrada. Usado en móvil (Movimientos), donde el separador de grupo ya
 * lleva la fecha completa y por tanto no hace falta repetirla en cada fila.
 */
export function groupByDay<T extends { date: string }>(items: T[]): DayGroup<T>[] {
  const order: string[] = []
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    if (!buckets.has(item.date)) { buckets.set(item.date, []); order.push(item.date) }
    buckets.get(item.date)!.push(item)
  }
  return order.map(dateStr => ({ dateStr, items: buckets.get(dateStr)! }))
}

/**
 * "Sábado, 18 de julio de 2026" (es) / "Saturday, July 18, 2026" (en). date-fns
 * devuelve día/mes en minúscula en es-ES (ortografía correcta); aquí solo se
 * capitaliza la primera letra de toda la frase, igual que el resto de etiquetas
 * de la app ("Esta semana", "El mes pasado"), no cada palabra.
 */
export function formatDayLabel(dateStr: string, language: string): string {
  const isEs = language.startsWith('es')
  const locale = isEs ? es : enUS
  const pattern = isEs ? "EEEE, d 'de' MMMM 'de' yyyy" : 'EEEE, MMMM d, yyyy'
  const raw = format(parseISO(dateStr), pattern, { locale })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

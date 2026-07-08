import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un importe con signo y símbolo de moneda */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Formatea una fecha ISO a dd/MM/yyyy */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/** Devuelve el nombre del mes en el idioma actual */
export function monthName(isoDate: string, locale = 'es-ES'): string {
  const date = new Date(isoDate + 'T00:00:00')
  return date.toLocaleString(locale, { month: 'long' })
}

/** Agrupa un array por una clave */
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

/** Suma los importes de un array de transacciones */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((acc, a) => acc + a, 0)
}

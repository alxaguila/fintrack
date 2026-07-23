import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'

/** Cabecera de columna clicable, compartida por las tablas de admin (diccionario, comunidad, comercios). */
export function SortHeader({ label, active, dir, onClick, className }: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-1 text-left text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700', className)}
    >
      {label}
      {active ? (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
    </button>
  )
}

/** Alterna la dirección si ya se ordena por esa columna; si no, la activa con
 *  una dirección por defecto (numéricas → desc primero, texto → asc primero). */
export function nextSort<K extends string>(prev: { key: K; dir: SortDir }, key: K, numeric: boolean): { key: K; dir: SortDir } {
  if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: numeric ? 'desc' : 'asc' }
}

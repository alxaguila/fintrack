import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCheck } from 'lucide-react'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { resolveEntityAvatar } from '@/lib/entityAvatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Account, Category, CategoryGroup, Transaction } from '@/lib/database.types'

// Plantilla de columnas compartida entre la cabecera (TransactionsList) y cada
// fila, para que ambas se alineen exactamente en cada breakpoint. Orden:
// [dot+icono] [concepto 1fr] [fecha] [entidad*] [categoría**] [tipo***] [importe] [leído]
// *sm+  **md+  ***lg+
export const TX_ROW_GRID_COLS =
  'grid-cols-[40px_1fr_92px_108px_112px] ' +
  'sm:grid-cols-[40px_1fr_92px_132px_108px_112px] ' +
  'md:grid-cols-[40px_1fr_92px_132px_168px_108px_112px] ' +
  'lg:grid-cols-[40px_1fr_92px_132px_168px_112px_108px_112px]'

// Divide un importe ya formateado (formatCurrency, siempre es-ES → coma decimal)
// en parte entera + parte decimal, para el tratamiento tipográfico de dos tonos
// del mock (entero destacado, decimales atenuados). No reimplementa el formato:
// solo corta la cadena ya correcta por la última coma.
function splitAmount(formatted: string): { int: string; dec: string } {
  const i = formatted.lastIndexOf(',')
  if (i === -1) return { int: formatted, dec: '' }
  return { int: formatted.slice(0, i), dec: formatted.slice(i) }
}

// Badge de tipo: "Gasto" usa el token expense (ya existente, evita semáforo puro
// rojo); "Ingreso" income; "No computable" neutro. Sin inventar hex nuevos.
const TYPE_BADGE: Record<string, string> = {
  ingreso: 'border-income/40 text-income',
  gasto: 'border-expense/40 text-expense',
  no_computable: 'border-border text-muted-foreground',
}

interface TransactionRowProps {
  tx: Transaction
  category: Category | undefined
  group: CategoryGroup | undefined
  account: Account | undefined
  entityLogoByName: Map<string, string | null>
  onClick: () => void
  onToggleReviewed: (e: React.MouseEvent) => void
}

export function TransactionRow({ tx, category, group, account, entityLogoByName, onClick, onToggleReviewed }: TransactionRowProps) {
  const { t } = useTranslation('transactions')
  const { t: tc } = useTranslation('common')
  const [logoError, setLogoError] = useState(false)

  const CatIcon = categoryIcon(category?.icon)
  const catColor = group?.color ?? '#94a3b8'
  const avatar = resolveEntityAvatar(account, entityLogoByName)
  const amountColor = tx.transaction_type === 'ingreso' ? 'text-income' : 'text-foreground'
  const { int, dec } = splitAmount(formatCurrency(tx.amount))

  return (
    <div
      className={cn(
        'grid items-center gap-3 border-t px-4 py-3 first:border-t-0 cursor-pointer transition-colors',
        TX_ROW_GRID_COLS,
        tx.is_reviewed ? 'bg-muted/30 text-muted-foreground hover:bg-muted/50' : 'hover:bg-muted/20',
      )}
      onClick={onClick}
    >
      {/* Punto de no leído + icono de categoría */}
      <div className="flex items-center gap-2">
        <span
          className={cn('h-[7px] w-[7px] shrink-0 rounded-full', tx.is_reviewed ? 'bg-transparent' : 'bg-[var(--brand-accent)]')}
          title={tx.is_reviewed ? undefined : t('row.pending')}
        />
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${catColor}1f` }}
        >
          <CatIcon className="h-4 w-4" style={{ color: catColor }} />
        </span>
      </div>

      {/* Concepto + nota (si existe) */}
      <div className="min-w-0 leading-tight">
        <div className={cn('truncate font-mono text-[13px] uppercase', tx.is_reviewed ? '' : 'font-semibold text-foreground')}>
          {tx.concept}
        </div>
        {tx.notes && (
          <div className="truncate text-[11px] font-normal normal-case text-muted-foreground">{tx.notes}</div>
        )}
      </div>

      {/* Fecha */}
      <div className="whitespace-nowrap text-[12.5px] text-muted-foreground">{formatDate(tx.date)}</div>

      {/* Entidad (sm+) */}
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        {avatar.logoUrl && !logoError ? (
          <img
            src={avatar.logoUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full border border-border object-contain bg-white"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: avatar.color }}
          >
            {avatar.initial}
          </span>
        )}
        <span className="truncate text-[12.5px] text-muted-foreground">{account?.entity ?? '—'}</span>
      </div>

      {/* Categoría (md+) */}
      <div className="hidden min-w-0 md:block">
        <span
          className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${catColor}1f`, color: catColor }}
        >
          <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: catColor }} />
          <span className="truncate">{category ? categoryLabel(category.slug) : t('row.uncategorized')}</span>
        </span>
      </div>

      {/* Tipo (lg+) */}
      <div className="hidden lg:block">
        {tx.transaction_type && (
          <span className={cn('inline-block rounded-lg border px-2.5 py-1 text-xs font-medium', TYPE_BADGE[tx.transaction_type])}>
            {tc(`transaction_type.${tx.transaction_type}`)}
          </span>
        )}
      </div>

      {/* Importe */}
      <div className={cn('text-right text-[15px] font-semibold tabular-nums', amountColor)}>
        {int}
        <span className="text-[11.5px] font-normal text-muted-foreground/70">{dec}</span>
      </div>

      {/* Leído / No leído */}
      <div className="text-right">
        <button
          onClick={onToggleReviewed}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
            tx.is_reviewed ? 'border-income/40 bg-income/10 text-income' : 'border-muted-foreground/30 text-muted-foreground hover:border-income/40 hover:text-income',
          )}
        >
          {tx.is_reviewed ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {tx.is_reviewed ? t('row.reviewed') : t('row.pending')}
        </button>
      </div>
    </div>
  )
}

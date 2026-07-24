import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { groupByRelativeDate, groupByDay, formatDayLabel, type RelativeGroupKey } from '@/lib/relativeGroups'
import { shouldShowSwipeHint, markSwipeHintShown } from '@/lib/swipeHint'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionRow, TX_ROW_GRID_COLS } from './TransactionRow'
import type { Account, Category, CategoryGroup, Merchant, Transaction } from '@/lib/database.types'

interface TransactionsListProps {
  transactions: Transaction[]
  categories: Category[]
  groups: CategoryGroup[]
  accounts: Account[]
  merchants: Merchant[]
  entityLogoByName: Map<string, string | null>
  isLoading: boolean
  onRowClick: (tx: Transaction) => void
  onToggleReviewed: (tx: Transaction, e?: React.MouseEvent) => void
  // false en móvil: la lista deja de scrollear en su propio contenedor y pasa
  // a fluir con el resto de la página (para que el pie de paginación no quede
  // pinneado y solo se vea al llegar al final del scroll).
  scrollable?: boolean
}

// Neto de un grupo: ingresos suman, gastos restan, no_computable no cuenta
// (coherente con los KPIs del Dashboard, que tampoco lo computan).
function groupNet(rows: Transaction[]): number {
  return rows.reduce((sum, r) => {
    if (r.transaction_type === 'no_computable') return sum
    return sum + (r.transaction_type === 'ingreso' ? r.amount : -Math.abs(r.amount))
  }, 0)
}

export function TransactionsList({
  transactions, categories, groups, accounts, merchants, entityLogoByName, isLoading, onRowClick, onToggleReviewed,
  scrollable = true,
}: TransactionsListProps) {
  const { t, i18n } = useTranslation('transactions')
  const isMobile = useIsMobile()

  const relativeGroups = useMemo(() => groupByRelativeDate(transactions), [transactions])
  const dayGroups = useMemo(() => groupByDay(transactions), [transactions])

  // Animación de ejemplo del swipe (móvil): se decide una sola vez por montaje
  // de esta lista (una visita a la pantalla), sobre el primer movimiento.
  const hintDecidedRef = useRef(false)
  const [hintTxId, setHintTxId] = useState<string | null>(null)
  useEffect(() => {
    if (!isMobile || hintDecidedRef.current || transactions.length === 0) return
    hintDecidedRef.current = true
    if (shouldShowSwipeHint()) {
      setHintTxId(transactions[0].id)
      markSwipeHintShown()
    }
  }, [isMobile, transactions])

  // Filas de un grupo: compartido entre el agrupado por día (móvil) y el
  // agrupado relativo (escritorio) — misma búsqueda de category/group/account/merchant.
  function renderRows(items: Transaction[]) {
    return (
      <div className="sm:rounded-2xl sm:border sm:bg-card sm:shadow-[var(--shadow-card)]">
        {items.map(tx => {
          const category = categories.find(c => c.id === tx.category_id)
          const group = groups.find(g => g.id === category?.group_id)
          const account = accounts.find(a => a.id === tx.account_id)
          const merchant = merchants.find(m => m.id === tx.merchant_id)
          return (
            <TransactionRow
              key={tx.id}
              tx={tx}
              category={category}
              group={group}
              account={account}
              merchant={merchant}
              entityLogoByName={entityLogoByName}
              onClick={() => onRowClick(tx)}
              onToggleReviewed={e => onToggleReviewed(tx, e)}
              showHint={tx.id === hintTxId}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={scrollable ? 'flex-1 min-h-0 overflow-auto pr-1' : ''}>
      {/* Cabecera de columnas: en móvil se quita (el día ya vive en el separador
          de grupo y no hay columnas de detalle que etiquetar) */}
      {!isMobile && (
        <div className={cn('grid items-center gap-2 px-2 pb-2 text-[10.5px] font-display font-semibold uppercase tracking-wide text-[var(--text-faint)] sm:gap-3 sm:px-4', TX_ROW_GRID_COLS)}>
          <div />
          <div>{t('columns.concept')}</div>
          <div>{t('columns.date')}</div>
          <div className="hidden sm:block">{t('columns.entity')}</div>
          <div className="hidden md:block">{t('columns.category')}</div>
          <div className="hidden lg:block">{t('columns.type')}</div>
          <div className="text-right">{t('columns.amount')}</div>
          <div className="text-right">{t('columns.reviewed')}</div>
        </div>
      )}

      {isLoading ? (
        <div className="sm:rounded-2xl sm:border sm:bg-card sm:shadow-[var(--shadow-card)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn('grid items-center gap-2 border-t px-1 py-3 first:border-t-0 sm:gap-3 sm:px-4', TX_ROW_GRID_COLS)}>
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="hidden h-4 w-20 sm:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-4 w-16 lg:block" />
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="ml-auto hidden h-4 w-16 sm:block" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>{t('empty.description')}</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-5 pb-2">
          {dayGroups.map(({ dateStr, items }) => (
            <div key={dateStr}>
              {/* Cabecera de grupo: chevron + fecha completa, sin contador ni neto */}
              <div className="flex items-center gap-2 px-1 pb-2">
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground" strokeWidth={2} />
                <span className="font-display text-[13.5px] font-semibold text-foreground">{formatDayLabel(dateStr, i18n.language)}</span>
              </div>
              {renderRows(items)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5 pb-2">
          {relativeGroups.map(({ key, items }) => {
            const net = groupNet(items)
            return (
              <div key={key}>
                {/* Cabecera de grupo: chevron + etiqueta + contador + línea + neto */}
                <div className="flex items-center gap-2 px-1 pb-2">
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground" strokeWidth={2} />
                  <span className="font-display text-[13.5px] font-semibold text-foreground">{t(`groups.${key}` as `groups.${RelativeGroupKey}`)}</span>
                  <span className="text-xs text-muted-foreground">{t('groups.count', { count: items.length })}</span>
                  <span className="h-px flex-1 bg-border" />
                  <span className={cn('text-[12.5px] font-semibold', net >= 0 ? 'text-income' : 'text-muted-foreground')}>
                    {net >= 0 ? '+' : ''}{formatCurrency(net)}
                  </span>
                </div>
                {renderRows(items)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { fmtAmount } from '@/components/ui/amount-split'
import { categoryIcon } from '@/lib/categoryIcons'
import type { EnvelopeSummary } from '@/lib/budgets'
import { cn } from '@/lib/utils'
import { BudgetAmountSlider } from './BudgetAmountSlider'

interface EnvelopeRowProps {
  summary: EnvelopeSummary
  onClick: () => void
}

/** Fila de sobre (categoría) — agregado de solo lectura. Muestra el mismo
 *  selector con marcador que el popup (en modo `disabled`) para insinuar que es
 *  ajustable; el click en cualquier punto de la fila —incluida la barra— abre
 *  el detalle real por subcategoría, que es donde se edita de verdad. */
export function EnvelopeRow({ summary, onClick }: EnvelopeRowProps) {
  const { t } = useTranslation('budgets')
  const { t: tc } = useTranslation('categories')
  const { group, budgeted, spent, projection, vsAvgPct, hasActualBudget } = summary
  const Icon = categoryIcon(group.icon)
  const color = group.color ?? '#64748b'
  const over = budgeted > 0 && spent > budgeted

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1f` }}>
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.8} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-slate-800">{tc(`category_group.${group.slug}`)}</p>
        <div className="mt-2">
          <BudgetAmountSlider spent={spent} amount={budgeted} color={over ? '#CB6391' : color} disabled />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {budgeted > 0
            ? t('envelopes.spent_of', { spent: fmtAmount(spent), budgeted: fmtAmount(budgeted) })
            : `${fmtAmount(spent)} · ${t('envelopes.no_budget')}`}
          {budgeted > 0 && !hasActualBudget && <span className="text-slate-400"> · {t('detail.proposed_badge').toLowerCase()}</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
        {vsAvgPct != null && (
          <span className={cn('text-xs font-medium', vsAvgPct > 0 ? 'text-[#CB6391]' : 'text-[#14B8A6]')}>
            {vsAvgPct > 0 ? '↗' : '↘'} {Math.abs(vsAvgPct).toFixed(0)}% {t('envelopes.vs_avg')}
          </span>
        )}
        <div className="text-right">
          <p className="text-[11px] text-slate-400">{t('envelopes.projection_label')}</p>
          <p className="text-sm font-bold text-slate-800">{fmtAmount(projection)}</p>
        </div>
      </div>
    </button>
  )
}

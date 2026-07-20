import { useTranslation } from 'react-i18next'
import { fmtAmount } from '@/components/ui/amount-split'

interface BudgetSummaryCardProps {
  budgeted: number
  spent: number
  available: number
  projection: number
  vsBudget: number
  daysRemaining: number
  isCurrentPeriod: boolean
  /** Gasto mensual agregado de los sobres presupuestados, últimos meses en orden cronológico. */
  monthlyHistory: { month: string; spent: number }[]
}

// Mini-barras de tendencia (sin interacción): último mes resaltado.
function MiniBars({ data }: { data: { month: string; spent: number }[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map(d => d.spent), 1)
  return (
    <div className="flex h-14 items-end gap-1">
      {data.map((d, i) => (
        <div
          key={d.month}
          className="min-w-[4px] flex-1 rounded-t-[3px]"
          style={{
            height: `${Math.max(6, (d.spent / max) * 100)}%`,
            backgroundColor: i === data.length - 1 ? 'var(--brand-primary-3)' : 'rgba(126,214,231,0.35)',
          }}
        />
      ))}
    </div>
  )
}

export function BudgetSummaryCard({
  budgeted, spent, available, projection, vsBudget, daysRemaining, isCurrentPeriod, monthlyHistory,
}: BudgetSummaryCardProps) {
  const { t } = useTranslation('budgets')
  const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0
  const perDay = daysRemaining > 0 ? available / daysRemaining : 0
  const over = vsBudget > 0

  return (
    <div className="grid gap-4 rounded-2xl bg-[var(--brand-ink)] p-6 text-[var(--side-text)] md:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-sm text-[var(--side-text-muted)]">{t('summary.available_label')}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">{fmtAmount(available)}</p>
        {isCurrentPeriod && daysRemaining > 0 && (
          <p className="mt-1 text-sm text-[var(--side-text-muted)]">
            {fmtAmount(perDay)}/día · {t(daysRemaining === 1 ? 'summary.days_remaining_one' : 'summary.days_remaining', { count: daysRemaining })}
          </p>
        )}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--brand-primary-3)]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[var(--side-text-muted)]">
          <span>{fmtAmount(spent)} {t('summary.spent_label').toLowerCase()}</span>
          <span>{fmtAmount(budgeted)} {t('summary.total_label').toLowerCase()}</span>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#1A4763] bg-[var(--brand-ink-2)] p-4">
        <p className="text-xs font-medium text-[var(--brand-primary-3)]">{t('projection.title')}</p>
        <div className="mt-3"><MiniBars data={monthlyHistory} /></div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-[var(--side-text-muted)]">{t('projection.estimate_label')}</p>
            <p className="text-lg font-bold text-white">{fmtAmount(projection)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--side-text-muted)]">{t('projection.vs_budget_label')}</p>
            <p className="text-sm font-semibold" style={{ color: over ? '#FCA5A5' : 'var(--brand-primary-3)' }}>
              {over ? '+' : ''}{fmtAmount(vsBudget)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

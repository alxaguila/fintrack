import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { usePlan, useAllPlanLimits } from '@/hooks/usePlan'
import { checkLimit, type LimitDimension } from '@/lib/plan'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PlanLimits, PlanType } from '@/lib/database.types'
import { SettingsHeader } from './SettingsHeader'

const PLAN_ORDER: PlanType[] = ['free', 'pro', 'premium']
const USAGE_DIMENSIONS: LimitDimension[] = ['profiles', 'accounts', 'imports', 'movements', 'rules']

export default function SettingsPlan() {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { plan, limits, usage, isLoading } = usePlan()
  const { data: allLimits = [], isLoading: loadingCompare } = useAllPlanLimits()

  const limitsByPlan = useMemo(() => {
    const m = new Map<PlanType, PlanLimits>()
    for (const l of allLimits) m.set(l.plan, l)
    return m
  }, [allLimits])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <SettingsHeader title={t('plan.title')} />

      {/* Plan actual + consumo del mes */}
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold">{t('plan.usage_title')}</h2>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {t('plan.current_badge')}: {tc(`plan.name.${plan ?? 'free'}`)}
            </span>
          </div>

          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {USAGE_DIMENSIONS.map((dim) => {
                const check = checkLimit(limits, usage, dim)
                const pct = check.limit ? Math.min(100, Math.round((check.used / check.limit) * 100)) : 0
                return (
                  <div key={dim} className="space-y-1.5 rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{t(`plan.usage.${dim}`)}</span>
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {check.limit == null ? `${check.used} · ${t('plan.unlimited')}` : `${check.used}/${check.limit}`}
                      </span>
                    </div>
                    {check.limit != null && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn('h-full rounded-full', check.limited ? 'bg-[#CB6391]' : 'bg-[#14B8A6]')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparativa de planes */}
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-[15px] font-bold">{t('plan.compare_title')}</h2>

          {loadingCompare ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr>
                    <th className="w-40 pb-2 text-left text-xs font-medium text-slate-400"> </th>
                    {PLAN_ORDER.map((p) => (
                      <th
                        key={p}
                        className={cn(
                          'pb-2 text-center text-xs font-bold uppercase tracking-wide',
                          p === plan ? 'text-slate-900' : 'text-slate-400',
                        )}
                      >
                        {tc(`plan.name.${p}`)}
                        {p === plan && (
                          <span className="ml-1.5 inline-block rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            {t('plan.current_badge')}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <PlanCompareRows limitsByPlan={limitsByPlan} currentPlan={plan} t={t} />
                </tbody>
              </table>
            </div>
          )}

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t('plan.payment_note')}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function Cell({ children, plan, currentPlan }: { children: React.ReactNode; plan: PlanType; currentPlan?: PlanType }) {
  return (
    <td className={cn('py-2.5 text-center', plan === currentPlan && 'rounded-md bg-slate-50 font-medium text-slate-800')}>
      {children}
    </td>
  )
}

function BoolCell({ value, plan, currentPlan }: { value: boolean; plan: PlanType; currentPlan?: PlanType }) {
  return (
    <Cell plan={plan} currentPlan={currentPlan}>
      {value ? <Check className="mx-auto h-4 w-4 text-[#14B8A6]" /> : <span className="text-slate-300">—</span>}
    </Cell>
  )
}

function numOrUnlimited(v: number | null, unlimitedLabel: string): string {
  return v == null ? unlimitedLabel : String(v)
}

function PlanCompareRows({
  limitsByPlan, currentPlan, t,
}: {
  limitsByPlan: Map<PlanType, PlanLimits>
  currentPlan?: PlanType
  t: (key: string, opts?: any) => string
}) {
  const unlimited = t('plan.unlimited')

  function row(label: string, render: (l: PlanLimits | undefined) => React.ReactNode) {
    return (
      <tr key={label} className="border-t border-slate-100">
        <td className="py-2.5 text-xs font-medium text-slate-500">{label}</td>
        {PLAN_ORDER.map((p) => (
          <Cell key={p} plan={p} currentPlan={currentPlan}>{render(limitsByPlan.get(p))}</Cell>
        ))}
      </tr>
    )
  }

  return (
    <>
      {row(t('plan.rows.profiles'), (l) => numOrUnlimited(l?.max_profiles ?? null, unlimited))}
      {row(t('plan.rows.accounts'), (l) => numOrUnlimited(l?.max_accounts ?? null, unlimited))}
      {row(t('plan.rows.imports'), (l) => numOrUnlimited(l?.max_imports_per_month ?? null, unlimited))}
      {row(t('plan.rows.movements'), (l) => numOrUnlimited(l?.max_movements_per_month ?? null, unlimited))}
      {row(t('plan.rows.classification'), (l) => (
        <span className="text-xs">
          {t('plan.classification_base')}
          {l?.has_ai_classification ? ` ${t('plan.classification_ai')}` : ''}
        </span>
      ))}
      {row(t('plan.rows.rules'), (l) => numOrUnlimited(l?.max_rules ?? null, unlimited))}
      <tr className="border-t border-slate-100">
        <td className="py-2.5 text-xs font-medium text-slate-500">{t('plan.rows.budget')}</td>
        {PLAN_ORDER.map((p) => <BoolCell key={p} value={!!limitsByPlan.get(p)?.has_budget} plan={p} currentPlan={currentPlan} />)}
      </tr>
      {row(t('plan.rows.dashboard_history'), (l) =>
        l?.dashboard_history_months == null ? unlimited : t('plan.months', { count: l.dashboard_history_months }))}
      {row(t('plan.rows.export'), (l) => {
        if (!l?.has_export) return <span className="text-xs">{t('plan.export_none')}</span>
        return (
          <span className="text-xs">
            {t('plan.export_basic')}{l.has_scheduled_export ? ` ${t('plan.export_scheduled')}` : ''}
          </span>
        )
      })}
      <tr className="border-t border-slate-100">
        <td className="py-2.5 text-xs font-medium text-slate-500">{t('plan.rows.transfers')}</td>
        {PLAN_ORDER.map((p) => <BoolCell key={p} value plan={p} currentPlan={currentPlan} />)}
      </tr>
      <tr className="border-t border-slate-100">
        <td className="py-2.5 text-xs font-medium text-slate-500">{t('plan.rows.investments')}</td>
        {PLAN_ORDER.map((p) => <BoolCell key={p} value={!!limitsByPlan.get(p)?.has_investments} plan={p} currentPlan={currentPlan} />)}
      </tr>
      <tr className="border-t border-slate-100">
        <td className="py-2.5 text-xs font-medium text-slate-500">{t('plan.rows.networth')}</td>
        {PLAN_ORDER.map((p) => <BoolCell key={p} value={!!limitsByPlan.get(p)?.has_networth} plan={p} currentPlan={currentPlan} />)}
      </tr>
    </>
  )
}

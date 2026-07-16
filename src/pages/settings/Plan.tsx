import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlan } from '@/hooks/usePlan'
import { checkLimit, type LimitDimension } from '@/lib/plan'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { PricingCards } from '@/components/landing/PricingCards'
import { SettingsHeader } from './SettingsHeader'

const USAGE_DIMENSIONS: LimitDimension[] = ['profiles', 'accounts', 'imports', 'movements', 'rules']

export default function SettingsPlan() {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { plan, limits, usage, isLoading } = usePlan()
  const [annual, setAnnual] = useState(true)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <SettingsHeader title={t('plan.title')} />

      {/* Plan actual + consumo del mes */}
      <Card className="mx-auto max-w-3xl rounded-2xl">
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

      {/* Comparativa de planes: mismas tarjetas que la landing / el popup de mejora, sin
          contenedor blanco para que tengan todo el ancho disponible. */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-bold">{t('plan.compare_title')}</h2>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <PricingCards annual={annual} onAnnualChange={setAnnual} variant="upgrade" currentPlan={plan} />
        )}

        <p className="mx-auto max-w-3xl rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">{t('plan.payment_note')}</p>
      </div>
    </div>
  )
}

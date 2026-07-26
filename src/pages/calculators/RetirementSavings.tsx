import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { BRAND } from '@/components/landing/brand'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SliderNumberInput } from '@/components/calculators/SliderNumberInput'
import { KpiCard, HeroStatCard } from '@/components/calculators/KpiCard'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { CALCULATOR_CSS } from '@/components/calculators/calculatorStyles'
import { formatCurrency } from '@/lib/utils'
import { formatDecimal, formatThousands, parseThousands } from '@/lib/calculators/format'
import {
  calculateRetirementSavings,
  clampRetirementSavingsInput,
  RETIREMENT_SAVINGS_LIMITS,
} from '@/lib/calculators/retirementSavings'

const inputStep = {
  currentAge: 1,
  retirementAge: 1,
  currentCapital: 5000,
  targetWealth: 50000,
  annualRatePct: 0.5,
}

export default function RetirementSavings() {
  const { t, i18n } = useTranslation('calculators')
  const [searchParams] = useSearchParams()

  const [inputs, setInputs] = useState(() =>
    clampRetirementSavingsInput({
      currentAge: searchParams.get('age'),
      retirementAge: searchParams.get('retirementAge'),
      targetWealth: searchParams.get('targetWealth'),
      currentCapital: searchParams.get('capital'),
      annualRatePct: searchParams.get('rate'),
    }),
  )

  useEffect(() => {
    document.title = t('retirementSavings.meta.title')
  }, [t, i18n.language])

  const result = useMemo(() => calculateRetirementSavings(inputs), [inputs])

  const set = <K extends keyof typeof inputs>(key: K, value: (typeof inputs)[K]) =>
    setInputs((prev) => (key === 'currentAge' ? clampRetirementSavingsInput({ ...prev, [key]: value }) : { ...prev, [key]: value }))

  const l = RETIREMENT_SAVINGS_LIMITS

  const heroSubtitle = result.costOfWaiting
    ? t('retirementSavings.results.hero.subtitle', { years: result.costOfWaiting.delayYears, amount: formatCurrency(result.costOfWaiting.delayedMonthlyContribution) })
    : t('retirementSavings.results.hero.subtitleFallback', { rate: formatDecimal(inputs.annualRatePct) })
  const heroSubtitleShort = result.costOfWaiting
    ? t('retirementSavings.results.hero.subtitleShort', { years: result.costOfWaiting.delayYears, amount: formatCurrency(result.costOfWaiting.delayedMonthlyContribution) })
    : t('retirementSavings.results.hero.subtitleFallbackShort', { rate: formatDecimal(inputs.annualRatePct) })

  return (
    <div className="calc-page" style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <style>{CALCULATOR_CSS}</style>
      <SiteHeader />

      <div className="calc-content" style={{ maxWidth: 1100, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
        <div style={{ font: `600 13px ${BRAND.sans}`, color: BRAND.blue, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('retirementSavings.hero.eyebrow')}
        </div>
        <h1 style={{ margin: '8px 0 10px', font: `500 clamp(28px,6vw,38px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {t('retirementSavings.hero.title')}
        </h1>
        <p style={{ margin: '0 0 32px', maxWidth: 640, font: `400 15px/1.6 ${BRAND.sans}`, color: '#586470' }}>
          {t('retirementSavings.hero.subtitle')}
        </p>

        <div className="calc-grid">
          {/* Inputs */}
          <div className="calc-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="calc-section-label">{t('retirementSavings.inputs.title')}</div>

              <SliderNumberInput
                label={t('retirementSavings.inputs.currentAge.label')}
                value={inputs.currentAge}
                min={l.currentAge.min}
                max={l.currentAge.max}
                step={inputStep.currentAge}
                suffix={t('retirementSavings.inputs.ageSuffix')}
                formatValue={(v) => String(Math.round(v))}
                onChange={(v) => set('currentAge', Math.round(v))}
              />
              <SliderNumberInput
                label={t('retirementSavings.inputs.retirementAge.label')}
                value={inputs.retirementAge}
                min={Math.max(l.retirementAge.min, inputs.currentAge + 1)}
                max={l.retirementAge.max}
                step={inputStep.retirementAge}
                suffix={t('retirementSavings.inputs.ageSuffix')}
                formatValue={(v) => String(Math.round(v))}
                onChange={(v) => set('retirementAge', Math.round(v))}
              />
              <SliderNumberInput
                label={t('retirementSavings.inputs.currentCapital.label')}
                value={inputs.currentCapital}
                min={l.currentCapital.min}
                max={l.currentCapital.max}
                step={inputStep.currentCapital}
                suffix="€"
                formatValue={formatThousands}
                parseValue={parseThousands}
                inputWidth={118}
                onChange={(v) => set('currentCapital', v)}
              />
              <SliderNumberInput
                label={t('retirementSavings.inputs.targetWealth.label')}
                value={inputs.targetWealth}
                min={l.targetWealth.min}
                max={l.targetWealth.max}
                step={inputStep.targetWealth}
                suffix="€"
                formatValue={formatThousands}
                parseValue={parseThousands}
                inputWidth={118}
                onChange={(v) => set('targetWealth', v)}
              />
            </div>

            <div className="calc-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="calc-section-label">{t('retirementSavings.inputs.sectionGrowth')}</div>

              <SliderNumberInput
                label={t('retirementSavings.inputs.annualRate.label')}
                value={inputs.annualRatePct}
                min={l.annualRatePct.min}
                max={l.annualRatePct.max}
                step={inputStep.annualRatePct}
                suffix="%"
                formatValue={(v) => v.toFixed(1)}
                onChange={(v) => set('annualRatePct', v)}
              />
            </div>
          </div>

          {/* Resultado */}
          <div className="calc-right-col">
            <div className="calc-hero-row">
              <HeroStatCard
                label={t('retirementSavings.results.requiredContribution')}
                amount={result.requiredMonthlyContribution}
                badgeValue={t('retirementSavings.results.hero.badge', { years: result.yearsToRetirement })}
                subtitle={heroSubtitle}
                subtitleShort={heroSubtitleShort}
              />
              <div className="calc-stats-col">
                <KpiCard
                  label={t('retirementSavings.results.currentCapital')}
                  shortLabel={t('retirementSavings.results.currentCapitalShort')}
                  amount={inputs.currentCapital}
                />
                <KpiCard
                  label={t('retirementSavings.results.targetWealth')}
                  shortLabel={t('retirementSavings.results.targetWealthShort')}
                  amount={inputs.targetWealth}
                />
              </div>
            </div>

            <div className="calc-card calc-chart-card">
              <h2 style={{ margin: '0 0 12px', font: `600 15px ${BRAND.sans}`, color: BRAND.ink }}>{t('retirementSavings.results.chartTitle')}</h2>
              <div className="calc-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.projection} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rsBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.accent} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={BRAND.accent} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DD" vertical={false} />
                    <XAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#8A96A3' }} />
                    <YAxis tickLine={false} axisLine={false} width={0} tick={false} domain={[0, (max: number) => Math.max(max, inputs.targetWealth) * 1.05]} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(age) => `${t('retirementSavings.results.chart.ageAxis')} ${age}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #ECE7DD', fontFamily: BRAND.sans, fontSize: 13 }}
                    />
                    <ReferenceLine
                      y={inputs.targetWealth}
                      stroke={BRAND.ink}
                      strokeDasharray="4 4"
                      label={{ value: t('retirementSavings.results.chart.targetSeries'), position: 'insideTopRight', fill: BRAND.ink, fontSize: 12, fontFamily: BRAND.sans }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name={t('retirementSavings.results.chart.balanceSeries')}
                      stroke={BRAND.accent}
                      fill="url(#rsBalance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <CalculatorDisclaimer />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

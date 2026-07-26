import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BRAND } from '@/components/landing/brand'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SliderNumberInput } from '@/components/calculators/SliderNumberInput'
import { KpiCard, HeroStatCard } from '@/components/calculators/KpiCard'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { CALCULATOR_CSS } from '@/components/calculators/calculatorStyles'
import { formatCurrency } from '@/lib/utils'
import { formatDecimal, formatPercent, formatThousands, parseThousands } from '@/lib/calculators/format'
import {
  calculateCompoundInterest,
  clampCompoundInterestInput,
  COMPOUND_INTEREST_LIMITS,
} from '@/lib/calculators/compoundInterest'

const inputStep = {
  initialCapital: 100,
  monthlyContribution: 25,
  years: 1,
  annualRatePct: 0.5,
  annualContributionIncreasePct: 0.5,
}

export default function CompoundInterest() {
  const { t, i18n } = useTranslation('calculators')
  const [searchParams] = useSearchParams()

  const [inputs, setInputs] = useState(() =>
    clampCompoundInterestInput({
      initialCapital: searchParams.get('initial'),
      monthlyContribution: searchParams.get('contribution'),
      years: searchParams.get('years'),
      annualRatePct: searchParams.get('rate'),
      annualContributionIncreasePct: searchParams.get('increase'),
    }),
  )
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    document.title = t('compoundInterest.meta.title')
  }, [t, i18n.language])

  const result = useMemo(() => calculateCompoundInterest(inputs), [inputs])
  const rows = result.yearlyBreakdown.slice(1)
  const totalReturnPct = result.totalContributed > 0 ? (result.totalInterest / result.totalContributed) * 100 : 0

  const set = <K extends keyof typeof inputs>(key: K, value: (typeof inputs)[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const l = COMPOUND_INTEREST_LIMITS

  return (
    <div className="calc-page" style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <style>{CALCULATOR_CSS}</style>
      <SiteHeader />

      <div className="calc-content" style={{ maxWidth: 1100, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
        <div style={{ font: `600 13px ${BRAND.sans}`, color: BRAND.blue, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('compoundInterest.hero.eyebrow')}
        </div>
        <h1 style={{ margin: '8px 0 10px', font: `500 clamp(28px,6vw,38px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {t('compoundInterest.hero.title')}
        </h1>
        <p style={{ margin: '0 0 32px', maxWidth: 640, font: `400 15px/1.6 ${BRAND.sans}`, color: '#586470' }}>
          {t('compoundInterest.hero.subtitle')}
        </p>

        <div className="calc-grid">
          {/* Inputs */}
          <div className="calc-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="calc-section-label">{t('compoundInterest.inputs.title')}</div>

              <SliderNumberInput
                label={t('compoundInterest.inputs.initialCapital.label')}
                value={inputs.initialCapital}
                min={l.initialCapital.min}
                max={l.initialCapital.max}
                step={inputStep.initialCapital}
                suffix="€"
                formatValue={formatThousands}
                parseValue={parseThousands}
                inputWidth={118}
                onChange={(v) => set('initialCapital', v)}
              />
              <SliderNumberInput
                label={t('compoundInterest.inputs.monthlyContribution.label')}
                value={inputs.monthlyContribution}
                min={l.monthlyContribution.min}
                max={l.monthlyContribution.max}
                step={inputStep.monthlyContribution}
                suffix="€"
                formatValue={formatThousands}
                parseValue={parseThousands}
                inputWidth={118}
                onChange={(v) => set('monthlyContribution', v)}
              />
              <SliderNumberInput
                label={t('compoundInterest.inputs.years.label')}
                value={inputs.years}
                min={l.years.min}
                max={l.years.max}
                step={inputStep.years}
                suffix={t('compoundInterest.inputs.yearsSuffix')}
                formatValue={(v) => String(Math.round(v))}
                onChange={(v) => set('years', Math.round(v))}
              />
            </div>

            <div className="calc-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="calc-section-label">{t('compoundInterest.inputs.sectionGrowth')}</div>

              <SliderNumberInput
                label={t('compoundInterest.inputs.annualRate.label')}
                value={inputs.annualRatePct}
                min={l.annualRatePct.min}
                max={l.annualRatePct.max}
                step={inputStep.annualRatePct}
                suffix="%"
                formatValue={(v) => v.toFixed(1)}
                onChange={(v) => set('annualRatePct', v)}
              />
              <SliderNumberInput
                label={t('compoundInterest.inputs.contributionIncrease.label')}
                value={inputs.annualContributionIncreasePct}
                min={l.annualContributionIncreasePct.min}
                max={l.annualContributionIncreasePct.max}
                step={inputStep.annualContributionIncreasePct}
                suffix="%"
                formatValue={(v) => v.toFixed(1)}
                onChange={(v) => set('annualContributionIncreasePct', v)}
              />
            </div>
          </div>

          {/* Resultado */}
          <div className="calc-right-col">
            <div className="calc-hero-row">
              <HeroStatCard
                label={t('compoundInterest.results.finalBalance')}
                amount={result.finalBalance}
                badgeValue={`+${formatPercent(totalReturnPct)}`}
                subtitle={t('compoundInterest.results.hero.subtitle', { years: inputs.years, rate: formatDecimal(inputs.annualRatePct) })}
                subtitleShort={t('compoundInterest.results.hero.subtitleShort', { years: inputs.years, rate: formatDecimal(inputs.annualRatePct) })}
              />
              <div className="calc-stats-col">
                <KpiCard
                  label={t('compoundInterest.results.totalContributed')}
                  shortLabel={t('compoundInterest.results.totalContributedShort')}
                  amount={result.totalContributed}
                />
                <KpiCard
                  label={t('compoundInterest.results.totalInterest')}
                  shortLabel={t('compoundInterest.results.totalInterestShort')}
                  amount={result.totalInterest}
                />
              </div>
            </div>

            <div className="calc-card calc-chart-card">
              <h2 style={{ margin: '0 0 12px', font: `600 15px ${BRAND.sans}`, color: BRAND.ink }}>{t('compoundInterest.results.chartTitle')}</h2>
              <div className="calc-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.yearlyBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ciContrib" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="ciInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.accent} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={BRAND.accent} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DD" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#8A96A3' }} />
                    <YAxis tickLine={false} axisLine={false} width={0} tick={false} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(year) => `${t('compoundInterest.results.chart.yearAxis')} ${year}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #ECE7DD', fontFamily: BRAND.sans, fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontFamily: BRAND.sans, fontSize: 12, color: '#586470' }} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeContributed"
                      stackId="1"
                      name={t('compoundInterest.results.chart.contributedSeries')}
                      stroke="#94A3B8"
                      fill="url(#ciContrib)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeInterest"
                      stackId="1"
                      name={t('compoundInterest.results.chart.interestSeries')}
                      stroke={BRAND.accent}
                      fill="url(#ciInterest)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose por año: fila propia, a todo lo ancho, debajo del grid de 2 columnas */}
        <div className="calc-card" style={{ marginTop: 16, padding: showTable ? '14px 20px' : '10px 20px' }}>
          <button
            onClick={() => setShowTable((v) => !v)}
            className="calc-toggle"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 6px', width: '100%',
            }}
          >
            <span style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.ink }}>
              {showTable ? t('compoundInterest.results.table.toggleHide') : t('compoundInterest.results.table.toggleShow')}
            </span>
            {showTable ? <ChevronUp size={16} color="#8A96A3" /> : <ChevronDown size={16} color="#8A96A3" />}
          </button>

          {showTable && (
            <div style={{ marginTop: 14, maxHeight: 400, overflowY: 'auto', overflowX: 'auto' }}>
              <table className="calc-table">
                <thead>
                  <tr>
                    <th>{t('compoundInterest.results.table.year')}</th>
                    <th>{t('compoundInterest.results.table.cumulativeContributed')}</th>
                    <th>{t('compoundInterest.results.table.cumulativeInterest')}</th>
                    <th>{t('compoundInterest.results.table.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{formatCurrency(row.cumulativeContributed)}</td>
                      <td>{formatCurrency(row.cumulativeInterest)}</td>
                      <td style={{ fontWeight: 600, color: BRAND.ink }}>{formatCurrency(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <CalculatorDisclaimer />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

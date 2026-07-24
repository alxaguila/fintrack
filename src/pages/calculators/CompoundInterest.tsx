import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { BRAND } from '@/components/landing/brand'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { SliderNumberInput } from '@/components/calculators/SliderNumberInput'
import { KpiCard } from '@/components/calculators/KpiCard'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import {
  calculateCompoundInterest,
  clampCompoundInterestInput,
  COMPOUND_INTEREST_LIMITS,
  type CapitalizationFrequency,
} from '@/lib/calculators/compoundInterest'

const CSS = `
.calc-page a{color:${BRAND.blue};text-decoration:none}
.calc-card{background:#fff;border:1px solid #ECE7DD;border-radius:20px;box-shadow:0 4px 14px rgba(10,37,64,.04);box-sizing:border-box}
.calc-grid{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:24px;align-items:stretch}
.calc-right-col{display:flex;flex-direction:column;gap:16px;min-width:0;height:100%}
.calc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.calc-chart-card{flex:1;min-height:380px;display:flex;flex-direction:column;padding:20px 20px 8px}
.calc-chart-body{flex:1;min-height:280px}
.calc-select{font:600 14px ${BRAND.sans};color:${BRAND.ink};border:1px solid #DCD5C8;border-radius:10px;padding:9px 12px;background:#fff;cursor:pointer}
.calc-share{transition:background .2s ease}
.calc-share:hover{background:${BRAND.accentHover}!important}
.calc-toggle{transition:background .2s ease}
.calc-toggle:hover{background:#EAF4FA!important}
.calc-table{width:100%;border-collapse:collapse;font:400 13px ${BRAND.sans};color:${BRAND.ink}}
.calc-table th{text-align:right;font:600 12px ${BRAND.sans};color:#8A96A3;padding:8px 10px;border-bottom:1px solid #ECE7DD;white-space:nowrap;position:sticky;top:0;background:#fff}
.calc-table th:first-child,.calc-table td:first-child{text-align:left}
.calc-table td{text-align:right;padding:8px 10px;border-bottom:1px solid #F3EFE6;white-space:nowrap}
@media (max-width:900px){.calc-grid{grid-template-columns:1fr}.calc-right-col{height:auto}}
@media (max-width:560px){.calc-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
`

const inputStep = {
  initialCapital: 100,
  monthlyContribution: 25,
  years: 1,
  annualRatePct: 0.5,
  annualContributionIncreasePct: 0.5,
}

// El slider de aportación mensual usa un tope "realista" de arrastre; el input
// numérico y el clamp siguen validando contra el máximo técnico (10.000 €).
const MONTHLY_CONTRIBUTION_SLIDER_MAX = 1000

// Coma decimal (es-ES), igual que formatCurrency — evita el "8.0%" con punto.
function formatPercent(v: number): string {
  return `${v.toFixed(1).replace('.', ',')}%`
}

export default function CompoundInterest() {
  const { t, i18n } = useTranslation('calculators')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [inputs, setInputs] = useState(() =>
    clampCompoundInterestInput({
      initialCapital: searchParams.get('initial'),
      monthlyContribution: searchParams.get('contribution'),
      years: searchParams.get('years'),
      annualRatePct: searchParams.get('rate'),
      annualContributionIncreasePct: searchParams.get('increase'),
      frequency: searchParams.get('frequency'),
    }),
  )
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    document.title = t('compoundInterest.meta.title')
  }, [t, i18n.language])

  const result = useMemo(() => calculateCompoundInterest(inputs), [inputs])
  const rows = result.yearlyBreakdown.slice(1)

  const set = <K extends keyof typeof inputs>(key: K, value: (typeof inputs)[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const handleShare = async () => {
    const params = new URLSearchParams({
      initial: String(inputs.initialCapital),
      contribution: String(inputs.monthlyContribution),
      years: String(inputs.years),
      rate: String(inputs.annualRatePct),
      increase: String(inputs.annualContributionIncreasePct),
      frequency: inputs.frequency,
    })
    const url = `${window.location.origin}/calculators/compound-interest?${params.toString()}`
    const shareText = t('compoundInterest.share.shareText', { amount: formatCurrency(result.finalBalance), years: inputs.years })

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: t('compoundInterest.hero.title'), text: shareText, url })
      } catch (err) {
        // El usuario cerró el panel nativo de compartir (AbortError) — no es un error real.
        if (err instanceof Error && err.name !== 'AbortError') {
          await copyToClipboard(url)
        }
      }
      return
    }
    await copyToClipboard(url)
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: t('compoundInterest.share.toastTitle'), description: t('compoundInterest.share.toastDescription'), variant: 'success' })
    } catch {
      // Portapapeles bloqueado (permisos del navegador) — sin fallback visible, no bloquea el resto de la página.
    }
  }

  const l = COMPOUND_INTEREST_LIMITS

  return (
    <div className="calc-page" style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <style>{CSS}</style>
      <SiteHeader />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
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
          <div className="calc-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ margin: 0, font: `600 15px ${BRAND.sans}`, color: BRAND.ink }}>{t('compoundInterest.inputs.title')}</h2>

            <SliderNumberInput
              label={t('compoundInterest.inputs.initialCapital.label')}
              value={inputs.initialCapital}
              min={l.initialCapital.min}
              max={l.initialCapital.max}
              step={inputStep.initialCapital}
              suffix="€"
              formatValue={(v) => String(Math.round(v))}
              onChange={(v) => set('initialCapital', v)}
            />
            <SliderNumberInput
              label={t('compoundInterest.inputs.monthlyContribution.label')}
              value={inputs.monthlyContribution}
              min={l.monthlyContribution.min}
              max={l.monthlyContribution.max}
              sliderMax={MONTHLY_CONTRIBUTION_SLIDER_MAX}
              step={inputStep.monthlyContribution}
              suffix="€"
              formatValue={(v) => String(Math.round(v))}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.ink }}>{t('compoundInterest.inputs.frequency.label')}</label>
              <select
                className="calc-select"
                value={inputs.frequency}
                onChange={(e) => set('frequency', e.target.value as CapitalizationFrequency)}
              >
                <option value="monthly">{t('compoundInterest.inputs.frequency.monthly')}</option>
                <option value="annual">{t('compoundInterest.inputs.frequency.annual')}</option>
              </select>
            </div>

            <button
              onClick={handleShare}
              className="calc-share"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
                background: BRAND.accent, color: '#fff', font: `600 14px ${BRAND.sans}`, padding: '11px 18px',
                borderRadius: 999, border: 'none', cursor: 'pointer',
              }}
            >
              <Share2 size={16} />
              {t('compoundInterest.share.button')}
            </button>
          </div>

          {/* Resultado */}
          <div className="calc-right-col">
            <div className="calc-kpis">
              <KpiCard label={t('compoundInterest.results.totalContributed')} amount={result.totalContributed} />
              <KpiCard label={t('compoundInterest.results.finalBalance')} amount={result.finalBalance} accent />
              <KpiCard label={t('compoundInterest.results.totalInterest')} amount={result.totalInterest} />
              <KpiCard
                label={t('compoundInterest.results.totalReturn')}
                value={formatPercent(result.totalContributed > 0 ? (result.totalInterest / result.totalContributed) * 100 : 0)}
              />
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

        {/* Desglose año a año: fila propia, a todo lo ancho, debajo del grid de 2 columnas */}
        <div className="calc-card" style={{ marginTop: 20, padding: showTable ? 20 : '14px 20px' }}>
          <button
            onClick={() => setShowTable((v) => !v)}
            className="calc-toggle"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
              font: `600 13px ${BRAND.sans}`, color: BRAND.blue, padding: '4px 6px', borderRadius: 8, width: '100%',
            }}
          >
            {showTable ? t('compoundInterest.results.table.toggleHide') : t('compoundInterest.results.table.toggleShow')}
            {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTable && (
            <div style={{ marginTop: 14, maxHeight: 400, overflowY: 'auto', overflowX: 'auto' }}>
              <table className="calc-table">
                <thead>
                  <tr>
                    <th>{t('compoundInterest.results.table.year')}</th>
                    <th>{t('compoundInterest.results.table.cumulativeContributed')}</th>
                    <th>{t('compoundInterest.results.table.yearInterest')}</th>
                    <th>{t('compoundInterest.results.table.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{formatCurrency(row.cumulativeContributed)}</td>
                      <td>{formatCurrency(row.interestThisYear)}</td>
                      <td style={{ fontWeight: 600, color: BRAND.ink }}>{formatCurrency(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts'
import { ArrowUp, ArrowDown, Minus, Eye, Check, Info, TriangleAlert, ChevronLeft } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useDashboardTotals, useDashboardBreakdown, useDashboardCategorySeries, useTransactionCounts } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { usePlan } from '@/hooks/usePlan'
import { UpgradeHintDialog } from '@/components/plan/UpgradeHintDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AmountSplit, fmtAmount } from '@/components/ui/amount-split'
import { bucketKey, bucketLabel, bucketRange, type Granularity } from '@/lib/periods'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import type { TransactionType } from '@/lib/database.types'

const BAR_PX = 76 // ancho por periodo (para el scroll horizontal)
const CHART_H = 232 // alto del cash flow
const VISIBLE_BARS = 12 // ventana visible por defecto (grupos de columnas)

// Geometría del donut (px).
const DONUT = 224, DCX = 112, DCY = 112, D_INNER = 62, D_OUTER = 90, D_ICON_R = 102

// Paleta. Ingreso = navy azul (más azul que negro); gasto rosa palo; balance
// neutro; navy oscuro del sidebar para la tarjeta de tasa. Sin semáforo.
const C_INCOME = '#1F4E8C'   // navy azul — ingresos
const C_EXPENSE = '#CB6391'  // rosa palo — gastos
const C_NEUTRAL = '#64748b'  // gris pizarra — balance
const C_TASA = '#0A2540'     // navy del sidebar — fondo tarjeta tasa de ahorro

function pastel(hex: string): string {
  const h = hex?.replace('#', '')
  if (!h || h.length !== 6) return hex
  const mix = (c: number) => Math.round(c + (255 - c) * 0.45)
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function prevPeriodKey(key: string, g: Granularity): string {
  if (g === 'year') return String(Number(key) - 1)
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return Number(q) === 1 ? `${Number(y) - 1}-Q4` : `${y}-Q${Number(q) - 1}`
  }
  const [y, m] = key.split('-')
  return Number(m) === 1 ? `${Number(y) - 1}-12` : `${y}-${String(Number(m) - 1).padStart(2, '0')}`
}

function trendColor(diff: number, positiveIsGood: boolean): string {
  if (Math.abs(diff) < 1e-9) return '#475569'
  const good = diff > 0 ? positiveIsGood : !positiveIsGood
  return good ? '#0F766E' : '#A03A66'
}

// ── SVG de las columnas del cash flow ─────────────────────────────────────────
// Rectángulo con esquinas superiores redondeadas.
function topRoundedPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}
// Rectángulo con borde superior "roto" (zigzag): indica que la columna se sale de escala.
function tornTopPath(x: number, y: number, w: number, h: number) {
  const teeth = Math.max(3, Math.round(w / 4))
  const zh = 5
  let d = `M${x},${y + h} L${x},${y + zh}`
  for (let i = 0; i < teeth; i++) {
    const x1 = x + (w * (i + 0.5)) / teeth
    const x2 = x + (w * (i + 1)) / teeth
    d += ` L${x1},${y} L${x2},${y + zh}`
  }
  d += ` L${x + w},${y + h} Z`
  return d
}
// Genera el `shape` de una serie de barras. `cap` = techo de escala; las que lo
// superan se dibujan con el borde roto. Opacidad menor en periodos no activos.
function makeBarShape(color: string, dataKey: string, cap: number, activeKey: string | null, inactiveOp: number) {
  return (props: any) => {
    let { x, y, width, height, payload } = props
    if (y < 0) { height += y; y = 0 } // recorta al borde superior del área
    if (!(height > 0) || !(width > 0)) return <g />
    const over = (payload?.[dataKey] ?? 0) > cap * 1.001
    const op = payload?.key === activeKey ? 1 : inactiveOp
    const d = over ? tornTopPath(x, y, width, height) : topRoundedPath(x, y, width, height, 5)
    return <path d={d} fill={color} fillOpacity={op} />
  }
}

// Fondo translúcido tras el periodo activo (como el de la fila seleccionada).
function makeActiveBg(activeKey: string | null, dx: number, w: number) {
  return (props: any) => {
    const { x, y, height, payload } = props
    if (!payload || payload.key !== activeKey) return <g />
    return <rect x={x + dx} y={y} width={w} height={height} rx={6} fill="rgba(100,116,139,0.13)" />
  }
}

// Pastilla compacta de variación vs periodo anterior: flecha + % + importe absoluto.
function DeltaPill({ current, previous, positiveIsGood }: { current: number; previous: number; positiveIsGood: boolean }) {
  if (!isFinite(previous) || previous <= 0) return null
  const diff = current - previous
  const pct = (diff / previous) * 100
  const flat = Math.abs(pct) < 0.5
  const Arrow = flat ? Minus : diff > 0 ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold" style={{ color: trendColor(diff, positiveIsGood) }}>
      <Arrow className="h-3 w-3" />{Math.abs(pct).toFixed(0)}% · {fmtAmount(Math.abs(diff))}
    </span>
  )
}

// Mini-barras de tendencia con leyenda flotante al hover. Base central si hay
// negativos. Resalta el mes activo (o el último si no hay selección).
function BarSpark({ data, color, inactiveOp = 0.3, activeIndex }: { data: { label: string; value: number }[]; color: string; inactiveOp?: number; activeIndex?: number }) {
  const [hi, setHi] = useState<number | null>(null)
  if (data.length < 2) return null
  const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 1)
  const anyNeg = data.some(d => d.value < 0)
  const baseHi = activeIndex != null && activeIndex >= 0 ? activeIndex : data.length - 1
  return (
    <div className="relative">
      <div className="flex h-9 items-stretch gap-[3px]">
        {data.map((d, i) => {
          const h = Math.max(6, (Math.abs(d.value) / maxAbs) * 100)
          const pos = d.value >= 0
          const op = hi == null ? (i === baseHi ? 1 : inactiveOp) : (hi === i ? 1 : inactiveOp * 0.6)
          return (
            <div key={i} className="relative min-w-[3px] flex-1" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
              <div className="absolute left-0 right-0 rounded-[2px]" style={{ backgroundColor: color, opacity: op, height: `${anyNeg ? h / 2 : h}%`, ...(anyNeg ? (pos ? { bottom: '50%' } : { top: '50%' }) : { bottom: 0 }) }} />
            </div>
          )
        })}
      </div>
      {hi != null && (
        <div className="pointer-events-none absolute bottom-full z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-2 py-1 text-[11px] shadow-lg" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
          <span className="text-muted-foreground">{data[hi].label} · </span><span className="font-semibold tabular-nums">{fmtAmount(data[hi].value)}</span>
        </div>
      )}
    </div>
  )
}

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
}

export default function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tcommon } = useTranslation('common')
  const { activeProfile } = useProfile()
  const navigate = useNavigate()

  const [granularity, setGranularity] = useState<Granularity>('month')
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [breakdownType, setBreakdownType] = useState<TransactionType>('gasto')
  const [donutActive, setDonutActive] = useState<number | null>(null)
  const [donutXY, setDonutXY] = useState<{ x: number; y: number } | null>(null)
  const [selectedCat, setSelectedCat] = useState<{ key: string; categoryId: string | null; name: string } | null>(null)

  const { data: totals = [], isLoading } = useDashboardTotals(activeProfile?.id)
  const { data: counts } = useTransactionCounts(activeProfile?.id)
  const { data: categories = [] } = useCategories()
  const { plan, limits: planLimits } = usePlan()
  const monthNames = t('charts.months', { returnObjects: true }) as string[]
  const scrollRef = useRef<HTMLDivElement>(null)
  // Ventana de histórico del cash flow: por defecto VISIBLE_BARS; "<" carga
  // todo de golpe (bloqueado en FREE). Se reinicia al cambiar de perfil.
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showUpgradeHint, setShowUpgradeHint] = useState(false)
  useEffect(() => { setShowAllHistory(false) }, [activeProfile?.id])

  // Tope de histórico del Dashboard según el plan (NULL = ilimitado). Se recorta
  // aquí, antes de agrupar en periodos, para que ningún bloque posterior (KPIs,
  // sparkline, desglose) llegue a ver meses fuera del rango permitido.
  const historyMonths = planLimits?.dashboard_history_months ?? null
  const visibleTotals = useMemo(() => {
    if (historyMonths == null) return totals
    const cutoff = new Date()
    cutoff.setDate(1)
    cutoff.setMonth(cutoff.getMonth() - (historyMonths - 1))
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-01`
    return totals.filter(r => r.month >= cutoffKey)
  }, [totals, historyMonths])

  const periods = useMemo(() => {
    const map = new Map<string, { key: string; ingreso: number; gasto: number }>()
    for (const row of visibleTotals) {
      const key = bucketKey(row.month, granularity)
      const b = map.get(key) ?? { key, ingreso: 0, gasto: 0 }
      if (row.transaction_type === 'ingreso') b.ingreso += row.total_abs
      else if (row.transaction_type === 'gasto') b.gasto += row.total_abs
      map.set(key, b)
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
  }, [visibleTotals, granularity])

  const activeKey = useMemo(() => {
    if (selectedPeriod && periods.some(p => p.key === selectedPeriod)) return selectedPeriod
    return periods[periods.length - 1]?.key ?? null
  }, [selectedPeriod, periods])

  const activeBucket = periods.find(p => p.key === activeKey)
  const expenses = activeBucket?.gasto ?? 0
  const income = activeBucket?.ingreso ?? 0
  const balance = income - expenses
  const savingsRate = income > 0 ? (balance / income) * 100 : 0

  const prevBucket = useMemo(() => {
    if (!activeKey) return undefined
    return periods.find(p => p.key === prevPeriodKey(activeKey, granularity))
  }, [activeKey, granularity, periods])
  const prevIncome = prevBucket?.ingreso ?? 0
  const prevExpenses = prevBucket?.gasto ?? 0
  const prevBalance = prevIncome - prevExpenses

  const spark = useMemo(() => periods.slice(-12).map(p => ({
    key: p.key,
    label: bucketLabel(p.key, granularity, monthNames),
    ingreso: p.ingreso, gasto: p.gasto, balance: p.ingreso - p.gasto,
  })), [periods, granularity, monthNames])
  // Solo resalta un mes del sparkline si el usuario lo ha seleccionado explícitamente
  // (el mes en curso no queda preseleccionado); si no, -1 = sin resalte.
  const sparkActiveIdx = selectedPeriod ? spark.findIndex(s => s.key === selectedPeriod) : -1

  const activeRange = useMemo(() => (activeKey ? bucketRange(activeKey, granularity) : undefined), [activeKey, granularity])
  const prevRange = useMemo(() => (activeKey ? bucketRange(prevPeriodKey(activeKey, granularity), granularity) : undefined), [activeKey, granularity])
  const { data: breakdownRows = [], isLoading: breakdownLoading } = useDashboardBreakdown(activeProfile?.id, activeRange)
  const { data: prevBreakdownRows = [] } = useDashboardBreakdown(activeProfile?.id, prevRange)

  const categoryById = useMemo(() => {
    const m = new Map<string, any>()
    for (const c of categories) m.set(c.id, c)
    return m
  }, [categories])

  const breakdown = useMemo(() => {
    const map = new Map<string, { categoryId: string | null; slug: string | null; icon: string | null; color: string; total: number }>()
    let total = 0
    for (const row of breakdownRows) {
      if (row.transaction_type !== breakdownType) continue
      const k = row.category_id ?? '__uncat__'
      const cat = row.category_id ? categoryById.get(row.category_id) : undefined
      const grp = cat?.group
      const e = map.get(k) ?? { categoryId: row.category_id ?? null, slug: cat?.slug ?? null, icon: cat?.icon ?? null, color: grp?.color ?? '#94a3b8', total: 0 }
      e.total += row.total_abs
      total += row.total_abs
      map.set(k, e)
    }
    return { rows: [...map.values()].sort((a, b) => b.total - a.total), total }
  }, [breakdownRows, breakdownType, categoryById])

  const prevByCat = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of prevBreakdownRows) {
      if (row.transaction_type !== breakdownType) continue
      const k = row.category_id ?? '__uncat__'
      m.set(k, (m.get(k) ?? 0) + row.total_abs)
    }
    return m
  }, [prevBreakdownRows, breakdownType])

  const donutData = useMemo(() => {
    const total = breakdown.total
    const big: { value: number; color: string; colorSolid: string; name: string; icon: string | null; pct: number }[] = []
    let otros = 0
    for (const r of breakdown.rows) {
      const pct = total > 0 ? (r.total / total) * 100 : 0
      if (pct >= 5) big.push({ value: r.total, color: pastel(r.color), colorSolid: r.color, name: r.slug ? categoryLabel(r.slug) : t('no_category'), icon: r.icon, pct })
      else otros += r.total
    }
    if (otros > 0) big.push({ value: otros, color: '#C2C8D0', colorSolid: '#94a3b8', name: t('donut_other'), icon: null, pct: total > 0 ? (otros / total) * 100 : 0 })
    return big
  }, [breakdown, t])

  const donutIcons = useMemo(() => {
    const total = donutData.reduce((s, d) => s + d.value, 0)
    if (total <= 0) return []
    let acc = 0
    const out: { icon: string; color: string; left: number; top: number }[] = []
    for (const d of donutData) {
      const mid = acc + d.value / total / 2
      acc += d.value / total
      if (!d.icon) continue
      const ang = mid * 2 * Math.PI
      out.push({ icon: d.icon, color: d.colorSolid, left: DCX + D_ICON_R * Math.sin(ang), top: DCY - D_ICON_R * Math.cos(ang) })
    }
    return out
  }, [donutData])

  // Cambios relevantes: subcategorías que más varían vs el periodo anterior.
  const movers = useMemo(() => {
    const out: { key: string; categoryId: string | null; name: string; icon: string | null; color: string; pct: number }[] = []
    for (const r of breakdown.rows) {
      const key = r.categoryId ?? '__uncat__'
      const prev = prevByCat.get(key) ?? 0
      if (prev <= 0) continue
      const pct = ((r.total - prev) / prev) * 100
      if (Math.abs(pct) < 5) continue
      out.push({ key, categoryId: r.categoryId, name: r.slug ? categoryLabel(r.slug) : t('no_category'), icon: r.icon, color: r.color, pct })
    }
    return out.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 5)
  }, [breakdown.rows, prevByCat, t])

  // Insights: observaciones heurísticas deterministas.
  const observations = useMemo(() => {
    const obs: { kind: 'good' | 'warn' | 'info'; text: string }[] = []
    if (income > 0 && savingsRate >= 20) obs.push({ kind: 'good', text: t('observations.good_savings', { rate: savingsRate.toFixed(0) }) })
    else if (income > 0 && balance < 0) obs.push({ kind: 'warn', text: t('observations.negative_balance') })
    if (breakdownType === 'gasto' && breakdown.rows.length > 0 && breakdown.total > 0) {
      const top = breakdown.rows[0]
      obs.push({ kind: 'info', text: t('observations.top_category', { name: top.slug ? categoryLabel(top.slug) : t('no_category'), pct: ((top.total / breakdown.total) * 100).toFixed(0) }) })
    }
    if (movers.length > 0) {
      const m = movers[0]
      const bad = m.pct > 0 ? breakdownType !== 'ingreso' : breakdownType === 'ingreso'
      obs.push({ kind: bad ? 'warn' : 'good', text: t(m.pct > 0 ? 'observations.rose' : 'observations.fell', { name: m.name, pct: Math.abs(m.pct).toFixed(0) }) })
    }
    if (counts?.uncategorized) obs.push({ kind: 'info', text: t('observations.uncategorized', { count: counts.uncategorized }) })
    return obs.slice(0, 4)
  }, [income, savingsRate, balance, breakdownType, breakdown, movers, counts, t])

  const catSeries = useDashboardCategorySeries(activeProfile?.id, selectedCat?.categoryId ?? null, breakdownType, !!selectedCat)
  const catByPeriod = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of catSeries.data ?? []) {
      const k = bucketKey(row.month, granularity)
      map.set(k, (map.get(k) ?? 0) + row.total_abs)
    }
    return map
  }, [catSeries.data, granularity])

  const isFiltered = !!selectedCat
  const filterColor = breakdownType === 'ingreso' ? C_INCOME : breakdownType === 'gasto' ? C_EXPENSE : C_NEUTRAL

  const visiblePeriods = showAllHistory ? periods : periods.slice(-VISIBLE_BARS)
  const chartData = visiblePeriods.map(p => ({
    key: p.key, ingreso: p.ingreso, gasto: p.gasto, value: catByPeriod.get(p.key) ?? 0,
  }))
  const chartWidth = Math.max(chartData.length * BAR_PX, 320)
  // Botón "<": carga todo el histórico de golpe. Siempre es clicable — en FREE
  // muestra un aviso de mejora de plan en vez de quedar inerte; solo se
  // deshabilita quitando el brillo cuando de verdad no hay nada más que
  // revelar (plan de pago que ya no tiene más historial, o ya está todo cargado).
  const historyLockedByPlan = plan === 'free'
  const hasMoreHistory = !showAllHistory && periods.length > VISIBLE_BARS
  function handleHistoryClick() {
    if (historyLockedByPlan) { setShowUpgradeHint(true); return }
    if (hasMoreHistory) setShowAllHistory(true)
  }

  // Techo de escala: si un periodo es un outlier (>1.7× del 2º), lo capamos para
  // que el resto de columnas sean altas; el outlier se dibuja con el borde roto.
  const cap = useMemo(() => {
    const vals: number[] = []
    for (const d of chartData) { if (isFiltered) vals.push(d.value); else { vals.push(d.ingreso, d.gasto) } }
    const nz = vals.filter(v => v > 0).sort((a, b) => b - a)
    if (nz.length === 0) return 1
    const max = nz[0], second = nz[1] ?? max
    return max > second * 1.7 ? second * 1.15 : max * 1.02
  }, [chartData, isFiltered])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [chartWidth, granularity])

  function openSubcategory(categoryId: string | null) {
    if (!activeKey) return
    const { from, to } = bucketRange(activeKey, granularity)
    const params = new URLSearchParams({ dateFrom: from, dateTo: to, transactionType: breakdownType })
    if (categoryId) params.set('categoryId', categoryId)
    else params.set('uncategorized', 'true')
    navigate(`/app/transactions?${params.toString()}`)
  }

  if (!activeProfile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">{t('no_profile.title')}</h2>
        <p className="text-muted-foreground">{t('no_profile.description')}</p>
      </div>
    )
  }

  const activeLabel = activeKey ? bucketLabel(activeKey, granularity, monthNames) : ''

  return (
    <div className="flex flex-col gap-3 p-6 lg:h-full lg:overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="inline-flex rounded-lg border p-0.5 text-sm">
          {(['month', 'quarter', 'year'] as const).map(g => (
            <button key={g} onClick={() => { setGranularity(g); setSelectedPeriod(null); setSelectedCat(null) }}
              className={`px-3 py-1 rounded-md transition-colors ${granularity === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t(`granularity.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Aviso de movimientos sin categoría */}
      {!!counts?.uncategorized && (
        <button onClick={() => navigate('/app/transactions?uncategorized=true')}
          className="flex items-center gap-[11px] rounded-xl border border-[#EDDCA8] bg-[#FBF3DC] px-4 py-[9px] text-left transition-colors hover:bg-[#F8ECC8]">
          <svg width="17" height="17" viewBox="0 0 20 20" className="shrink-0"><path d="M10 2 L18.5 17 H1.5 Z" fill="none" stroke="#B5842E" strokeWidth="1.6" strokeLinejoin="round" /><line x1="10" y1="8" x2="10" y2="12" stroke="#B5842E" strokeWidth="1.7" strokeLinecap="round" /><circle cx="10" cy="14.5" r="1" fill="#B5842E" /></svg>
          <span className="text-[13.5px] text-[#6B5A2B]"><span className="font-semibold text-[#4A3D18]">{t('uncategorized.count', { count: counts.uncategorized })}</span></span>
          <span className="ml-auto text-[13px] font-semibold text-[#B5842E]">{t('uncategorized.review')} →</span>
        </button>
      )}

      {totals.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-lg font-medium">{t('no_data.title')}</p>
          <p className="text-muted-foreground text-sm">{t('no_data.description')}</p>
          <Button onClick={() => navigate('/app/import')}>{t('no_data.action')}</Button>
        </div>
      ) : (
        <>
          {/* KPIs (fila compacta) */}
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('kpis.total_income')}</CardTitle><DeltaPill current={income} previous={prevIncome} positiveIsGood /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={income} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_INCOME} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.ingreso }))} color={C_INCOME} inactiveOp={0.5} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('kpis.total_expenses')}</CardTitle><DeltaPill current={expenses} previous={prevExpenses} positiveIsGood={false} /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={expenses} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_EXPENSE} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.gasto }))} color={C_EXPENSE} inactiveOp={0.42} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('kpis.balance')}</CardTitle><DeltaPill current={balance} previous={prevBalance} positiveIsGood /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={balance} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_NEUTRAL} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.balance }))} color={C_NEUTRAL} inactiveOp={0.4} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 text-white shadow-sm" style={{ backgroundColor: C_TASA }}>
              <CardHeader className="p-4 pb-1"><CardTitle className="text-[15px] font-bold text-white/80">{t('kpis.savings_rate')}</CardTitle></CardHeader>
              <CardContent className="space-y-1 p-4 pt-0">
                <p className="text-4xl font-extrabold tracking-tight" style={{ color: savingsRate >= 0 ? '#5EEAD4' : '#F0A6C4' }}>{savingsRate.toFixed(0)}<span className="text-2xl font-bold text-white/70">%</span></p>
                <p className="text-[13px] text-white/70">{t('kpis.saved_amount', { amount: fmtAmount(Math.max(0, balance)) })}</p>
              </CardContent>
            </Card>
          </div>

          {/* Cuerpo en 2 columnas */}
          <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
            {/* Columna izquierda */}
            <div className="flex flex-col gap-3 lg:col-span-2 lg:min-h-0">
              {/* Cash flow */}
              <Card className="shrink-0 rounded-2xl">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-[15px] font-bold">{t(`evolution_by.${granularity}`)}{isFiltered && <span className="font-semibold text-muted-foreground"> · {selectedCat!.name}</span>}</CardTitle>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {isFiltered ? (
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: filterColor }} />{selectedCat!.name}</span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: C_INCOME }} />{tcommon('transaction_type.ingreso')}</span>
                          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: C_EXPENSE }} />{tcommon('transaction_type.gasto')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? <Skeleton style={{ height: CHART_H }} /> : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleHistoryClick}
                        disabled={!historyLockedByPlan && !hasMoreHistory}
                        title={historyLockedByPlan ? t('history_expand.locked_hint') : t('history_expand.hint')}
                        aria-label={historyLockedByPlan ? t('history_expand.locked_hint') : t('history_expand.hint')}
                        className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-300 disabled:hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div ref={scrollRef} className="no-scrollbar min-w-0 cursor-pointer overflow-x-auto" style={{ maxWidth: VISIBLE_BARS * BAR_PX }}>
                      <ComposedChart width={chartWidth} height={CHART_H} data={chartData} barCategoryGap="26%" barGap={2}
                        onClick={(e: any) => { if (e?.activeLabel) { const k = String(e.activeLabel); setSelectedPeriod(prev => prev === k ? null : k) } }}
                        margin={{ top: 0, right: 6, bottom: 0, left: 6 }}>
                        <YAxis hide domain={[0, cap]} allowDataOverflow />
                        <XAxis dataKey="key" tickFormatter={(k) => bucketLabel(k, granularity, monthNames)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} height={20} dy={2} padding={{ left: 10, right: 10 }} />
                        <Tooltip cursor={{ fill: 'rgba(100,116,139,0.10)', radius: 6 }} content={<CashTooltip granularity={granularity} monthNames={monthNames} tcommon={tcommon} selectedName={selectedCat?.name} />} />
                        {isFiltered ? (
                          <Bar dataKey="value" fill={filterColor} barSize={24} isAnimationActive={false} background={makeActiveBg(selectedPeriod, -24, 66)} shape={makeBarShape(filterColor, 'value', cap, selectedPeriod, 0.5)} />
                        ) : (
                          <>
                            <Bar dataKey="ingreso" fill={C_INCOME} barSize={20} isAnimationActive={false} background={makeActiveBg(selectedPeriod, -16, 68)} shape={makeBarShape(C_INCOME, 'ingreso', cap, selectedPeriod, 0.55)} />
                            <Bar dataKey="gasto" fill={C_EXPENSE} barSize={20} isAnimationActive={false} shape={makeBarShape(C_EXPENSE, 'gasto', cap, selectedPeriod, 0.5)} />
                          </>
                        )}
                      </ComposedChart>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Desglose por subcategoría */}
              <Card className="flex flex-col rounded-2xl lg:min-h-0 lg:flex-1">
                <CardHeader className="shrink-0 p-4 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-[15px] font-bold">{t('sections.by_subcategory')}</CardTitle>
                    <div className="inline-flex rounded-lg border p-0.5 text-sm">
                      {(['gasto', 'ingreso', 'no_computable'] as const).map(ty => (
                        <button key={ty} onClick={() => { setBreakdownType(ty); setSelectedCat(null) }}
                          className={`px-3 py-1 rounded-md transition-colors ${breakdownType === ty ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          {tcommon(`transaction_type.${ty}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 lg:min-h-0 lg:flex-1">
                  <div className="no-scrollbar max-h-[280px] space-y-0.5 overflow-y-auto lg:max-h-none lg:h-full">
                    {breakdownLoading ? [0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-11" />)
                      : breakdown.rows.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">{t('no_data.title')}</p>
                      ) : breakdown.rows.map(r => {
                        const Icon = categoryIcon(r.icon)
                        const pct = breakdown.total > 0 ? (r.total / breakdown.total) * 100 : 0
                        const key = r.categoryId ?? '__uncat__'
                        const soft = pastel(r.color)
                        const name = r.slug ? categoryLabel(r.slug) : t('no_category')
                        const isSel = selectedCat?.key === key
                        const toggle = () => setSelectedCat(isSel ? null : { key, categoryId: r.categoryId, name })
                        return (
                          <div key={key} role="button" tabIndex={0} onClick={toggle}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${isSel ? 'bg-slate-200/80' : 'hover:bg-slate-200/70'}`}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${soft}38`, color: r.color }}><Icon className="h-4 w-4" /></span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-medium">{name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                              </div>
                              <div className="mt-1 flex items-center gap-3">
                                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: soft }} /></div>
                                <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{fmtAmount(r.total)}</span>
                              </div>
                            </div>
                            <div className="flex w-7 shrink-0 items-center justify-center self-center">
                              {isSel && (
                                <button onClick={(e) => { e.stopPropagation(); openSubcategory(r.categoryId) }} title={t('view_transactions')} aria-label={t('view_transactions')}
                                  className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-300/70 hover:text-slate-900"><Eye className="h-4 w-4" /></button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col gap-3 lg:min-h-0">
              {/* Distribución de gasto (donut) */}
              <Card className="shrink-0 rounded-2xl">
                <CardHeader className="p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('sections.spending_distribution')}</CardTitle></CardHeader>
                <CardContent className="flex justify-center p-2">
                  {breakdownLoading ? <Skeleton className="h-52 w-full" />
                    : breakdown.rows.length === 0 ? (<p className="py-10 text-center text-sm text-muted-foreground">{t('no_data.title')}</p>)
                    : (
                      <div className="relative" style={{ width: DONUT, height: DONUT }}
                        onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setDonutXY({ x: e.clientX - rect.left, y: e.clientY - rect.top }) }}
                        onMouseLeave={() => { setDonutActive(null); setDonutXY(null) }}>
                        <PieChart width={DONUT} height={DONUT}>
                          <Pie data={donutData} dataKey="value" nameKey="name" cx={DCX} cy={DCY} innerRadius={D_INNER} outerRadius={D_OUTER} paddingAngle={1.5} stroke="none" startAngle={90} endAngle={-270}
                            activeIndex={donutActive ?? undefined} activeShape={renderActiveShape}
                            onMouseEnter={(_: any, i: number) => setDonutActive(i)} onMouseLeave={() => setDonutActive(null)} isAnimationActive={false}>
                            {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                        {donutIcons.map((ic, i) => {
                          const Icon = categoryIcon(ic.icon)
                          return (<span key={i} className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-sm" style={{ left: ic.left, top: ic.top, color: ic.color }}><Icon className="h-3.5 w-3.5" /></span>)
                        })}
                        <div className="pointer-events-none absolute flex flex-col items-center" style={{ left: DCX, top: DCY, transform: 'translate(-50%, -50%)' }}>
                          <span className="text-[11px] capitalize text-muted-foreground">{activeLabel}</span>
                          <span className="text-base font-bold">{fmtAmount(breakdown.total)}</span>
                        </div>
                        {donutActive != null && donutXY && donutData[donutActive] && (
                          <div className="pointer-events-none absolute z-50 whitespace-nowrap rounded-xl border bg-card px-3 py-1.5 text-xs shadow-lg" style={{ left: donutXY.x - 14, top: donutXY.y + 14, transform: 'translateX(-100%)' }}>
                            <span className="font-semibold">{donutData[donutActive].name}</span>
                            <span className="text-muted-foreground"> · {fmtAmount(donutData[donutActive].value)} · {donutData[donutActive].pct.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Cambios relevantes */}
              {movers.length > 0 && (
                <Card className="shrink-0 rounded-2xl">
                  <CardHeader className="p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('sections.relevant_changes')}</CardTitle></CardHeader>
                  <CardContent className="space-y-0.5 p-4 pt-1">
                    {movers.map(m => {
                      const Icon = categoryIcon(m.icon)
                      const up = m.pct > 0
                      const Arrow = up ? ArrowUp : ArrowDown
                      const color = trendColor(m.pct, breakdownType === 'ingreso')
                      const soft = pastel(m.color)
                      const isSel = selectedCat?.key === m.key
                      const toggle = () => setSelectedCat(isSel ? null : { key: m.key, categoryId: m.categoryId, name: m.name })
                      return (
                        <div key={m.key} role="button" tabIndex={0} onClick={toggle}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 transition-colors ${isSel ? 'bg-slate-200/80' : 'hover:bg-slate-200/70'}`}>
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${soft}38`, color: m.color }}><Icon className="h-3.5 w-3.5" /></span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</span>
                          <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold" style={{ color }}><Arrow className="h-3.5 w-3.5" />{Math.abs(m.pct).toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              <Card className="flex flex-col rounded-2xl lg:min-h-0 lg:flex-1">
                <CardHeader className="shrink-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{t('sections.observations')}</CardTitle></CardHeader>
                <CardContent className="no-scrollbar space-y-2.5 p-4 pt-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  {observations.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">{t('observations.none')}</p>
                  ) : observations.map((o, i) => {
                    const Icon = o.kind === 'good' ? Check : o.kind === 'warn' ? TriangleAlert : Info
                    const tint = o.kind === 'good' ? '#0F766E' : o.kind === 'warn' ? '#B5842E' : '#64748b'
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${tint}1f`, color: tint }}><Icon className="h-3 w-3" /></span>
                        <p className="text-[13px] leading-snug text-foreground/80">{o.text}</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <UpgradeHintDialog
        open={showUpgradeHint}
        onOpenChange={setShowUpgradeHint}
        title={t('history_expand.upgrade_title')}
        description={t('history_expand.upgrade_body')}
      />
    </div>
  )
}

// Tooltip visual del cash flow: periodo + puntos de color + importes con millares.
function CashTooltip({ active, payload, label, granularity, monthNames, tcommon, selectedName }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold capitalize">{bucketLabel(String(label), granularity, monthNames)}</p>
      {payload.map((e: any) => (
        <div key={e.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: e.color ?? e.fill }} />{e.dataKey === 'ingreso' ? tcommon('transaction_type.ingreso') : e.dataKey === 'gasto' ? tcommon('transaction_type.gasto') : (selectedName ?? '')}</span>
          <span className="font-semibold tabular-nums">{fmtAmount(Number(e.value))}</span>
        </div>
      ))}
    </div>
  )
}

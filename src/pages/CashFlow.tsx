import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useCategories } from '@/hooks/useCategories'
import { useDashboardTotals, useDashboardBreakdown, type DashboardBreakdownRow } from '@/hooks/useTransactions'
import { useIsMobile } from '@/hooks/useIsMobile'
import { bucketKey, bucketLabel, bucketRange, prevPeriodKey as prevPeriodKeyOf, nextPeriodKey, type Granularity } from '@/lib/periods'
import { isCurrentPeriod } from '@/lib/budgets'
import { categoryLabel } from '@/lib/categoryIcons'
import { subcategoryColor } from '@/lib/categoryColor'
import { DeltaPill, BarSpark, C_INCOME, C_EXPENSE, C_NEUTRAL, C_TASA } from '@/components/dashboard/KpiTrend'
import type { TransactionType } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AmountSplit, fmtAmount } from '@/components/ui/amount-split'

const GRANULARITIES: Granularity[] = ['month', 'quarter', 'year']

// Nodo de cierre: pendiente = neutro (gris, discontinuo — todavía no es
// dinero real), déficit = aviso, ahorro = positivo. El hub va en navy de marca.
const C_PENDING = '#94A3B8'
const C_DEFICIT = '#C2410C'
const C_SAVINGS = '#16A34A'
const C_HUB = '#0A2540'
const C_OTHERS_EXPENSE = '#94A3B8'
const C_OTHERS_INCOME = '#9CD9AF' // tono verde — sigue la familia de color de los ingresos
const PCT_THRESHOLD = 0.01

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function periodLabel(key: string, g: Granularity, lang: string): string {
  if (g === 'year') return key
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return lang === 'en' ? `Q${q} ${y}` : `${q}T ${y}`
  }
  const [y, m] = key.split('-')
  const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface FlowNode { name: string; color: string; value: number; dashed?: boolean; synthetic?: boolean }

// Desglose por SUBCATEGORÍA: cada subcategoría lleva un tono propio dentro
// del color de su grupo (rampa de luminosidad), para que sean distinguibles
// entre sí sin salirse de su familia de color.
function aggregateBySubcategory(rows: DashboardBreakdownRow[], type: TransactionType, categoryById: Map<string, any>, noCategoryLabel: string): FlowNode[] {
  const map = new Map<string, { slug: string | null; groupSlug: string | null; color: string; total: number }>()
  for (const row of rows) {
    if (row.transaction_type !== type) continue
    const cat = row.category_id ? categoryById.get(row.category_id) : undefined
    const grp = cat?.group
    const key = row.category_id ?? '__uncat__'
    const e = map.get(key) ?? { slug: cat?.slug ?? null, groupSlug: grp?.slug ?? null, color: grp?.color ?? '#94a3b8', total: 0 }
    e.total += row.total_abs
    map.set(key, e)
  }
  const list = [...map.values()].filter(r => r.total > 0).sort((a, b) => b.total - a.total)
  const countByGroup = new Map<string, number>()
  for (const r of list) {
    const gk = r.groupSlug ?? '__none__'
    countByGroup.set(gk, (countByGroup.get(gk) ?? 0) + 1)
  }
  const idxByGroup = new Map<string, number>()
  return list.map(r => {
    const gk = r.groupSlug ?? '__none__'
    const idx = idxByGroup.get(gk) ?? 0
    idxByGroup.set(gk, idx + 1)
    return {
      name: r.slug ? categoryLabel(r.slug) : noCategoryLabel,
      color: subcategoryColor(r.color, idx, countByGroup.get(gk) ?? 1),
      value: r.total,
    }
  })
}

// Agrupa en un único nodo "Otros" (siempre el último, sin re-ordenar por
// importe) las subcategorías que pesan menos del 1% del total del periodo,
// para que el diagrama se lea de un vistazo — solo si hay 2+ candidatas.
function foldSmall(list: FlowNode[], grandTotal: number, othersLabel: string, othersColor: string): FlowNode[] {
  if (grandTotal <= 0) return list
  const keep: FlowNode[] = []
  const small: FlowNode[] = []
  for (const n of list) (n.value / grandTotal < PCT_THRESHOLD ? small : keep).push(n)
  if (small.length < 2) return list
  const foldedValue = small.reduce((s, n) => s + n.value, 0)
  return [...keep, { name: othersLabel, color: othersColor, value: foldedValue }]
}

const NODE_WIDTH = 5
const GAP_SHAVE = 1.5 // px cosméticos que se recortan al DIBUJAR cada rama (no al calcular su posición), para dejar un hueco visual entre ramas sin tocar el encaje exacto
const LABEL_MIN_HEIGHT = 9 // por debajo de este alto no cabe la etiqueta de dos líneas — se omite (el hover la sigue mostrando)

interface Rect { x: number; y0: number; height: number; node: FlowNode }
interface Attach { y0: number; height: number }

// Apila SIN separación en el cálculo (la separación visual se aplica solo al
// dibujar, ver GAP_SHAVE) — así la suma encaja exacta en el presupuesto.
function stackExact(list: FlowNode[], x: number, top: number, ky: number): Rect[] {
  let cursor = top
  return list.map(node => {
    const height = node.value * ky
    const rect: Rect = { x, y0: cursor, height, node }
    cursor += height
    return rect
  })
}

// Segmentos de enganche en el borde del hub: proporcionales al valor sobre
// el total GRANDE (el mayor de ingreso/gasto), para que la suma encaje exacta
// en el alto del hub sin huecos ni desbordes.
function trueStack(list: FlowNode[], totalValue: number, top: number, hubHeight: number): Attach[] {
  let cursor = top
  return list.map(node => {
    const h = totalValue > 0 ? (node.value / totalValue) * hubHeight : 0
    const seg: Attach = { y0: cursor, height: h }
    cursor += h
    return seg
  })
}

// Una columna (ingreso o gasto) = ramas reales apiladas con su propia escala
// (kyReal = basePlotH / total real de ESE lado), para que colectivamente
// ocupen el 100% del alto aunque exista una banda de ahorro/déficit que no
// llega hasta el final — esa banda no debe robarles espacio. La banda
// "insertada" (pendiente/déficit/ahorro) se dibuja aparte, en otra X, con el
// mismo y0/alto que su tramo de enganche en el hub (mantiene su proporción
// real y sale desde la parte baja del hub, sin competir por los mismos píxeles).
function buildSide(real: FlowNode[], synthetic: FlowNode | null, baseX: number, insetX: number, top: number, kyReal: number, syntheticAttach: Attach | null): Rect[] {
  const rects = stackExact(real, baseX, top, kyReal)
  if (synthetic && syntheticAttach) {
    rects.push({ x: insetX, y0: syntheticAttach.y0, height: syntheticAttach.height, node: { ...synthetic, synthetic: true } })
  }
  return rects
}

// Construye la geometría del diagrama: contenedor de alto FIJO (basePlotH,
// nunca crece). El hub ocupa SIEMPRE el 100% de basePlotH (ingreso real +
// hueco pendiente/déficit y gasto real + ahorro suman, por construcción, el
// mismo total — ver gap/outNet en el componente). Cada columna lateral usa
// su propia escala (kyIn/kyOut = basePlotH / total real de ese lado) para que
// las ramas reales que sí llegan al final ocupen el 100% del alto por sí
// solas; la banda insertada (pendiente/déficit/ahorro) se posiciona aparte,
// fiel a su proporción real (escala global ky), sin robarles espacio.
function layoutSankey(inReal: FlowNode[], inSynthetic: FlowNode | null, outReal: FlowNode[], outSynthetic: FlowNode | null, width: number, basePlotH: number, margin: number) {
  const m = { top: 16, right: margin, bottom: 28, left: margin }
  const plotW = width - m.left - m.right
  const totalRealIn = inReal.reduce((s, n) => s + n.value, 0)
  const totalRealOut = outReal.reduce((s, n) => s + n.value, 0)
  const totalIncome = totalRealIn + (inSynthetic?.value ?? 0)
  const totalExpense = totalRealOut + (outSynthetic?.value ?? 0)
  const big = Math.max(totalIncome, totalExpense) || 1
  const ky = basePlotH / big
  const kyIn = totalRealIn > 0 ? basePlotH / totalRealIn : ky
  const kyOut = totalRealOut > 0 ? basePlotH / totalRealOut : ky
  const hubHeight = basePlotH

  const xIn = m.left
  const xOut = m.left + plotW - NODE_WIDTH
  const xHub = m.left + plotW / 2 - NODE_WIDTH / 2
  // El nodo insertado (pendiente/déficit/ahorro) se queda muy pegado al hub
  // — como en la referencia, donde "Net Savings" apenas se separa del centro
  // mientras el resto de ramas sí llegan hasta el extremo.
  const INSET_FRAC = 0.08
  const midXIn = xHub - (xHub - xIn) * INSET_FRAC
  const midXOut = xHub + (xOut - xHub) * INSET_FRAC

  const allIn = [...inReal, ...(inSynthetic ? [inSynthetic] : [])]
  const allOut = [...outReal, ...(outSynthetic ? [outSynthetic] : [])]
  const inAttach = trueStack(allIn, big, m.top, hubHeight)
  const outAttach = trueStack(allOut, big, m.top, hubHeight)
  const inSyntheticAttach = inSynthetic ? inAttach[inAttach.length - 1] : null
  const outSyntheticAttach = outSynthetic ? outAttach[outAttach.length - 1] : null

  const inRects = buildSide(inReal, inSynthetic, xIn, midXIn, m.top, kyIn, inSyntheticAttach)
  const outRects = buildSide(outReal, outSynthetic, xOut, midXOut, m.top, kyOut, outSyntheticAttach)

  const hubRect = { x: xHub, y0: m.top, height: hubHeight }

  return { inRects, outRects, hubRect, inAttach, outAttach, height: m.top + basePlotH + m.bottom }
}

// Cinta rellena: sigue el ancho real de cada extremo, así que se estrecha o
// ensancha entre el nodo y su tramo real en el hub. Cada rama tiene su propio
// origen y destino, así que dos ramas nunca cruzan entre sí (el orden se
// conserva a ambos lados) — no hace falta forzar un tramo recto artificial:
// el fan-out se curva de forma natural, más pronunciado cuanto más lejos
// tenga que viajar cada rama, igual que en la referencia.
function bandPath(x0: number, y0top: number, y0bot: number, x1: number, y1top: number, y1bot: number): string {
  const xm = (x0 + x1) / 2
  return `M${x0},${y0top} C${xm},${y0top} ${xm},${y1top} ${x1},${y1top} L${x1},${y1bot} C${xm},${y1bot} ${xm},${y0bot} ${x0},${y0bot} Z`
}

function CashFlowLink({ x0, y0top, y0bot, x1, y1top, y1bot, color, dashed, active, onMove, onLeave }: {
  x0: number; y0top: number; y0bot: number; x1: number; y1top: number; y1bot: number; color: string; dashed?: boolean
  active?: boolean; onMove?: (e: React.MouseEvent) => void; onLeave?: () => void
}) {
  const d = bandPath(x0, y0top, y0bot, x1, y1top, y1bot)
  return (
    <path
      d={d} fill={color} fillOpacity={active ? 0.85 : dashed ? 0.16 : 0.3}
      stroke={color} strokeOpacity={active ? 0.9 : dashed ? 0.45 : 0} strokeWidth={active ? 1.5 : 1}
      strokeDasharray={dashed ? '6,4' : undefined}
      onMouseMove={onMove} onMouseLeave={onLeave} style={{ cursor: onMove ? 'pointer' : undefined }}
    />
  )
}

function CashFlowNode({ rect, side }: { rect: Rect; side: 'in' | 'out' }) {
  const drawHeight = Math.max(1, rect.height - GAP_SHAVE)
  const dashed = rect.node.dashed
  const showLabel = rect.height >= LABEL_MIN_HEIGHT
  const synthetic = rect.node.synthetic
  // La banda suelta (pendiente/déficit/ahorro) no se alinea con ninguna
  // columna — su etiqueta va debajo, centrada, como en la referencia.
  const textX = synthetic ? rect.x + NODE_WIDTH / 2 : side === 'in' ? rect.x - 8 : rect.x + NODE_WIDTH + 8
  const anchor = synthetic ? 'middle' : side === 'in' ? 'end' : 'start'
  const labelY1 = synthetic ? rect.y0 + drawHeight + 12 : rect.y0 + rect.height / 2 - 4
  const labelY2 = synthetic ? rect.y0 + drawHeight + 24 : rect.y0 + rect.height / 2 + 8
  return (
    <g>
      <rect x={rect.x} y={rect.y0} width={NODE_WIDTH} height={drawHeight} rx={Math.min(3, drawHeight / 2)} fill={rect.node.color} fillOpacity={dashed ? 0.55 : 1} stroke={dashed ? '#8B96A3' : 'none'} strokeWidth={dashed ? 1.5 : 0} strokeDasharray={dashed ? '4,3' : undefined} />
      {showLabel && (
        <>
          <text x={textX} y={labelY1} textAnchor={anchor} fontSize={10.5} fontWeight={600} fill="#0A2540">{rect.node.name}</text>
          <text x={textX} y={labelY2} textAnchor={anchor} fontSize={9.5} fill="#94A3B8">{fmtAmount(rect.node.value)}</text>
        </>
      )}
    </g>
  )
}

interface HoverInfo { key: string; name: string; amount: string; pct: string; x: number; y: number }

export default function CashFlow() {
  const { t, i18n } = useTranslation('cashflow')
  const { t: tb } = useTranslation('budgets')
  const { t: td } = useTranslation('dashboard')
  const { activeProfile } = useProfile()
  const profileId = activeProfile?.id
  const isMobile = useIsMobile()
  const monthNames = td('charts.months', { returnObjects: true }) as string[]
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const [granularity, setGranularity] = useState<Granularity>('month')
  const [periodKey, setPeriodKey] = useState(() => bucketKey(todayDateStr(), 'month'))

  function handleGranularityChange(g: Granularity) {
    setGranularity(g)
    setPeriodKey(bucketKey(todayDateStr(), g))
  }

  const range = useMemo(() => bucketRange(periodKey, granularity), [periodKey, granularity])
  const periodOpen = isCurrentPeriod(range)

  const { data: categories = [] } = useCategories()
  const categoryById = useMemo(() => {
    const m = new Map<string, any>()
    for (const c of categories) m.set(c.id, c)
    return m
  }, [categories])

  // Totales ligeros (todo el histórico) para las tarjetas KPI — mismo hook y
  // mismo cálculo que usa Análisis, para que las tarjetas salgan idénticas.
  const { data: totals = [], isLoading: totalsLoading } = useDashboardTotals(profileId)
  const periods = useMemo(() => {
    const map = new Map<string, { key: string; ingreso: number; gasto: number }>()
    for (const row of totals) {
      const key = bucketKey(row.month, granularity)
      const b = map.get(key) ?? { key, ingreso: 0, gasto: 0 }
      if (row.transaction_type === 'ingreso') b.ingreso += row.total_abs
      else if (row.transaction_type === 'gasto') b.gasto += row.total_abs
      map.set(key, b)
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
  }, [totals, granularity])
  const activeBucket = periods.find(p => p.key === periodKey)
  const income = activeBucket?.ingreso ?? 0
  const expenses = activeBucket?.gasto ?? 0
  const balance = income - expenses
  const savingsRate = income > 0 ? (balance / income) * 100 : 0
  const prevBucket = periods.find(p => p.key === prevPeriodKeyOf(periodKey, granularity))
  const prevIncome = prevBucket?.ingreso ?? 0
  const prevExpenses = prevBucket?.gasto ?? 0
  const prevBalance = prevIncome - prevExpenses
  const spark = useMemo(() => periods.slice(-12).map(p => ({
    key: p.key, label: bucketLabel(p.key, granularity, monthNames),
    ingreso: p.ingreso, gasto: p.gasto, balance: p.ingreso - p.gasto,
  })), [periods, granularity, monthNames])
  const sparkActiveIdx = spark.findIndex(s => s.key === periodKey)

  // Desglose por subcategoría (mismo periodo) para las ramas del Sankey.
  const { data: breakdownRows = [], isLoading: breakdownLoading } = useDashboardBreakdown(profileId, range)

  const incomeItems = useMemo(
    () => aggregateBySubcategory(breakdownRows, 'ingreso', categoryById, t('no_category')),
    [breakdownRows, categoryById, t, i18n.language],
  )
  const expenseItems = useMemo(
    () => aggregateBySubcategory(breakdownRows, 'gasto', categoryById, t('no_category')),
    [breakdownRows, categoryById, t, i18n.language],
  )
  const totalIncome = useMemo(() => incomeItems.reduce((s, r) => s + r.value, 0), [incomeItems])
  const totalExpense = useMemo(() => expenseItems.reduce((s, r) => s + r.value, 0), [expenseItems])
  const gap = Math.max(0, totalExpense - totalIncome)
  const totalValue = Math.max(totalIncome, totalExpense) || 1

  const incomeFolded = useMemo(
    () => foldSmall(incomeItems, totalValue, t('others_income'), C_OTHERS_INCOME),
    [incomeItems, totalValue, t],
  )
  const expenseFolded = useMemo(
    () => foldSmall(expenseItems, totalValue, t('others_expense'), C_OTHERS_EXPENSE),
    [expenseItems, totalValue, t],
  )

  const inSynthetic: FlowNode | null = gap > 0
    ? { name: periodOpen ? t('pending_income') : t('deficit'), color: periodOpen ? C_PENDING : C_DEFICIT, value: gap, dashed: periodOpen }
    : null
  const outNet = totalIncome - totalExpense
  const outSynthetic: FlowNode | null = outNet > 0 ? { name: t('net_savings'), color: C_SAVINGS, value: outNet } : null

  const total = totalIncome + totalExpense
  const margin = isMobile ? 130 : 210
  const plotWidth = isMobile ? 400 : 900
  const totalWidth = plotWidth + margin * 2

  // El diagrama ocupa TODO el alto disponible del contenedor (no un valor
  // fijo a ojo): se mide el hueco real que deja el resto de la tarjeta
  // (leyenda, paddings) vía ResizeObserver sobre el div que envuelve el SVG.
  const chartBoxRef = useRef<HTMLDivElement>(null)
  const [chartBoxH, setChartBoxH] = useState(420)
  useEffect(() => {
    const el = chartBoxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setChartBoxH(Math.floor(entry.contentRect.height)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const basePlotH = Math.max(220, chartBoxH - 44) // 44 = top(16)+bottom(28) internos de layoutSankey

  const layout = useMemo(
    () => (total > 0 ? layoutSankey(incomeFolded, inSynthetic, expenseFolded, outSynthetic, totalWidth, basePlotH, margin) : null),
    [incomeFolded, inSynthetic, expenseFolded, outSynthetic, totalWidth, basePlotH, margin, total],
  )

  const isLoading = totalsLoading || breakdownLoading

  function showHover(key: string, node: FlowNode, e: React.MouseEvent) {
    setHover({ key, name: node.name, amount: fmtAmount(node.value), pct: ((node.value / totalValue) * 100).toFixed(1), x: e.clientX, y: e.clientY })
  }

  if (!activeProfile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">{t('no_profile.title')}</h2>
        <p className="text-muted-foreground">{t('no_profile.description')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <div className="inline-flex rounded-lg border p-0.5 text-sm">
            {GRANULARITIES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => handleGranularityChange(g)}
                className={`rounded-md px-3 py-1 transition-colors ${granularity === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tb(`granularity.${g}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
            <button type="button" onClick={() => setPeriodKey(k => prevPeriodKeyOf(k, granularity))} aria-label={tb('month_nav.prev')} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[110px] px-2 text-center text-sm font-semibold text-slate-800">{periodLabel(periodKey, granularity, i18n.language)}</span>
            <button type="button" onClick={() => setPeriodKey(k => nextPeriodKey(k, granularity))} aria-label={tb('month_nav.next')} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs — idénticas a las de Análisis */}
      <div className="mt-6 shrink-0 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {totalsLoading ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[150px] rounded-2xl" />) : (
          <>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{td('kpis.total_income')}</CardTitle><DeltaPill current={income} previous={prevIncome} positiveIsGood /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={income} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_INCOME} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.ingreso }))} color={C_INCOME} inactiveOp={0.5} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{td('kpis.total_expenses')}</CardTitle><DeltaPill current={expenses} previous={prevExpenses} positiveIsGood={false} /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={expenses} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_EXPENSE} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.gasto }))} color={C_EXPENSE} inactiveOp={0.42} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-1"><CardTitle className="text-[15px] font-bold">{td('kpis.balance')}</CardTitle><DeltaPill current={balance} previous={prevBalance} positiveIsGood /></CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <p className="leading-none"><AmountSplit amount={balance} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_NEUTRAL} /></p>
                <BarSpark data={spark.map(p => ({ label: p.label, value: p.balance }))} color={C_NEUTRAL} inactiveOp={0.4} activeIndex={sparkActiveIdx} />
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden rounded-2xl border-0 text-white shadow-sm" style={{ backgroundColor: C_TASA }}>
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-[150px] w-[150px] rounded-full"
                style={{ background: 'radial-gradient(circle,rgba(56,176,214,.3),transparent 70%)' }}
              />
              <CardHeader className="relative p-4 pb-1"><CardTitle className="text-[15px] font-bold text-white/80">{td('kpis.savings_rate')}</CardTitle></CardHeader>
              <CardContent className="relative space-y-1 p-4 pt-0">
                <p className="text-4xl font-extrabold tracking-tight" style={{ color: savingsRate >= 0 ? '#5EEAD4' : '#F0A6C4' }}>{savingsRate.toFixed(0)}<span className="text-2xl font-bold text-white/70">%</span></p>
                <p className="text-[13px] text-white/70">{td('kpis.saved_amount', { amount: fmtAmount(Math.max(0, balance)) })}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="mt-4 flex flex-1 flex-col rounded-2xl" style={{ minHeight: 0 }}>
        <CardContent className="flex flex-1 flex-col p-4 sm:p-6" style={{ minHeight: 0 }}>
          {layout && (
            <div className="shrink-0 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-income" />{t('legend.income')}</span>
              {gap > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: periodOpen ? 'repeating-linear-gradient(90deg,#94A3B8 0 4px,transparent 4px 7px)' : C_DEFICIT }} />
                  {periodOpen ? t('legend.pending') : t('deficit')}
                </span>
              )}
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: C_HUB }} />{t('legend.expense')}</span>
            </div>
          )}

          {/* Este div SIEMPRE se renderiza (incluso en carga/sin-datos) para que
              el ResizeObserver de basePlotH pueda engancharse desde el primer
              render — si solo existiera cuando hay datos, el observer (que se
              engancha una única vez al montar) nunca llegaría a encontrarlo y
              el alto del diagrama se quedaría fijo en el valor de fallback. */}
          <div ref={chartBoxRef} className="mt-4 min-h-0 flex-1 w-full overflow-x-auto overflow-y-hidden">
            {isLoading ? (
              <Skeleton className="h-full min-h-[300px] w-full rounded-2xl" />
            ) : !layout ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                <p className="text-sm font-medium text-foreground">{t('no_data.title')}</p>
                <p className="text-sm text-muted-foreground">{t('no_data.description')}</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${totalWidth} ${layout.height}`} width={totalWidth} height={layout.height} className="mx-auto block">
                {layout.inRects.map((r, i) => {
                  const key = `in-${i}`
                  return (
                    <CashFlowLink
                      key={key}
                      x0={r.x + NODE_WIDTH} y0top={r.y0} y0bot={r.y0 + r.height}
                      x1={layout.hubRect.x} y1top={layout.inAttach[i].y0} y1bot={layout.inAttach[i].y0 + layout.inAttach[i].height}
                      color={r.node.color} dashed={r.node.dashed} active={hover?.key === key}
                      onMove={e => showHover(key, r.node, e)} onLeave={() => setHover(null)}
                    />
                  )
                })}
                {layout.outRects.map((r, i) => {
                  const key = `out-${i}`
                  return (
                    <CashFlowLink
                      key={key}
                      x0={layout.hubRect.x + NODE_WIDTH} y0top={layout.outAttach[i].y0} y0bot={layout.outAttach[i].y0 + layout.outAttach[i].height}
                      x1={r.x} y1top={r.y0} y1bot={r.y0 + r.height}
                      color={r.node.color} active={hover?.key === key}
                      onMove={e => showHover(key, r.node, e)} onLeave={() => setHover(null)}
                    />
                  )
                })}

                <rect x={layout.hubRect.x} y={layout.hubRect.y0} width={NODE_WIDTH} height={layout.hubRect.height} rx={3} fill={C_HUB} />
                {layout.inRects.map((r, i) => <CashFlowNode key={`ni-${i}`} rect={r} side="in" />)}
                {layout.outRects.map((r, i) => <CashFlowNode key={`no-${i}`} rect={r} side="out" />)}
              </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {hover && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border bg-card px-2.5 py-1.5 text-xs shadow-lg" style={{ left: hover.x, top: hover.y }}>
          <div className="font-semibold text-foreground">{hover.name}</div>
          <div className="text-muted-foreground">{hover.amount} · {hover.pct}%</div>
        </div>
      )}
    </div>
  )
}

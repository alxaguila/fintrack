import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Sector, AreaChart, Area, ResponsiveContainer } from 'recharts'
import { ArrowUp, ArrowDown, Minus, Eye } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useDashboardTotals, useDashboardBreakdown, useDashboardCategorySeries } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AmountSplit, fmtAmount } from '@/components/ui/amount-split'
import { formatCurrency } from '@/lib/utils'
import { bucketKey, bucketLabel, bucketRange, type Granularity } from '@/lib/periods'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import type { TransactionType } from '@/lib/database.types'

const BAR_PX = 76 // ancho por periodo (para el scroll horizontal)
const CHART_MAX_PERIODS = 24 // máx. pares de columnas en la evolución (2 años en mensual)

// Geometría del donut (px). Los iconos se posan a D_ICON_R del centro, por fuera del anillo.
const DONUT = 256, DCX = 128, DCY = 128, D_INNER = 68, D_OUTER = 96, D_ICON_R = 116

// Paleta de la evolución: dúo de marca (teal + rosa palo), sin semáforo verde/rojo.
const C_INCOME = '#14B8A6'  // teal — ingresos
const C_EXPENSE = '#CB6391' // rosa palo — gastos

// Suaviza un color de grupo hacia un pastel (mezcla ~45% con blanco) para el
// donut y las barras de categoría. Devuelve el original si no es #RRGGBB.
function pastel(hex: string): string {
  const h = hex?.replace('#', '')
  if (!h || h.length !== 6) return hex
  const mix = (c: number) => Math.round(c + (255 - c) * 0.45)
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

// Clave del periodo inmediatamente anterior (para la barra gris de cada categoría).
function prevPeriodKey(key: string, g: Granularity): string {
  if (g === 'year') return String(Number(key) - 1)
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return Number(q) === 1 ? `${Number(y) - 1}-Q4` : `${y}-Q${Number(q) - 1}`
  }
  const [y, m] = key.split('-')
  return Number(m) === 1 ? `${Number(y) - 1}-12` : `${y}-${String(Number(m) - 1).padStart(2, '0')}`
}

// Comparador vs periodo anterior: flecha + % | flecha + importe. El color indica
// bueno/malo (teal/rosa de marca) según la métrica — en ingresos subir es bueno,
// en gastos subir es malo. Sin signo: la flecha y el color ya dan el contexto.
function Delta({ current, previous, label, positiveIsGood }: { current: number; previous: number; label: string; positiveIsGood: boolean }) {
  if (previous <= 0) return null
  const diff = current - previous
  const pct = (diff / previous) * 100
  const flat = Math.abs(pct) < 0.5
  const Arrow = flat ? Minus : diff > 0 ? ArrowUp : ArrowDown
  const good = diff > 0 ? positiveIsGood : !positiveIsGood
  const color = flat ? '#94a3b8' : good ? C_INCOME : C_EXPENSE
  return (
    <div className="mt-2 flex flex-col">
      <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
        <span className="flex items-center gap-0.5"><Arrow className="h-3.5 w-3.5 shrink-0" />{Math.abs(pct).toFixed(0)}%</span>
        <span className="h-3.5 w-px bg-current opacity-40" />
        <span className="flex items-center gap-0.5"><Arrow className="h-3.5 w-3.5 shrink-0" />{fmtAmount(Math.abs(diff))}</span>
      </span>
      <span className="mt-0.5 text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

// Mini-área sin ejes con la tendencia de la métrica (últimos periodos). Ocupa
// todo el ancho disponible de la tarjeta vía ResponsiveContainer.
function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (data.length < 2) return null
  const gid = `spark-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.34} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {/* Base en 0 → más área por debajo de la línea y misma referencia visual. */}
        <YAxis hide domain={[0, (dataMax: number) => dataMax * 1.12]} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Sector activo del donut: el mismo sector pero un poco más grande al pasar el cursor.
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
  // Subcategoría seleccionada: filtra la gráfica de evolución a esa subcat.
  const [selectedCat, setSelectedCat] = useState<{ key: string; categoryId: string | null; name: string } | null>(null)

  const { data: totals = [], isLoading } = useDashboardTotals(activeProfile?.id)
  const { data: categories = [] } = useCategories()
  const monthNames = t('charts.months', { returnObjects: true }) as string[]
  const scrollRef = useRef<HTMLDivElement>(null)

  // Serie de periodos (ingresos vs gastos) para la gráfica, a partir de los
  // totales agregados por mes que devuelve la base de datos.
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

  const activeKey = useMemo(() => {
    if (selectedPeriod && periods.some(p => p.key === selectedPeriod)) return selectedPeriod
    return periods[periods.length - 1]?.key ?? null
  }, [selectedPeriod, periods])

  const activeBucket = periods.find(p => p.key === activeKey)
  const expenses = activeBucket?.gasto ?? 0
  const income = activeBucket?.ingreso ?? 0
  const balance = income - expenses

  // Periodo inmediatamente anterior (misma granularidad) para el comparador.
  const prevBucket = useMemo(() => {
    if (!activeKey) return undefined
    return periods.find(p => p.key === prevPeriodKey(activeKey, granularity))
  }, [activeKey, granularity, periods])
  const prevIncome = prevBucket?.ingreso ?? 0
  const prevExpenses = prevBucket?.gasto ?? 0

  // Serie corta para los sparklines de las tarjetas (últimos ~12 periodos).
  const spark = useMemo(() => periods.slice(-12), [periods])

  // Desglose por subcategoría: solo del periodo activo (consulta filtrada por
  // su rango de fechas), por lo que la carga es mínima sea cual sea el volumen.
  const activeRange = useMemo(
    () => (activeKey ? bucketRange(activeKey, granularity) : undefined),
    [activeKey, granularity],
  )
  const { data: breakdownRows = [], isLoading: breakdownLoading } =
    useDashboardBreakdown(activeProfile?.id, activeRange)

  // Mapa category_id → metadatos (slug/grupo/color) desde la taxonomía cacheada.
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
      const e = map.get(k) ?? {
        categoryId: row.category_id ?? null,
        slug: cat?.slug ?? null,
        icon: cat?.icon ?? null,
        color: grp?.color ?? '#94a3b8',
        total: 0,
      }
      e.total += row.total_abs
      total += row.total_abs
      map.set(k, e)
    }
    return { rows: [...map.values()].sort((a, b) => b.total - a.total), total }
  }, [breakdownRows, breakdownType, categoryById])

  // Segmentos del donut: agrupa en gris ("Otros") todo lo que baje del 5%.
  const donutData = useMemo(() => {
    const total = breakdown.total
    const big: { value: number; color: string; colorSolid: string; name: string; icon: string | null; pct: number }[] = []
    let otros = 0
    for (const r of breakdown.rows) {
      const pct = total > 0 ? (r.total / total) * 100 : 0
      if (pct >= 5) big.push({ value: r.total, color: pastel(r.color), colorSolid: r.color, name: r.slug ? categoryLabel(r.slug) : t('uncategorized'), icon: r.icon, pct })
      else otros += r.total
    }
    if (otros > 0) big.push({ value: otros, color: '#C2C8D0', colorSolid: '#94a3b8', name: t('donut_other'), icon: null, pct: total > 0 ? (otros / total) * 100 : 0 })
    return big
  }, [breakdown, t])

  // Posición (px) de cada icono por fuera del anillo, según el ángulo medio del
  // segmento (arranca a las 12h y avanza en horario, igual que el <Pie>).
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

  // Al seleccionar una subcategoría, la gráfica de evolución muestra solo su
  // serie (columna del tipo activo). Serie mensual de esa subcat (todo el histórico).
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
  // Color de la única columna cuando se filtra por subcategoría (según el tipo).
  const filterColor = breakdownType === 'ingreso' ? C_INCOME : breakdownType === 'gasto' ? C_EXPENSE : '#64748b'

  // Evolución: como mucho los últimos CHART_MAX_PERIODS periodos (2 años mensual).
  const chartData = periods.slice(-CHART_MAX_PERIODS).map(p => ({
    key: p.key,
    ingreso: p.ingreso,
    gasto: p.gasto,
    value: catByPeriod.get(p.key) ?? 0,
    label: bucketLabel(p.key, granularity, monthNames),
  }))
  const chartWidth = Math.max(chartData.length * BAR_PX, 320)

  // Arrancar el scroll a la derecha (periodo más reciente)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [chartWidth, granularity])

  function openSubcategory(categoryId: string | null) {
    if (!activeKey) return
    const { from, to } = bucketRange(activeKey, granularity)
    const params = new URLSearchParams({ dateFrom: from, dateTo: to, transactionType: breakdownType })
    // "Sin categoría" no tiene categoryId → filtra con uncategorized=true (si no,
    // Movimientos no aplicaría filtro de categoría y saldrían todos).
    if (categoryId) params.set('categoryId', categoryId)
    else params.set('uncategorized', 'true')
    navigate(`/transactions?${params.toString()}`)
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <h2 className="text-xl font-semibold">{t('no_profile.title')}</h2>
        <p className="text-muted-foreground">{t('no_profile.description')}</p>
      </div>
    )
  }

  const activeLabel = activeKey ? bucketLabel(activeKey, granularity, monthNames) : ''

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header + granularidad */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
        <div className="inline-flex rounded-lg border p-0.5 text-sm">
          {(['month', 'quarter', 'year'] as const).map(g => (
            <button
              key={g}
              onClick={() => { setGranularity(g); setSelectedPeriod(null) }}
              className={`px-3 py-1 rounded-md transition-colors ${granularity === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t(`granularity.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {totals.length === 0 && !isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg font-medium">{t('no_data.title')}</p>
          <p className="text-muted-foreground text-sm">{t('no_data.description')}</p>
          <Button onClick={() => navigate('/import')}>{t('no_data.action')}</Button>
        </div>
      ) : (
        <>
          {/* KPIs del periodo activo — ingresos y gastos anchos (2 col.), balance angosto (1 col.) */}
          <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-5">
            <Card className="rounded-2xl sm:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-[15px] font-bold">{t('kpis.total_income')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="shrink-0">
                    <p className="leading-none"><AmountSplit amount={income} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_INCOME} /></p>
                    <Delta current={income} previous={prevIncome} positiveIsGood label={t(`kpis.vs_prev.${granularity}`)} />
                  </div>
                  <div className="min-w-0 flex-1 max-w-[220px] self-center"><Sparkline data={spark} dataKey="ingreso" color={C_INCOME} /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl sm:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-[15px] font-bold">{t('kpis.total_expenses')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="shrink-0">
                    <p className="leading-none"><AmountSplit amount={expenses} intClass="text-3xl font-extrabold tracking-tight" decClass="text-lg font-bold text-muted-foreground" color={C_EXPENSE} /></p>
                    <Delta current={expenses} previous={prevExpenses} positiveIsGood={false} label={t(`kpis.vs_prev.${granularity}`)} />
                  </div>
                  <div className="min-w-0 flex-1 max-w-[220px] self-center"><Sparkline data={spark} dataKey="gasto" color={C_EXPENSE} /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl sm:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-[15px] font-bold">{t('kpis.balance')}</CardTitle></CardHeader>
              <CardContent><p className="leading-none"><AmountSplit amount={balance} intClass="text-2xl font-extrabold tracking-tight" decClass="text-base font-bold text-muted-foreground" color="#64748b" /></p></CardContent>
            </Card>
          </div>

          {/* Gráfica de evolución (scroll horizontal) */}
          <Card className="rounded-2xl shrink-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-[15px] font-bold">
                  {t(`evolution_by.${granularity}`)}
                  {isFiltered && <span className="font-semibold text-muted-foreground"> · {selectedCat!.name}</span>}
                </CardTitle>
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
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <div ref={scrollRef} className="no-scrollbar overflow-x-auto pb-1">
                  <BarChart
                    width={chartWidth}
                    height={210}
                    data={chartData}
                    barCategoryGap="32%"
                    onClick={(e: any) => { if (e?.activeLabel) setSelectedPeriod(String(e.activeLabel)) }}
                    margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                  >
                    <XAxis dataKey="key" tickFormatter={(k) => bucketLabel(k, granularity, monthNames)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} dy={4} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                      formatter={(v: number, name) => [formatCurrency(v), name === 'ingreso' ? tcommon('transaction_type.ingreso') : name === 'gasto' ? tcommon('transaction_type.gasto') : (selectedCat?.name ?? '')]}
                      labelFormatter={(k) => bucketLabel(String(k), granularity, monthNames)}
                    />
                    {isFiltered ? (
                      <Bar dataKey="value" fill={filterColor} barSize={18} radius={[6, 6, 0, 0]} cursor="pointer">
                        {chartData.map(d => <Cell key={d.key} fillOpacity={d.key === activeKey ? 1 : 0.38} />)}
                      </Bar>
                    ) : (
                      <>
                        <Bar dataKey="ingreso" fill={C_INCOME} barSize={16} radius={[6, 6, 0, 0]} cursor="pointer">
                          {chartData.map(d => <Cell key={d.key} fillOpacity={d.key === activeKey ? 1 : 0.38} />)}
                        </Bar>
                        <Bar dataKey="gasto" fill={C_EXPENSE} barSize={16} radius={[6, 6, 0, 0]} cursor="pointer">
                          {chartData.map(d => <Cell key={d.key} fillOpacity={d.key === activeKey ? 1 : 0.38} />)}
                        </Bar>
                      </>
                    )}
                  </BarChart>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desglose por subcategoría — ocupa el resto de la pantalla; solo la lista scrollea */}
          <Card className="flex min-h-0 flex-1 flex-col rounded-2xl">
            <CardHeader className="shrink-0 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-[15px] font-bold">{t('sections.by_subcategory')}</CardTitle>
                <div className="inline-flex rounded-lg border p-0.5 text-sm">
                  {(['gasto', 'ingreso', 'no_computable'] as const).map(ty => (
                    <button
                      key={ty}
                      onClick={() => { setBreakdownType(ty); setSelectedCat(null) }}
                      className={`px-3 py-1 rounded-md transition-colors ${breakdownType === ty ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {tcommon(`transaction_type.${ty}`)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <div className="flex h-full min-h-0 flex-col gap-6 lg:flex-row">
                {/* Lista de categorías (ocupa el ancho restante; scrollea dentro) */}
                <div className="flex min-h-0 flex-col lg:min-w-0 lg:flex-1">
                  <div className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                  {breakdownLoading ? [0,1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)
                    : breakdown.rows.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">{t('no_data.title')}</p>
                    ) : breakdown.rows.map(r => {
                      const Icon = categoryIcon(r.icon)
                      const pct = breakdown.total > 0 ? (r.total / breakdown.total) * 100 : 0
                      const key = r.categoryId ?? '__uncat__'
                      const soft = pastel(r.color)
                      const name = r.slug ? categoryLabel(r.slug) : t('uncategorized')
                      const isSel = selectedCat?.key === key
                      const toggle = () => setSelectedCat(isSel ? null : { key, categoryId: r.categoryId, name })
                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          onClick={toggle}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${isSel ? 'bg-slate-200/80' : 'hover:bg-slate-200/70'}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${soft}38`, color: r.color }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm font-medium">{name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3">
                              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: soft }} />
                              </div>
                              <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{fmtAmount(r.total)}</span>
                            </div>
                          </div>
                          {/* Slot reservado del ojo: todas las filas terminan un poco antes,
                              así al seleccionar aparece el ojo sin desplazar importe ni % */}
                          <div className="flex w-7 shrink-0 items-center justify-center self-center">
                            {isSel && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openSubcategory(r.categoryId) }}
                                title={t('view_transactions')}
                                aria-label={t('view_transactions')}
                                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-300/70 hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  }
                  </div>
                </div>

                {/* Donut — iconos por fuera; leyenda flotante que sigue al cursor */}
                {!breakdownLoading && breakdown.rows.length > 0 && (
                  <div className="flex shrink-0 justify-center lg:self-center lg:w-[300px]">
                    <div
                      className="relative"
                      style={{ width: DONUT, height: DONUT }}
                      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setDonutXY({ x: e.clientX - r.left, y: e.clientY - r.top }) }}
                      onMouseLeave={() => { setDonutActive(null); setDonutXY(null) }}
                    >
                      <PieChart width={DONUT} height={DONUT}>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          cx={DCX}
                          cy={DCY}
                          innerRadius={D_INNER}
                          outerRadius={D_OUTER}
                          paddingAngle={1.5}
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                          activeIndex={donutActive ?? undefined}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_: any, i: number) => setDonutActive(i)}
                          onMouseLeave={() => setDonutActive(null)}
                        >
                          {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                      {/* Iconos de subcategoría por fuera del anillo */}
                      {donutIcons.map((ic, i) => {
                        const Icon = categoryIcon(ic.icon)
                        return (
                          <span
                            key={i}
                            className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-sm"
                            style={{ left: ic.left, top: ic.top, color: ic.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        )
                      })}
                      {/* Leyenda central — anclada al centro exacto del hueco */}
                      <div className="pointer-events-none absolute flex flex-col items-center" style={{ left: DCX, top: DCY, transform: 'translate(-50%, -50%)' }}>
                        <span className="text-[11px] capitalize text-muted-foreground">{activeLabel}</span>
                        <span className="text-base font-bold">{fmtAmount(breakdown.total)}</span>
                      </div>
                      {/* Leyenda flotante: sigue al cursor pero a su IZQUIERDA (el donut está a la derecha) */}
                      {donutActive != null && donutXY && donutData[donutActive] && (
                        <div
                          className="pointer-events-none absolute z-50 whitespace-nowrap rounded-xl border bg-card px-3 py-1.5 text-xs shadow-lg"
                          style={{ left: donutXY.x - 14, top: donutXY.y + 14, transform: 'translateX(-100%)' }}
                        >
                          <span className="font-semibold">{donutData[donutActive].name}</span>
                          <span className="text-muted-foreground"> · {fmtAmount(donutData[donutActive].value)} · {donutData[donutActive].pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

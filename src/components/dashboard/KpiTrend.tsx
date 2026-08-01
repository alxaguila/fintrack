// Pastilla de variación + mini-gráfico de tendencia, compartidos entre las
// tarjetas KPI del Dashboard (Análisis) y de Flujo de Caja — misma pinta en
// ambas pantallas.
import { useState } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { fmtAmount } from '@/components/ui/amount-split'

// Paleta compartida de las tarjetas KPI (Análisis y Flujo de Caja). Ingreso =
// navy azul (más azul que negro); gasto rosa palo; balance neutro; navy
// oscuro del sidebar para la tarjeta de tasa. Sin semáforo.
export const C_INCOME = '#1F4E8C'
export const C_EXPENSE = '#CB6391'
export const C_NEUTRAL = '#64748b'
export const C_TASA = '#0A2540'

export function trendColor(diff: number, positiveIsGood: boolean): string {
  if (Math.abs(diff) < 1e-9) return '#475569'
  const good = diff > 0 ? positiveIsGood : !positiveIsGood
  return good ? '#0F766E' : '#A03A66'
}

// Pastilla compacta de variación vs periodo anterior: flecha + % + importe absoluto.
export function DeltaPill({ current, previous, positiveIsGood }: { current: number; previous: number; positiveIsGood: boolean }) {
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
// negativos. Resalta el periodo activo (o el último si no hay selección).
export function BarSpark({ data, color, inactiveOp = 0.3, activeIndex }: { data: { label: string; value: number }[]; color: string; inactiveOp?: number; activeIndex?: number }) {
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

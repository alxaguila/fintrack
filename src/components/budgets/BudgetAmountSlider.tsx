import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface BudgetAmountSliderProps {
  /** Gasto real del mes activo, para pintar el relleno de progreso. */
  spent: number
  /** Importe presupuestado actual (0 si aún no tiene). */
  amount: number
  /** Se llama al soltar el marcador, con el nuevo importe redondeado. */
  onCommit: (amount: number) => void
  /** Se llama en cada movimiento mientras se arrastra, para reflejar el valor en vivo (ej. el semáforo de 12 meses). */
  onDrag?: (amount: number) => void
  color?: string
  className?: string
}

const STEP = 5

/** Techo de la escala visual: siempre por encima de lo gastado/presupuestado,
 *  redondeado a un múltiplo de 50 para que la barra no "salte" al arrastrar. */
function niceScale(spent: number, amount: number): number {
  const top = Math.max(spent, amount, 20)
  return Math.ceil((top * 1.25) / 50) * 50
}

/**
 * Barra de progreso con un marcador arrastrable (pointer events nativos, sin
 * dependencia de Radix Slider) para fijar el importe presupuestado de una
 * subcategoría. El relleno de color muestra el gasto real; el marcador, el
 * límite presupuestado.
 */
export function BudgetAmountSlider({ spent, amount, onCommit, onDrag, color = '#CB6391', className }: BudgetAmountSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragAmount, setDragAmount] = useState<number | null>(null)
  const displayAmount = dragAmount ?? amount
  const scale = niceScale(spent, displayAmount)

  const amountFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current
    if (!el) return displayAmount
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return Math.round((ratio * scale) / STEP) * STEP
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const next = amountFromClientX(e.clientX)
    setDragAmount(next)
    onDrag?.(next)
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragAmount === null) return
    const next = amountFromClientX(e.clientX)
    setDragAmount(next)
    onDrag?.(next)
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragAmount === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    onCommit(dragAmount)
    setDragAmount(null)
  }

  const spentPct = Math.min(100, (spent / scale) * 100)
  const markerPct = Math.min(100, (displayAmount / scale) * 100)

  return (
    <div
      ref={trackRef}
      className={cn('relative h-3 w-full cursor-pointer rounded-full bg-slate-200 select-none', className)}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${spentPct}%`, backgroundColor: color }} />
      <div
        className="absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 shadow"
        style={{ left: `${markerPct}%` }}
      />
    </div>
  )
}

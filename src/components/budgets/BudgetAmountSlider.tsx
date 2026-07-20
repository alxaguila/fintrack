import { useCallback, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetAmountSliderProps {
  /** Gasto real del mes activo, para pintar el relleno de progreso. */
  spent: number
  /** Importe presupuestado actual (0 si aún no tiene). */
  amount: number
  /** Se llama al soltar el marcador, con el nuevo importe redondeado. Requerido salvo en modo `disabled`. */
  onCommit?: (amount: number) => void
  /** Se llama en cada movimiento mientras se arrastra, para reflejar el valor en vivo (ej. el semáforo de 12 meses). */
  onDrag?: (amount: number) => void
  color?: string
  className?: string
  /** Vista de solo lectura: mismo aspecto (barra + marcador + flechas) pero sin
   *  lógica de arrastre, para usarlo como "avance visual" dentro de una fila que
   *  ya abre el detalle real al hacer click (p. ej. la fila de categoría). */
  disabled?: boolean
  /** Flechas junto al marcador, para insinuar que se puede arrastrar a izq./der. */
  showArrows?: boolean
}

/** Techo de la escala visual: siempre por encima de lo gastado/presupuestado,
 *  redondeado a un múltiplo de 50 para que no haya decimales raros. Se congela
 *  al empezar cada arrastre (ver `scaleRef`) para que la barra no se
 *  "reescale" a medio gesto — eso es lo que causaba el movimiento a trompicones. */
function niceScale(spent: number, amount: number): number {
  const top = Math.max(spent, amount, 20)
  return Math.ceil((top * 1.25) / 50) * 50
}

/** Paso de redondeo proporcional a la escala: barras pequeñas usan pasos finos
 *  (1€) y barras grandes pasos más gruesos (hasta 5€), para que el marcador
 *  siempre se sienta fluido sin importar el rango de importes. */
function stepFor(scale: number): number {
  return Math.max(1, Math.round(scale / 100))
}

/**
 * Barra de progreso con un marcador arrastrable (pointer events nativos, sin
 * dependencia de Radix Slider) para fijar el importe presupuestado de una
 * subcategoría. El relleno de color muestra el gasto real; el marcador (con
 * flechas a los lados) el límite presupuestado.
 */
export function BudgetAmountSlider({
  spent, amount, onCommit, onDrag, color = '#CB6391', className, disabled = false, showArrows = true,
}: BudgetAmountSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragAmount, setDragAmount] = useState<number | null>(null)
  const scaleRef = useRef(niceScale(spent, amount))
  const displayAmount = dragAmount ?? amount
  // Mientras se arrastra, la escala queda fija (congelada al pulsar) — solo se
  // recalcula entre gestos, con el importe ya confirmado.
  const scale = dragAmount === null ? niceScale(spent, amount) : scaleRef.current

  const amountFromClientX = useCallback((clientX: number, activeScale: number) => {
    const el = trackRef.current
    if (!el) return displayAmount
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const step = stepFor(activeScale)
    return Math.round((ratio * activeScale) / step) * step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    scaleRef.current = niceScale(spent, amount)
    const next = amountFromClientX(e.clientX, scaleRef.current)
    setDragAmount(next)
    onDrag?.(next)
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragAmount === null) return
    const next = amountFromClientX(e.clientX, scaleRef.current)
    setDragAmount(next)
    onDrag?.(next)
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragAmount === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    onCommit?.(dragAmount)
    setDragAmount(null)
  }

  const spentPct = Math.min(100, (spent / scale) * 100)
  const markerPct = Math.min(100, Math.max(0, (displayAmount / scale) * 100))

  return (
    <div
      ref={trackRef}
      className={cn('relative h-3 w-full cursor-pointer select-none rounded-full bg-slate-200', className)}
      style={disabled ? undefined : { touchAction: 'none' }}
      {...(disabled ? {} : {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
      })}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${spentPct}%`, backgroundColor: color }} />
      <div className="absolute top-1/2 flex items-center gap-1" style={{ left: `${markerPct}%`, transform: 'translate(-50%, -50%)' }}>
        {showArrows && <ChevronLeft className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2.5} />}
        <div className="h-5 w-[3px] shrink-0 rounded-full bg-slate-900 shadow" />
        {showArrows && <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2.5} />}
      </div>
    </div>
  )
}

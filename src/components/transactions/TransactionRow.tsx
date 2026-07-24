import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwipeable } from 'react-swipeable'
import { Check, CheckCheck, Tag, X } from 'lucide-react'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { resolveEntityAvatar } from '@/lib/entityAvatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Account, Category, CategoryGroup, Merchant, Transaction } from '@/lib/database.types'

// Plantilla de columnas compartida entre la cabecera (TransactionsList) y cada
// fila, para que ambas se alineen exactamente en cada breakpoint. Orden:
// [dot+icono] [concepto 1fr] [fecha*] [entidad*] [categoría**] [tipo***] [importe] [leído*]
// *sm+ (en móvil el día vive en el separador de grupo y el leído/no leído se
// hace con swipe, así que ninguno de los dos ocupa columna)  **md+  ***lg+
export const TX_ROW_GRID_COLS =
  'grid-cols-[52px_1fr_92px] ' +
  'sm:grid-cols-[52px_1fr_92px_132px_108px_112px] ' +
  'md:grid-cols-[52px_1fr_92px_132px_168px_108px_112px] ' +
  'lg:grid-cols-[52px_1fr_92px_132px_168px_112px_108px_112px]'

// Distancia de swipe: un cuarto del ancho real de la fila (medido al iniciar
// cada gesto), tanto para el tope visual del arrastre como para el umbral de
// disparo — así el panel de acción queda completamente revelado justo cuando
// se alcanza el punto en el que la acción se dispara.
const SWIPE_MAX_FALLBACK = 90

// Divide un importe ya formateado (formatCurrency, siempre es-ES → coma decimal)
// en parte entera + parte decimal, para el tratamiento tipográfico de dos tonos
// del mock (entero destacado, decimales atenuados). No reimplementa el formato:
// solo corta la cadena ya correcta por la última coma.
function splitAmount(formatted: string): { int: string; dec: string } {
  const i = formatted.lastIndexOf(',')
  if (i === -1) return { int: formatted, dec: '' }
  return { int: formatted.slice(0, i), dec: formatted.slice(i) }
}

// Badge de tipo: "Gasto" usa el token expense (ya existente, evita semáforo puro
// rojo); "Ingreso" income; "No computable" neutro. Sin inventar hex nuevos.
const TYPE_BADGE: Record<string, string> = {
  ingreso: 'border-income/40 text-income',
  gasto: 'border-expense/40 text-expense',
  no_computable: 'border-border text-muted-foreground',
}

interface TransactionRowProps {
  tx: Transaction
  category: Category | undefined
  group: CategoryGroup | undefined
  account: Account | undefined
  merchant: Merchant | undefined
  entityLogoByName: Map<string, string | null>
  onClick: () => void
  onToggleReviewed: (e?: React.MouseEvent) => void
  // Móvil: reproduce una vez la animación de ejemplo del swipe al montar.
  showHint?: boolean
}

export function TransactionRow({ tx, category, group, account, merchant, entityLogoByName, onClick, onToggleReviewed, showHint }: TransactionRowProps) {
  const { t } = useTranslation('transactions')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const [logoError, setLogoError] = useState(false)
  const [merchantLogoError, setMerchantLogoError] = useState(false)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const hintPlayedRef = useRef(false)
  const rowRef = useRef<HTMLDivElement | null>(null)
  const swipeMaxRef = useRef(SWIPE_MAX_FALLBACK)

  const CatIcon = categoryIcon(category?.icon)
  const catColor = group?.color ?? '#94a3b8'
  const avatar = resolveEntityAvatar(account, entityLogoByName)
  const showMerchantLogo = !!merchant?.logo_url && !merchantLogoError
  const amountColor = tx.transaction_type === 'ingreso' ? 'text-income' : 'text-foreground'
  const { int, dec } = splitAmount(formatCurrency(tx.amount))

  // Swipe (solo móvil): izquierda = marcar leído/no leído, derecha = reclasificar
  // (mismo diálogo que ya abre el tap normal — el tap se mantiene igual).
  const { ref: swipeRef, ...swipeHandlers } = useSwipeable({
    onSwiping: e => {
      if (!isMobile) return
      if (e.first) swipeMaxRef.current = (rowRef.current?.getBoundingClientRect().width ?? SWIPE_MAX_FALLBACK * 4) / 4
      setDragging(true)
      const max = swipeMaxRef.current
      setDx(Math.max(-max, Math.min(max, e.deltaX)))
    },
    onSwiped: e => {
      if (!isMobile) return
      setDragging(false)
      const max = swipeMaxRef.current
      if (e.deltaX <= -max) onToggleReviewed()
      else if (e.deltaX >= max) onClick()
      setDx(0)
    },
    trackMouse: false,
  })

  // Animación de ejemplo del swipe: anima el mismo estado `dx` que un swipe real
  // (mismo transform + misma opacidad de panel), con un recorrido continuo y
  // suavizado (requestAnimationFrame) en vez de saltos discretos, y revela el
  // panel al completo (mismo `max` que el swipe real, sin topes artificiales).
  // Una sola vez por montaje.
  useEffect(() => {
    if (!showHint || !isMobile || hintPlayedRef.current) return
    hintPlayedRef.current = true
    const max = (rowRef.current?.getBoundingClientRect().width ?? SWIPE_MAX_FALLBACK * 4) / 4
    const keyframes = [0, -max, 0, max, 0]
    const legMs = 500
    const startDelay = 400
    let rafId = 0
    let startTs: number | null = null
    setDragging(true)
    const step = (ts: number) => {
      if (startTs === null) startTs = ts
      const elapsed = ts - startTs - startDelay
      if (elapsed < 0) { rafId = requestAnimationFrame(step); return }
      const totalMs = legMs * (keyframes.length - 1)
      if (elapsed >= totalMs) { setDx(0); setDragging(false); return }
      const legIndex = Math.min(Math.floor(elapsed / legMs), keyframes.length - 2)
      const t = (elapsed - legIndex * legMs) / legMs
      const eased = -(Math.cos(Math.PI * t) - 1) / 2 // ease-in-out-sine
      const from = keyframes[legIndex]
      const to = keyframes[legIndex + 1]
      setDx(from + (to - from) * eased)
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(rafId); setDragging(false) }
  }, [showHint, isMobile])

  return (
    <div
      {...(isMobile ? swipeHandlers : {})}
      ref={el => { rowRef.current = el; if (isMobile) swipeRef(el) }}
      className="relative -mx-4 overflow-hidden border-t first:border-t-0 sm:mx-0"
      style={isMobile ? { touchAction: 'pan-y' } : undefined}
    >
      {/* Paneles de acción del swipe (móvil): quedan detrás del contenido, se
          revelan a medida que el contenido se desliza. Cada uno ocupa un
          cuarto del ancho de la fila; el hueco central queda sin color. */}
      {isMobile && (
        <div className="absolute inset-0 flex items-stretch">
          <div
            className="flex w-1/4 flex-col items-center justify-center gap-1 px-1 text-center text-white"
            style={{ backgroundColor: 'var(--brand-accent)', opacity: dx > 4 ? 1 : 0 }}
          >
            <Tag className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-medium leading-tight">{t('row.edit_category')}</span>
          </div>
          <div className="w-1/2" />
          <div className="flex w-1/4 flex-col items-center justify-center gap-1 px-1 text-center text-white bg-income" style={{ opacity: dx < -4 ? 1 : 0 }}>
            {tx.is_reviewed ? <X className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
            <span className="text-[10px] font-medium leading-tight">{tx.is_reviewed ? t('row.mark_unread') : t('row.mark_reviewed')}</span>
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid items-center gap-2 px-4 py-3 cursor-pointer sm:gap-3 sm:bg-transparent',
          !dragging && 'transition-[transform,opacity,background-color] duration-200',
          dragging && 'opacity-90',
          TX_ROW_GRID_COLS,
          tx.is_reviewed
            ? 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            : 'bg-card hover:bg-muted/20',
        )}
        style={isMobile ? { transform: `translateX(${dx}px)` } : undefined}
        onClick={onClick}
      >
      {/* Punto de no leído + icono de categoría (un poco más a la izquierda en móvil) */}
      <div className="-ml-1 flex items-center gap-2 sm:ml-0">
        <span
          className={cn('h-[7px] w-[7px] shrink-0 rounded-full', tx.is_reviewed ? 'bg-transparent' : 'bg-[var(--brand-accent)]')}
          title={tx.is_reviewed ? undefined : t('row.pending')}
        />
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ backgroundColor: showMerchantLogo ? undefined : `${catColor}1f` }}
        >
          {showMerchantLogo ? (
            <img
              src={merchant!.logo_url!}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setMerchantLogoError(true)}
            />
          ) : (
            <CatIcon className="h-4 w-4" style={{ color: catColor }} />
          )}
        </span>
      </div>

      {/* Comercio del catálogo (con logo) + concepto tal cual del extracto + nota (si existe).
          Móvil: si hay comercio, se oculta el concepto (queda comercio + subcategoría, menos
          texto); tipografía del comercio/concepto unificada (sin negrita, sin font-mono
          uppercase) solo en esta pantalla/breakpoint — escritorio sigue igual que siempre. */}
      <div className="min-w-0 leading-tight">
        {merchant ? (
          <>
            <div className={cn('truncate text-[13px] text-foreground sm:font-semibold', !tx.is_reviewed && 'font-semibold')}>{merchant.name}</div>
            <div className="hidden truncate font-mono text-[11px] uppercase text-muted-foreground sm:block">{tx.concept}</div>
          </>
        ) : (
          <div className={cn('truncate text-[13px] sm:font-mono sm:uppercase', tx.is_reviewed ? '' : 'font-semibold text-foreground')}>
            {tx.concept}
          </div>
        )}
        {/* Subcategoría (móvil): en sm+ ya se ve en el pill de categoría de abajo */}
        <div className="truncate text-[11px] text-muted-foreground sm:hidden">
          {category ? categoryLabel(category.slug) : t('row.uncategorized')}
        </div>
        {tx.notes && (
          <div className="truncate text-[11px] font-normal normal-case text-muted-foreground">{tx.notes}</div>
        )}
      </div>

      {/* Fecha (sm+): en móvil el día ya vive en el separador de grupo */}
      <div className="hidden whitespace-nowrap text-[12.5px] text-muted-foreground sm:block">{formatDate(tx.date)}</div>

      {/* Entidad (sm+) */}
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        {avatar.logoUrl && !logoError ? (
          <img
            src={avatar.logoUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full border border-border object-contain bg-white"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: avatar.color }}
          >
            {avatar.initial}
          </span>
        )}
        <span className="truncate text-[12.5px] text-muted-foreground">{account?.entity ?? '—'}</span>
      </div>

      {/* Categoría (md+) */}
      <div className="hidden min-w-0 md:block">
        <span
          className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${catColor}1f`, color: catColor }}
        >
          <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: catColor }} />
          <span className="truncate">{category ? categoryLabel(category.slug) : t('row.uncategorized')}</span>
        </span>
      </div>

      {/* Tipo (lg+) */}
      <div className="hidden lg:block">
        {tx.transaction_type && (
          <span className={cn('inline-block rounded-lg border px-2.5 py-1 text-xs font-medium', TYPE_BADGE[tx.transaction_type])}>
            {tc(`transaction_type.${tx.transaction_type}`)}
          </span>
        )}
      </div>

      {/* Importe */}
      <div className={cn('text-right text-[15px] font-semibold tabular-nums', amountColor)}>
        {int}
        <span className="text-[11.5px] font-normal text-muted-foreground/70">{dec}</span>
      </div>

      {/* Leído / No leído (sm+ solamente: en móvil se sustituye por el swipe) */}
      <div className="hidden text-right sm:block">
        <button
          onClick={onToggleReviewed}
          title={tx.is_reviewed ? t('row.reviewed') : t('row.pending')}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
            tx.is_reviewed ? 'border-income/40 bg-income/10 text-income' : 'border-muted-foreground/30 text-muted-foreground hover:border-income/40 hover:text-income',
          )}
        >
          {tx.is_reviewed ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {tx.is_reviewed ? t('row.reviewed') : t('row.pending')}
        </button>
      </div>
      </div>
    </div>
  )
}

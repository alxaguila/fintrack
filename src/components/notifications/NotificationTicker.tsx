import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Radio } from 'lucide-react'
import {
  useNotifications,
  useMarkNotificationsAnnounced,
  pendingAnnouncements,
} from '@/hooks/useNotifications'
import { useProfiles } from '@/hooks/useProfiles'
import { notificationListItemText } from '@/lib/notifications'
import type { Notification } from '@/lib/database.types'

const ANNOUNCE_DELAY_MS = 5000
const MAX_BATCH = 6
const SEPARATOR = '   •   '
// Velocidad de scroll en px/s — un ticker de última hora se lee "al vuelo",
// no a paso de tortuga. A este ritmo una línea corta cruza la caja en 1-2s.
const SCROLL_SPEED_PX_PER_SEC = 160
const MIN_LOOP_SECONDS = 4

/**
 * Banner tipo "ticker de última hora" junto a la campana: anuncia cada
 * notificación como máximo una vez en su vida (announced_at), con un retraso
 * de 5s antes de empezar a animarse. Si llegan varias a la vez, se muestran
 * todas concatenadas en una sola tira; las que lleguen mientras ya hay un
 * ciclo en marcha se encolan para el siguiente ciclo (no interrumpen el actual).
 */
export function NotificationTicker() {
  const { t } = useTranslation('notifications')
  const { t: tc } = useTranslation('common')
  const { data: notifications = [] } = useNotifications()
  const { data: profiles = [] } = useProfiles()
  const hasMultipleProfiles = profiles.length > 1
  const markAnnounced = useMarkNotificationsAnnounced()

  const [phase, setPhase] = useState<'idle' | 'waiting' | 'visible'>('idle')
  const [batch, setBatch] = useState<Notification[] | null>(null)
  const [tick, setTick] = useState(0)
  const [loopSeconds, setLoopSeconds] = useState(MIN_LOOP_SECONDS)
  const queueRef = useRef<Notification[]>([])
  const handledRef = useRef<Set<string>>(new Set())
  const textRef = useRef<HTMLSpanElement>(null)
  // Guarda el temporizador de los 5s FUERA del ciclo de efectos: si el
  // cleanup de este efecto se disparara en cada cambio de `phase` (que el
  // propio efecto provoca al llamar setPhase('waiting')), cancelaría el
  // timer casi al instante, antes de que pudiera llegar a disparar — por
  // eso el guard de abajo usa el ref en vez de depender de la limpieza del
  // efecto para evitar arranques duplicados.
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Ingesta: cualquier notificación pendiente de anunciar y no vista aún
  // entra a la cola FIFO (ordenada por fecha de creación).
  useEffect(() => {
    const fresh = pendingAnnouncements(notifications).filter(n => !handledRef.current.has(n.id))
    if (fresh.length === 0) return
    fresh.forEach(n => handledRef.current.add(n.id))
    queueRef.current = [...queueRef.current, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at))
    setTick(v => v + 1)
  }, [notifications])

  // 2. Arrancador: si está libre y hay cola, congela un lote y espera 5s.
  useEffect(() => {
    if (phase !== 'idle' || queueRef.current.length === 0 || startTimerRef.current) return
    const next = queueRef.current.splice(0, MAX_BATCH)
    setPhase('waiting')
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null
      setBatch(next)
      setPhase('visible')
      markAnnounced.mutate(next.map(n => n.id))
    }, ANNOUNCE_DELAY_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tick])

  // Solo se limpia el temporizador al desmontar el componente de verdad.
  useEffect(() => () => { if (startTimerRef.current) clearTimeout(startTimerRef.current) }, [])

  const text = batch ? batch.map(n => notificationListItemText(n, hasMultipleProfiles, t, tc)).filter(Boolean).join(SEPARATOR) : ''

  // 3. Mide el ancho real de una copia del texto para fijar una velocidad de
  // scroll CONSTANTE (px/s) sea cual sea la longitud del lote — si no, con
  // una duración fija un texto largo se arrastra y uno corto apenas se mueve.
  useLayoutEffect(() => {
    if (phase !== 'visible' || !textRef.current) return
    const width = textRef.current.getBoundingClientRect().width
    setLoopSeconds(Math.max(MIN_LOOP_SECONDS, width / SCROLL_SPEED_PX_PER_SEC))
  }, [phase, text])

  // 4. Cierre: dura un poco más de una vuelta completa a esa velocidad (para
  // poder leerlo entero al menos una vez) y vuelve a idle — si queda cola,
  // el efecto 2 arranca el siguiente ciclo solo.
  useEffect(() => {
    if (phase !== 'visible' || !batch) return
    const timer = setTimeout(() => {
      setPhase('idle')
      setBatch(null)
    }, loopSeconds * 1000 + 600)
    return () => clearTimeout(timer)
  }, [phase, batch, loopSeconds])

  if (phase !== 'visible' || !batch || batch.length === 0 || !text) return null

  return (
    <>
      <div
        className="fixed z-30 flex h-10 select-none items-center gap-2 overflow-hidden rounded-full border border-white/10 px-3 text-white shadow-lg"
        style={{
          left: '66.6667vw',
          right: '64px',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          backgroundColor: 'var(--brand-ink)',
        }}
        aria-hidden="true"
      >
        <Radio className="h-4 w-4 shrink-0 text-[var(--brand-primary-3)]" strokeWidth={1.8} />
        <div
          className="relative h-full min-w-0 flex-1 overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)',
            maskImage: 'linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)',
          }}
        >
          <div
            className="animate-ticker-scroll flex h-full w-max items-center whitespace-nowrap text-sm"
            style={{ animationDuration: `${loopSeconds}s` }}
          >
            <span ref={textRef} className="pr-10">{text}</span>
            <span className="pr-10">{text}</span>
          </div>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {t('ticker.aria_summary', { count: batch.length })}
      </span>
    </>
  )
}

// Animación de ejemplo del swipe en Movimientos (móvil): cada cuánto se repite,
// guardado por fecha del último visto en localStorage. Una vez por semana: si
// hace más de 7 días desde la última vez que este navegador la vio, se repite.
const SWIPE_HINT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
const SWIPE_HINT_KEY = 'zafyros_tx_swipe_hint_last_shown'

export function shouldShowSwipeHint(): boolean {
  if (typeof window === 'undefined') return false
  if (SWIPE_HINT_INTERVAL_MS === 0) return true
  const last = Number(localStorage.getItem(SWIPE_HINT_KEY) ?? '0')
  return Date.now() - last > SWIPE_HINT_INTERVAL_MS
}

export function markSwipeHintShown(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SWIPE_HINT_KEY, String(Date.now()))
}

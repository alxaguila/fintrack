import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { getAppUrl } from './appUrl'

// La sesión vive en localStorage, que no se comparte entre zafyros.com (login/
// registro/reset) y app.zafyros.com. Sin esto, tras loguear con email+contraseña
// la app no encontraba sesión en su propio origen y rebotaba en bucle a la landing
// ("parpadeo"). Google OAuth no sufre esto porque su callback ya aterriza con los
// tokens en la URL de app.zafyros.com; aquí replicamos ese mismo mecanismo a mano.
const HANDOFF_KEY = 'zf_session'

export function redirectToAppWithSession(session: Session) {
  const payload = encodeURIComponent(JSON.stringify({
    at: session.access_token,
    rt: session.refresh_token,
  }))
  // Sin esto, zafyros.com se queda con su propia copia de la sesión en localStorage
  // (login de Google/email la crean aquí antes del hand-off). Al cerrar sesión en
  // app.zafyros.com esa copia sobrevivía sin invalidar, y este mismo mecanismo la
  // volvía a mandar para allá -> bucle infinito de redirects entre dominios tras
  // logout.
  // OJO: NO usar supabase.auth.signOut() para limpiarla (aunque sea con
  // scope:'local') -> el código fuente de supabase-js muestra que revoca el refresh
  // token en el SERVIDOR igualmente (ese scope solo decide si afecta a otras
  // sesiones, no si hace la llamada de red), lo que invalida los tokens que estamos
  // a punto de mandar en este mismo hand-off -> el login dejaba de funcionar del
  // todo. Se borra solo la entrada de localStorage directamente (sin red), lo que de
  // paso evita también el deadlock de supabase-js por llamar a otro método de auth
  // desde dentro del callback de onAuthStateChange.
  const storageKey = (supabase.auth as unknown as { storageKey?: string }).storageKey
  if (storageKey) localStorage.removeItem(storageKey)
  window.location.assign(`${getAppUrl()}#${HANDOFF_KEY}=${payload}`)
}

export async function consumeSessionHandoff(): Promise<boolean> {
  const hash = window.location.hash
  const prefix = `#${HANDOFF_KEY}=`
  if (!hash.startsWith(prefix)) return false
  const raw = hash.slice(prefix.length)
  history.replaceState(null, '', window.location.pathname + window.location.search)
  try {
    const { at, rt } = JSON.parse(decodeURIComponent(raw))
    const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
    return !error
  } catch {
    return false
  }
}

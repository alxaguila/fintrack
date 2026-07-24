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

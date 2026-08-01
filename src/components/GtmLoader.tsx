import { useEffect } from 'react'
import { useIsPublicContext } from '@/lib/publicContext'
import { getCookieConsent } from '@/lib/cookieConsent'
import { loadGtm } from '@/lib/gtm'

/** Carga GTM en visitas recurrentes que ya dieron su consentimiento. La
 * primera visita (sin decisión guardada) la gestiona CookieBanner al aceptar. */
export function GtmLoader() {
  const isPublic = useIsPublicContext()

  useEffect(() => {
    if (!isPublic) return
    if (getCookieConsent() === 'accepted') loadGtm()
  }, [isPublic])

  return null
}

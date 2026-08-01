// Decisión del Usuario sobre el banner de cookies de la landing pública.
const COOKIE_CONSENT_KEY = 'zafyros_cookie_consent'

export type CookieConsent = 'accepted' | 'rejected'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'accepted' || value === 'rejected' ? value : null
}

export function setCookieConsent(value: CookieConsent): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COOKIE_CONSENT_KEY, value)
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/components/landing/brand'

/** Logo "G" oficial de Google (4 colores). */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/** Separador "o / or" entre el formulario de email y el login social. */
export function OrDivider() {
  const { t } = useTranslation('auth')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, height: 1, background: '#E5EAEE' }} />
      <span style={{ font: `400 12px ${BRAND.sans}`, color: '#8A98A5', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {t('oauth.divider')}
      </span>
      <span style={{ flex: 1, height: 1, background: '#E5EAEE' }} />
    </div>
  )
}

/**
 * Botón "Continuar con Google" (OAuth de Supabase).
 *
 * Provoca un redirect de página completa a Google y vuelta a `/app`; al volver,
 * supabase-js crea la sesión sola y `AppShell` decide (incluido el onboarding).
 * Requiere tener el proveedor Google activado en Supabase.
 */
export function GoogleButton({ onError }: { onError?: (message: string) => void }) {
  const { t } = useTranslation('auth')
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    })
    // En caso de éxito el navegador ya está navegando a Google; solo importa el error.
    if (error) {
      setBusy(false)
      onError?.(error.message)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        background: '#fff',
        color: BRAND.ink,
        font: `600 15px ${BRAND.sans}`,
        padding: '12px 0',
        borderRadius: 11,
        border: '1px solid #D9E0E6',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <GoogleIcon />
      {t('oauth.google')}
    </button>
  )
}

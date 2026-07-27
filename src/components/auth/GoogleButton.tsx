import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/components/landing/brand'
import { createIdTokenNonce } from '@/lib/oauthNonce'
import { getAppUrl } from '@/lib/appUrl'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            nonce?: string
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (momentListener?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
            isDismissedMoment: () => boolean
          }) => void) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GIS_SRC = 'https://accounts.google.com/gsi/client'

let gisLoadPromise: Promise<void> | null = null
function loadGoogleIdentityServices(): Promise<void> {
  if (!gisLoadPromise) {
    gisLoadPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = GIS_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('gis_load_error'))
      document.head.appendChild(script)
    })
  }
  return gisLoadPromise
}

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
 * Botón "Continuar con Google" (Google Identity Services + `signInWithIdToken`,
 * con fallback al `signInWithOAuth` clásico).
 *
 * El intercambio con Google intenta ocurrir en el cliente (sin pasar por el dominio
 * de Supabase): se pide un ID token a Google y se canjea por sesión de Supabase. Pero
 * ese camino depende de FedCM (Chrome), que algunos usuarios tienen desactivado
 * (ajuste de privacidad, extensiones, navegadores sin soporte) — cuando el prompt no
 * se puede mostrar, se cae automáticamente al redirect de `signInWithOAuth` de toda
 * la vida, para que nadie se quede sin poder loguearse con Google (a costa de volver
 * a ver el dominio de Supabase solo en ese caso). La sesión resultante, por cualquiera
 * de los dos caminos, la recoge el `onAuthStateChange` ya existente en Landing.tsx /
 * Register.tsx, que hace el hand-off a app.zafyros.com (ver `sessionHandoff.ts`).
 * Requiere `VITE_GOOGLE_CLIENT_ID` en el entorno y ese mismo Client ID dado de alta
 * en Supabase → Authentication → Providers → Google → Authorized Client IDs.
 */
export function GoogleButton({ onError }: { onError?: (message: string) => void }) {
  const { t } = useTranslation('auth')
  const [busy, setBusy] = useState(false)

  async function redirectFallback() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAppUrl() },
    })
    // Éxito: el navegador ya está navegando a Google; solo importa el error.
    if (error) {
      setBusy(false)
      onError?.(error.message)
    }
  }

  async function handleClick() {
    setBusy(true)
    if (!GOOGLE_CLIENT_ID) {
      await redirectFallback()
      return
    }
    try {
      await loadGoogleIdentityServices()
      const { nonce, hashedNonce } = await createIdTokenNonce()

      window.google!.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        use_fedcm_for_prompt: true,
        nonce: hashedNonce,
        callback: async (response) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          })
          setBusy(false)
          if (error) onError?.(error.message)
          // Éxito: el onAuthStateChange de la pantalla que monta este botón se encarga del resto.
        },
      })

      window.google!.accounts.id.prompt(async (notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          await redirectFallback()
        } else if (notification.isDismissedMoment()) {
          setBusy(false)
        }
      })
    } catch {
      await redirectFallback()
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

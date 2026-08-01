import { useLocation } from 'react-router-dom'

/**
 * true solo en la landing pública (zafyros.com), nunca dentro de la app
 * autenticada. `isAppHost` cubre producción (app.zafyros.com ni siquiera
 * monta las rutas públicas); el check de pathname cubre local/preview, donde
 * landing y app cuelgan del mismo host y la app vive bajo "/app" (ver App.tsx).
 */
export function useIsPublicContext(): boolean {
  const location = useLocation()
  const isAppHost = window.location.hostname === 'app.zafyros.com'
  const isAppRoute = location.pathname.startsWith('/app')
  return !isAppHost && !isAppRoute
}

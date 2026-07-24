// Única fuente de verdad de "adónde vive la app": app.zafyros.com en producción,
// {origin}/app en local/previews (donde ese subdominio no existe).
// Siempre absoluta: la usa signInWithOAuth({ redirectTo }), que no acepta rutas relativas.
export function getAppUrl(path = '/'): string {
  const { hostname, origin } = window.location
  if (hostname === 'zafyros.com' || hostname === 'www.zafyros.com') {
    return `https://app.zafyros.com${path}`
  }
  return `${origin}/app${path === '/' ? '' : path}`
}

// Prefijo de las rutas internas de la app autenticada: vacío en app.zafyros.com
// (montada en "/"), "/app" en local/preview (montada bajo "/app").
export const APP_BASE = window.location.hostname === 'app.zafyros.com' ? '' : '/app'

// Construye una ruta interna de la app (Sidebar, MobileNav, navigate() internos...)
// respetando ese prefijo. appPath() sin argumento -> home ("/" o "/app").
export function appPath(sub = ''): string {
  return sub ? `${APP_BASE}${sub}` : (APP_BASE || '/')
}

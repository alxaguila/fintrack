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

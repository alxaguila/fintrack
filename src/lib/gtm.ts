export const GTM_ID = import.meta.env.VITE_GTM_ID

/** Inyecta el script de Google Tag Manager + su fallback <noscript>. Idempotente. */
export function loadGtm(): void {
  if (!GTM_ID) return
  if (document.getElementById('gtm-script')) return

  ;(window as any).dataLayer = (window as any).dataLayer || []
  ;(window as any).dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  noscript.id = 'gtm-noscript'
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.insertBefore(noscript, document.body.firstChild)
}

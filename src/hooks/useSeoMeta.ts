import { useEffect } from 'react'

const CANONICAL_ORIGIN = 'https://www.zafyros.com'

type SeoMetaOptions = {
  title: string
  description?: string
  /** Ruta canónica (p. ej. "/blog/mi-post"). Por defecto, la ruta actual. */
  path?: string
  /** JSON-LD a inyectar en un <script type="application/ld+json"> propio de la página. */
  jsonLd?: object
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Fija título, meta description, canonical y Open Graph de la página pública
 * actual, y opcionalmente inyecta un bloque JSON-LD propio (se retira al
 * desmontar). Sustituye al patrón anterior de `document.title = ...` suelto en
 * cada página, que quedaba sobreescrito por el título genérico de App.tsx al
 * cargar la URL directamente (lo que hace Googlebot en cada rastreo).
 */
export function useSeoMeta({ title, description, path, jsonLd }: SeoMetaOptions) {
  useEffect(() => {
    document.title = title

    const canonicalHref = `${CANONICAL_ORIGIN}${path ?? window.location.pathname}`
    upsertLink('canonical', canonicalHref)

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'zafyros')
    upsertMeta('property', 'og:url', canonicalHref)
    upsertMeta('property', 'og:image', `${CANONICAL_ORIGIN}/logo-512.png`)
    upsertMeta('name', 'twitter:card', 'summary')

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
    }
  }, [title, description, path])

  useEffect(() => {
    if (!jsonLd) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [jsonLd])
}

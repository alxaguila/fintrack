import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { BRAND } from './brand'
import { SiteHeader, SITE_HEADER_SPACE } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { useSeoMeta } from '@/hooks/useSeoMeta'
import type { BlogPostMeta } from '@/lib/blog/posts'

type AgeBracket = { range: string; contribution: string; contributed: string; capital: string; multiplier: string }

type Block =
  | { p: string }
  | { list: string[] }
  | { orderedList: string[] }
  | { image: { key: string } }
  | { ageBrackets: { labels: { contribution: string; contributed: string; capital: string; multiplier: string }; items: AgeBracket[] } }
  | { callout: { icon: string; text: string; linkLabel: string; href: string } }

type Section = { heading?: string; blocks: Block[] }

// Convierte **negrita** de las cadenas i18n en <strong>, igual que LegalDocument.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: BRAND.ink, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

// Igual que renderInline, pero el tramo **marcado** se convierte en el enlace
// al Aviso Legal en vez de negrita — evita repetir el enlace dos veces.
function renderDisclaimer(text: string, href: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <a key={i} href={href} style={{ color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}>{part.slice(2, -2)}</a>
      : <span key={i}>{part}</span>
  )
}

function formatPublishedAt(iso: string, lang: 'es' | 'en') {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`))
}

type Props = {
  meta: BlogPostMeta
}

/**
 * Cuerpo compartido de una entrada del blog público: mismo patrón que
 * `LegalDocument` (contenido leído de i18n, componente genérico), extendido
 * con imágenes, listas numeradas, tarjetas de franja de edad y "callouts" con
 * enlace a una calculadora. Añadir una entrada nueva no requiere componente
 * propio: solo una entrada en `blog.json` (es/en) y en `BLOG_POSTS`.
 */
export function BlogDocument({ meta }: Props) {
  const { t, i18n } = useTranslation('blog')
  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const base = `posts.${meta.slug}`
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  const metaTitle = t(`${base}.metaTitle`)
  const title = t(`${base}.title`)
  const excerpt = t(`${base}.excerpt`)
  const readingMinutes = Number(t(`${base}.readingMinutes`))
  const sections = t(`${base}.sections`, { returnObjects: true }) as Section[]
  const imageAlts = t(`${base}.imageAlt`, { returnObjects: true, defaultValue: {} }) as Record<string, string>

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    datePublished: meta.publishedAt,
    image: `https://www.zafyros.com${meta.heroImage}`,
    author: { '@type': 'Organization', name: 'zafyros' },
    publisher: { '@type': 'Organization', name: 'zafyros' },
    mainEntityOfPage: `https://www.zafyros.com/blog/${meta.slug}`,
  }), [title, excerpt, meta.publishedAt, meta.heroImage, meta.slug])

  useSeoMeta({
    title: metaTitle,
    description: excerpt,
    path: `/blog/${meta.slug}`,
    jsonLd,
  })

  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightbox])

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <SiteHeader />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
        <a href="/blog" style={{ display: 'inline-block', marginBottom: 18, font: `600 13px ${BRAND.sans}`, color: BRAND.blue, textDecoration: 'none' }}>
          ← {t('index.backToBlog')}
        </a>

        <div style={{ font: `600 13px ${BRAND.sans}`, color: '#8A96A3' }}>
          {formatPublishedAt(meta.publishedAt, lang)} · {t('index.minRead', { count: readingMinutes })}
        </div>
        <h1 style={{ margin: '10px 0 14px', font: `500 clamp(28px,6vw,38px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {title}
        </h1>
        <p style={{ margin: '0 0 32px', font: `400 17px/1.6 ${BRAND.sans}`, color: '#586470' }}>
          {excerpt}
        </p>

        <div style={{ background: '#fff', border: '1px solid #ECE7DD', borderRadius: 20, padding: '4px clamp(16px, 5vw, 44px)', boxShadow: '0 4px 14px rgba(10,37,64,.04)', boxSizing: 'border-box' }}>
          {sections.map((section, si) => (
            <div key={si} style={{ padding: '26px 0', borderTop: si === 0 ? 'none' : '1px solid #F0ECE2' }}>
              {section.heading && (
                <h2 style={{ margin: '0 0 12px', font: `600 19px ${BRAND.display}`, color: BRAND.ink }}>
                  {section.heading}
                </h2>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {section.blocks.map((block, bi) => {
                  if ('p' in block) {
                    return (
                      <p key={bi} style={{ margin: 0, font: `400 15px/1.75 ${BRAND.sans}`, color: '#3C4A57' }}>
                        {renderInline(block.p)}
                      </p>
                    )
                  }
                  if ('list' in block) {
                    return (
                      <ul key={bi} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {block.list.map((item, ii) => (
                          <li key={ii} style={{ font: `400 15px/1.75 ${BRAND.sans}`, color: '#3C4A57' }}>
                            {renderInline(item)}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                  if ('orderedList' in block) {
                    return (
                      <ol key={bi} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {block.orderedList.map((item, ii) => (
                          <li key={ii} style={{ font: `400 15px/1.75 ${BRAND.sans}`, color: '#3C4A57' }}>
                            {renderInline(item)}
                          </li>
                        ))}
                      </ol>
                    )
                  }
                  if ('image' in block) {
                    const src = meta.images[block.image.key]
                    if (!src) return null
                    const alt = imageAlts[block.image.key] ?? ''
                    return (
                      <button
                        key={bi}
                        type="button"
                        onClick={() => setLightbox({ src, alt })}
                        style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'block' }}
                        aria-label={t('index.viewFullSize')}
                      >
                        <img
                          src={src}
                          alt={alt}
                          style={{ width: '100%', borderRadius: 16, border: '1px solid #ECE7DD', display: 'block' }}
                        />
                      </button>
                    )
                  }
                  if ('ageBrackets' in block) {
                    const { labels, items } = block.ageBrackets
                    return (
                      <div key={bi} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                        {items.map((item, ii) => (
                          <div key={ii} style={{ border: '1px solid #ECE7DD', borderRadius: 14, padding: 16, background: '#FAF8F3', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.ink }}>{item.range}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, font: `400 13px/1.5 ${BRAND.sans}`, color: '#586470' }}>
                              <div><strong style={{ color: BRAND.ink }}>{labels.contribution}:</strong> {item.contribution}</div>
                              <div><strong style={{ color: BRAND.ink }}>{labels.contributed}:</strong> {item.contributed}</div>
                              <div><strong style={{ color: BRAND.ink }}>{labels.capital}:</strong> {item.capital}</div>
                              <div style={{ marginTop: 4 }}>{item.multiplier}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  if ('callout' in block) {
                    const { icon, text, linkLabel, href } = block.callout
                    return (
                      <div key={bi} style={{ padding: '16px 18px', borderRadius: 14, background: '#EAF4FA', border: '1px solid #CFE6F2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{ margin: 0, font: `400 14.5px/1.65 ${BRAND.sans}`, color: '#0E3050' }}>
                          <span aria-hidden="true">{icon}</span> {text}
                        </p>
                        <a
                          href={href}
                          style={{
                            alignSelf: 'flex-start', background: BRAND.accent, color: '#fff', font: `600 13.5px ${BRAND.sans}`,
                            padding: '9px 16px', borderRadius: 999, textDecoration: 'none',
                          }}
                        >
                          {linkLabel} →
                        </a>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))}

          <p style={{ margin: '10px 0 16px', textAlign: 'right', font: `500 14px ${BRAND.display}`, fontStyle: 'italic', color: '#8A96A3' }}>
            — {t('index.signedBy')}
          </p>
        </div>

        <div style={{ margin: '20px 0 0', padding: '14px 18px', borderRadius: 14, background: '#F0ECE2', font: `400 12.5px/1.6 ${BRAND.sans}`, color: '#75828E' }}>
          {renderDisclaimer(t('index.disclaimer'), '/aviso-legal')}
        </div>
      </div>

      <SiteFooter />

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,37,64,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label={t('index.close')}
            style={{
              position: 'fixed', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 12, cursor: 'default', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}
          />
        </div>
      )}
    </div>
  )
}

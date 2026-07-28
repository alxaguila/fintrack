import { useTranslation } from 'react-i18next'
import { BRAND } from '@/components/landing/brand'
import { SiteHeader, SITE_HEADER_SPACE } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { sortedBlogPosts } from '@/lib/blog/posts'
import { useSeoMeta } from '@/hooks/useSeoMeta'

function formatPublishedAt(iso: string, lang: 'es' | 'en') {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`))
}

export default function Blog() {
  const { t, i18n } = useTranslation('blog')
  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const posts = sortedBlogPosts()

  useSeoMeta({
    title: t('index.metaTitle'),
    description: t('index.subtitle'),
    path: '/blog',
  })

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.cream }}>
      <SiteHeader />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `${SITE_HEADER_SPACE + 40}px 16px 80px`, boxSizing: 'border-box' }}>
        <div style={{ font: `600 13px ${BRAND.sans}`, color: BRAND.blue, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {t('index.eyebrow')}
        </div>
        <h1 style={{ margin: '8px 0 10px', font: `500 clamp(28px,6vw,38px) ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
          {t('index.title')}
        </h1>
        <p style={{ margin: '0 0 40px', maxWidth: 640, font: `400 15px/1.6 ${BRAND.sans}`, color: '#586470' }}>
          {t('index.subtitle')}
        </p>

        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {posts.map((post) => {
            const base = `posts.${post.slug}`
            return (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #ECE7DD', borderRadius: 20,
                  overflow: 'hidden', boxShadow: '0 4px 14px rgba(10,37,64,.04)', textDecoration: 'none',
                }}
              >
                <img src={post.heroImage} alt="" style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={{ font: `600 12px ${BRAND.sans}`, color: '#8A96A3' }}>
                    {formatPublishedAt(post.publishedAt, lang)} · {t('index.minRead', { count: Number(t(`${base}.readingMinutes`)) })}
                  </div>
                  <h2 style={{ margin: 0, font: `600 18px ${BRAND.display}`, color: BRAND.ink, lineHeight: 1.3 }}>
                    {t(`${base}.title`)}
                  </h2>
                  <p style={{ margin: 0, font: `400 14px/1.6 ${BRAND.sans}`, color: '#586470', flex: 1 }}>
                    {t(`${base}.excerpt`)}
                  </p>
                  <span style={{ marginTop: 4, font: `600 13.5px ${BRAND.sans}`, color: BRAND.blue }}>
                    {t('index.readMore')} →
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

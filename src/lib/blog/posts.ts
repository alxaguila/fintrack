// Registro de entradas del blog público. Cada entrada nueva se añade aquí
// (fecha + imágenes) y su contenido va en `src/i18n/locales/{es,en}/blog.json`
// bajo `posts.<slug>` — no hace falta crear ningún componente nuevo, lo
// renderiza `BlogDocument` de forma genérica (mismo patrón que `LegalDocument`).
export type BlogPostMeta = {
  slug: string
  /** Fecha de publicación en formato ISO (YYYY-MM-DD). */
  publishedAt: string
  /** Imágenes del cuerpo del artículo, referenciadas desde blog.json por `key`. */
  images: Record<string, string>
  /** Imagen usada como miniatura en el índice del blog. */
  heroImage: string
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'how-much-to-invest-by-age',
    publishedAt: '2026-07-25',
    images: {
      snowball: '/blog/cuanto-invertir-cada-mes-bola-nieve.png',
      startToday: '/blog/cuanto-invertir-cada-mes-empezar-hoy.png',
    },
    heroImage: '/blog/cuanto-invertir-cada-mes-bola-nieve.png',
  },
]

export function getBlogPost(slug: string | undefined): BlogPostMeta | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

export function sortedBlogPosts(): BlogPostMeta[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

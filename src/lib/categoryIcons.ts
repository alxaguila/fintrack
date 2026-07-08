// Resolución de iconos y etiquetas de (sub)categoría.
//
// El icono de cada subcategoría se guarda en `categories.icon` (BD) como el
// nombre kebab-case de un icono de lucide (p.ej. "shopping-cart"). Aquí se
// resuelve dinámicamente contra TODO el catálogo de lucide, de modo que si el
// admin crea o edita una subcategoría desde el backend (Supabase) con cualquier
// icono válido, la app lo pinta sin necesidad de tocar código.
import * as LucideIcons from 'lucide-react'
import { Circle, type LucideIcon } from 'lucide-react'
import i18n from '@/i18n'

const LUCIDE = LucideIcons as unknown as Record<string, LucideIcon>

// "shopping-cart" | "shopping_cart" → "ShoppingCart" (clave de export de lucide).
function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

const iconCache = new Map<string, LucideIcon>()

/**
 * Devuelve el componente de icono de lucide para un nombre kebab-case guardado
 * en `categories.icon`. Cae a `Circle` si el nombre está vacío o no existe, para
 * que las subcategorías nuevas (o con icono mal escrito) sigan renderizando.
 */
export function categoryIcon(name?: string | null): LucideIcon {
  if (!name) return Circle
  const cached = iconCache.get(name)
  if (cached) return cached
  const Icon = LUCIDE[toPascalCase(name)] ?? Circle
  iconCache.set(name, Icon)
  return Icon
}

/**
 * Etiqueta traducida de una subcategoría a partir de su slug. Si el slug no
 * tiene traducción (p.ej. una subcategoría recién añadida por el admin desde el
 * backend antes de traducirla), cae a una versión legible del propio slug en
 * lugar de mostrar la clave i18n cruda.
 */
export function categoryLabel(slug?: string | null, fallback = ''): string {
  if (!slug) return fallback
  const key = `category.${slug}`
  if (i18n.exists(key, { ns: 'categories' })) return i18n.t(key, { ns: 'categories' })
  return slug.replace(/[-_]/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

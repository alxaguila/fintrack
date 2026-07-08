import type { Category, KeywordRule } from './database.types'
import { applyKeywordRules } from './categorizer'
import { matchBuiltinCategory, merchantKey } from './categoryRules'

export type ClassificationSource = 'user_rule' | 'community' | 'builtin' | null

export interface ClassifyContext {
  /** Reglas propias del usuario (keyword_rules). */
  userRules: KeywordRule[]
  /** Mapa merchant_key → category_id con la categoría de la comunidad por encima del umbral. */
  communityMap: Map<string, string>
  /** Categorías disponibles (para resolver ids/slugs). */
  categories: Category[]
  /** Índice slug → categoría (opcional; se construye si no se pasa). */
  catBySlug?: Map<string, Category>
  /** Perfil activo, para priorizar reglas específicas de perfil. */
  profileId: string
  /** Importe del movimiento (para reglas con condición de importe). */
  amount: number
}

export interface ClassifyResult {
  categoryId: string | null
  category?: Category
  source: ClassificationSource
}

/**
 * Clasifica un concepto siguiendo la cadena acordada:
 *   1. Regla definida por el propio usuario.
 *   2. Regla creada por la comunidad para ese comercio (la más votada, ≥ umbral).
 *   3. Diccionario de categorización automática integrado.
 *   4. Sin categoría.
 */
export function classifyConcept(concept: string, ctx: ClassifyContext): ClassifyResult {
  // 1 ── Reglas del usuario
  const userCatId = applyKeywordRules(concept, ctx.amount, ctx.userRules, ctx.profileId)
  if (userCatId) {
    return { categoryId: userCatId, category: ctx.categories.find(c => c.id === userCatId), source: 'user_rule' }
  }

  // 2 ── Reglas de la comunidad (por merchant key)
  const key = merchantKey(concept)
  if (key) {
    const communityCatId = ctx.communityMap.get(key)
    if (communityCatId) {
      return { categoryId: communityCatId, category: ctx.categories.find(c => c.id === communityCatId), source: 'community' }
    }
  }

  // 3 ── Diccionario integrado
  const slug = matchBuiltinCategory(concept)
  if (slug) {
    const catBySlug = ctx.catBySlug ?? new Map(ctx.categories.map(c => [c.slug, c]))
    const cat = catBySlug.get(slug)
    if (cat) return { categoryId: cat.id, category: cat, source: 'builtin' }
  }

  // 4 ── Sin categoría
  return { categoryId: null, source: null }
}

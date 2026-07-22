import type { Category, DictionaryRule, KeywordRule, Merchant } from './database.types'
import { applyKeywordRules } from './categorizer'
import { matchBuiltinCategory, matchMerchant, merchantKey } from './categoryRules'

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
  /** Diccionario integrado (tabla dictionary_rules, migración 032). */
  dictionaryRules: DictionaryRule[]
  /** Catálogo de comercios con logo (tabla merchants, migración 034). */
  merchants: Merchant[]
  /** Perfil activo, para priorizar reglas específicas de perfil. */
  profileId: string
  /** Importe del movimiento (para reglas con condición de importe). */
  amount: number
  /**
   * Plan del usuario con acceso al paso 3.5 (fallback de IA, Haiku). Cableado
   * desde ya para el gating; sin efecto todavía porque ese paso no existe aún
   * (ver memoria `project_ai_classification_fallback`). Cuando se implemente,
   * irá entre el diccionario integrado (3) y "sin categoría" (4).
   */
  hasAiClassification?: boolean
}

export interface ClassifyResult {
  categoryId: string | null
  category?: Category
  source: ClassificationSource
  /** Regla concreta del diccionario que casó (solo si source === 'builtin'), para el contador de uso. */
  dictionaryRuleId?: string
  /** Merchant key de comunidad que casó (solo si source === 'community'), para el contador de uso. */
  communityMerchantKey?: string
  /** Comercio del catálogo (merchants) reconocido en el concepto, si lo hay — independiente de la categoría. */
  merchantId?: string
}

/**
 * Clasifica un concepto siguiendo la cadena acordada:
 *   1. Regla definida por el propio usuario.
 *   2. Regla creada por la comunidad para ese comercio (la más votada, ≥ umbral).
 *   3. Diccionario de categorización automática integrado.
 *   4. Sin categoría.
 */
export function classifyConcept(concept: string, ctx: ClassifyContext): ClassifyResult {
  // Comercio reconocido (independiente de la categoría — un movimiento puede
  // tener categoría y comercio, solo comercio, solo categoría, o ninguno).
  const merchantId = matchMerchant(concept, ctx.merchants)?.id

  // 1 ── Reglas del usuario
  const userCatId = applyKeywordRules(concept, ctx.amount, ctx.userRules, ctx.profileId)
  if (userCatId) {
    return { categoryId: userCatId, category: ctx.categories.find(c => c.id === userCatId), source: 'user_rule', merchantId }
  }

  // 2 ── Reglas de la comunidad (por merchant key)
  const key = merchantKey(concept)
  if (key) {
    const communityCatId = ctx.communityMap.get(key)
    if (communityCatId) {
      return {
        categoryId: communityCatId,
        category: ctx.categories.find(c => c.id === communityCatId),
        source: 'community',
        communityMerchantKey: key,
        merchantId,
      }
    }
  }

  // 3 ── Diccionario integrado
  const dictRule = matchBuiltinCategory(concept, ctx.dictionaryRules)
  if (dictRule) {
    const cat = ctx.categories.find(c => c.id === dictRule.category_id)
    if (cat) return { categoryId: dictRule.category_id, category: cat, source: 'builtin', dictionaryRuleId: dictRule.id, merchantId }
  }

  // 4 ── Sin categoría
  return { categoryId: null, source: null, merchantId }
}

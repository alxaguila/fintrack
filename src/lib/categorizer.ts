import type { KeywordRule } from './database.types'

/**
 * Aplica las reglas de categorización a un concepto y devuelve
 * el category_id de la primera regla que coincida (menor priority = antes).
 * Reglas de perfil específico tienen prioridad sobre reglas de usuario (profile_id null).
 *
 * Una regla casa si su texto coincide Y, si la regla define límites de importe
 * (amount_min / amount_max), el importe (en valor absoluto) los cumple.
 */
export function applyKeywordRules(
  concept: string,
  amount: number,
  rules: KeywordRule[],
  profileId: string,
): string | null {
  const active = rules.filter(r => r.is_active)
  const conceptUpper = concept.toUpperCase()
  const absAmount = Math.abs(amount)

  // Ordenar: primero por scope (perfil específico > global), luego por priority
  const sorted = [...active].sort((a, b) => {
    const aIsProfile = a.profile_id === profileId ? 0 : 1
    const bIsProfile = b.profile_id === profileId ? 0 : 1
    if (aIsProfile !== bIsProfile) return aIsProfile - bIsProfile
    return a.priority - b.priority
  })

  for (const rule of sorted) {
    if (!matches(conceptUpper, rule.keyword.toUpperCase(), rule.match_type)) continue
    if (rule.amount_min != null && absAmount < rule.amount_min) continue
    if (rule.amount_max != null && absAmount > rule.amount_max) continue
    return rule.category_id
  }
  return null
}

function matches(concept: string, keyword: string, type: KeywordRule['match_type']): boolean {
  switch (type) {
    case 'contains':    return concept.includes(keyword)
    case 'starts_with': return concept.startsWith(keyword)
    case 'ends_with':   return concept.endsWith(keyword)
    case 'exact':       return concept === keyword
    case 'regex': {
      try {
        return new RegExp(keyword, 'i').test(concept)
      } catch {
        return false
      }
    }
  }
}

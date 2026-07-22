import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { merchantKey } from '@/lib/categoryRules'
import type { CommunityRule, KeywordMatchType } from '@/lib/database.types'

/** Mínimo de votos para que una regla de la comunidad se considere fiable. */
export const COMMUNITY_VOTE_THRESHOLD = 3

/**
 * Devuelve un mapa merchant_key → category_id con la categoría MÁS VOTADA de la
 * comunidad para cada comercio, siempre que supere el umbral de confianza.
 */
export function useCommunityRuleMap() {
  return useQuery({
    queryKey: ['community_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_rules')
        .select('merchant_key, category_id, votes')
        .gte('votes', COMMUNITY_VOTE_THRESHOLD)
        .order('votes', { ascending: false })
      if (error) throw error
      const map = new Map<string, string>()
      // Al venir ordenado por votos desc, la primera aparición de cada clave es la ganadora.
      for (const row of (data ?? []) as Pick<CommunityRule, 'merchant_key' | 'category_id' | 'votes'>[]) {
        if (!map.has(row.merchant_key)) map.set(row.merchant_key, row.category_id)
      }
      return map
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Forma mínima de una regla para decidir su contribución a la comunidad.
 */
interface RuleLike {
  keyword: string
  match_type: KeywordMatchType
  amount_min?: number | null
  amount_max?: number | null
}

/**
 * Devuelve la merchant_key con la que una regla contribuye a la comunidad, o
 * null si no debe contribuir. Solo contribuyen las reglas "contiene", con una
 * clave de comercio limpia y SIN condición de importe (las reglas con importe
 * son demasiado específicas para ser útiles a otros usuarios).
 */
export function ruleCommunityKey(rule: RuleLike): string | null {
  if (rule.match_type !== 'contains') return null
  if (rule.amount_min != null || rule.amount_max != null) return null
  const key = merchantKey(rule.keyword)
  return key || null
}

/** Registra/actualiza el voto del usuario para un comercio (no bloquea ante error). */
export async function upsertCommunityVote(key: string | null, categoryId: string): Promise<void> {
  if (!key || !categoryId) return
  const { error } = await supabase.rpc('upsert_community_vote', { p_merchant_key: key, p_category_id: categoryId })
  if (error) console.warn('[community] upsert vote failed:', error)
}

/** Lista completa de reglas de la comunidad (una fila por comercio+categoría), para el admin. */
export function useAdminCommunityRules() {
  return useQuery({
    queryKey: ['admin_community_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_rules')
        .select('merchant_key, category_id, votes, updated_at')
        .order('votes', { ascending: false })
      if (error) throw error
      return data as CommunityRule[]
    },
    staleTime: 1000 * 60,
  })
}

/**
 * Mapa merchant_key → nº de veces que esa regla de comunidad ha clasificado un
 * movimiento (migración 033). Va en tabla aparte (community_rule_usage) porque
 * community_rules se borra/reinserta en cada voto (recompute_community_rule).
 */
export function useCommunityUsageMap() {
  return useQuery({
    queryKey: ['community_rule_usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_rule_usage')
        .select('merchant_key, use_count')
      if (error) throw error
      return new Map(((data ?? []) as { merchant_key: string; use_count: number }[]).map(r => [r.merchant_key, r.use_count]))
    },
    staleTime: 1000 * 60,
  })
}

/** Retira el voto del usuario para un comercio (no bloquea ante error). */
export async function deleteCommunityVote(key: string | null): Promise<void> {
  if (!key) return
  const { error } = await supabase.rpc('delete_community_vote', { p_merchant_key: key })
  if (error) console.warn('[community] delete vote failed:', error)
}

/** Sincroniza el voto comunitario al editar una regla existente. */
export async function syncCommunityVoteOnEdit(
  prev: RuleLike,
  next: RuleLike & { category_id: string },
): Promise<void> {
  const oldKey = ruleCommunityKey(prev)
  const newKey = ruleCommunityKey(next)
  if (oldKey && oldKey !== newKey) await deleteCommunityVote(oldKey)
  if (newKey) await upsertCommunityVote(newKey, next.category_id)
}

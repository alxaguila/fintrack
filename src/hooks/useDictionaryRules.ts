import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DictionaryRule } from '@/lib/database.types'

/**
 * Diccionario de clasificación integrado (tabla dictionary_rules, migración
 * 032), editable desde /admin/reglas. staleTime: Infinity como el resto de
 * datos de referencia (categorías) — Import.tsx lo refresca explícitamente
 * antes de cada importación por si el admin añadió palabras nuevas.
 */
export function useDictionaryRules() {
  return useQuery({
    queryKey: ['dictionary_rules'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dictionary_rules')
        .select('*, category:categories(*, group:category_groups(*))')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as DictionaryRule[]
    },
  })
}

type DictionaryRuleInput = {
  category_id: string
  pattern: string
  applies_to_bizum: boolean
  sort_order: number
}

/** Próximo sort_order al crear: añade la palabra nueva al final del diccionario. */
export function nextDictionarySortOrder(rules: { sort_order: number }[]): number {
  return rules.length ? Math.max(...rules.map((r) => r.sort_order)) + 10 : 10
}

export function useSaveDictionaryRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: DictionaryRuleInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('dictionary_rules').update(fields).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('dictionary_rules').insert(fields)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dictionary_rules'] }),
  })
}

export function useDeleteDictionaryRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rule: DictionaryRule) => {
      const { error } = await supabase.from('dictionary_rules').delete().eq('id', rule.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dictionary_rules'] }),
  })
}

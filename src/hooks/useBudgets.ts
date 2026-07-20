import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BudgetCategoryOrder, BudgetRule } from '@/lib/database.types'

/** Todas las reglas recurrentes de presupuesto de un perfil (todas las subcategorías, cualquier mes). */
export function useBudgetRules(profileId?: string) {
  return useQuery({
    queryKey: ['budget_rules', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_rules')
        .select('*')
        .eq('profile_id', profileId!)
      if (error) throw error
      return data as BudgetRule[]
    },
  })
}

/** Fija (o actualiza) el importe recurrente de una subcategoría. */
export function useUpsertBudgetRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { profile_id: string; category_id: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budget_rules')
        .upsert(values, { onConflict: 'profile_id,category_id' })
        .select()
        .single()
      if (error) throw error
      return data as BudgetRule
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['budget_rules', data.profile_id] })
    },
  })
}

/** Orden manual (arrastrar) de las subcategorías dentro de sus sobres, de todo el perfil. */
export function useBudgetCategoryOrder(profileId?: string) {
  return useQuery({
    queryKey: ['budget_category_order', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_category_order')
        .select('*')
        .eq('profile_id', profileId!)
      if (error) throw error
      return data as BudgetCategoryOrder[]
    },
  })
}

/** Guarda el nuevo orden de las subcategorías de UN sobre (índices 0..N-1 dentro de ese sobre). */
export function useReorderBudgetCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profile_id, categoryIds }: { profile_id: string; categoryIds: string[] }) => {
      const rows = categoryIds.map((category_id, sort_order) => ({ profile_id, category_id, sort_order }))
      const { error } = await supabase.from('budget_category_order').upsert(rows, { onConflict: 'profile_id,category_id' })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['budget_category_order', vars.profile_id] })
    },
  })
}

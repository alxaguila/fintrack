import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BudgetOverride, BudgetRule } from '@/lib/database.types'

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

/** Excepciones puntuales que caen dentro de [range.from, range.to] (meses 'YYYY-MM-01').
 *  Un rango de 1 mes cubre la vista Mes; de 3/12 meses, Trimestre/Año. */
export function useBudgetOverrides(profileId?: string, range?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['budget_overrides', profileId, range?.from, range?.to],
    enabled: !!profileId && !!range,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_overrides')
        .select('*')
        .eq('profile_id', profileId!)
        .gte('month', range!.from)
        .lte('month', range!.to)
      if (error) throw error
      return data as BudgetOverride[]
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

/** Fija (o actualiza) la excepción de UN mes concreto, sin tocar la regla recurrente. */
export function useUpsertBudgetOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { profile_id: string; category_id: string; month: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budget_overrides')
        .upsert(values, { onConflict: 'profile_id,category_id,month' })
        .select()
        .single()
      if (error) throw error
      return data as BudgetOverride
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['budget_overrides', data.profile_id] })
    },
  })
}

/** Quita la excepción de un mes: la subcategoría vuelve a su regla recurrente. */
export function useDeleteBudgetOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; profileId: string }) => {
      const { error } = await supabase.from('budget_overrides').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['budget_overrides', vars.profileId] })
    },
  })
}

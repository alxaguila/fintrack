import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AdminUserRow, AdminCategoryBreakdownRow, AdminMonthlyRow,
  AdminStatsOverview, AdminSignupRow, AdminDemographicRow, AdminPlanEvolutionRow,
  PlanType,
} from '@/lib/database.types'

/** Granularidad de la gráfica de evolución de usuarios por plan (RPC admin_plan_evolution). */
export type PlanEvolutionGranularity = 'day' | 'week' | 'month'

/** Listado de usuarios (RPC admin-only). */
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users')
      if (error) throw error
      return (data ?? []) as AdminUserRow[]
    },
  })
}

/** Actividad agregada (sin datos individuales) de un usuario concreto. */
export function useAdminUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user_activity', userId],
    enabled: !!userId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [byCat, byMonth] = await Promise.all([
        supabase.rpc('admin_user_category_breakdown', { p_user_id: userId! }),
        supabase.rpc('admin_user_monthly', { p_user_id: userId! }),
      ])
      if (byCat.error) throw byCat.error
      if (byMonth.error) throw byMonth.error
      return {
        byCategory: (byCat.data ?? []) as AdminCategoryBreakdownRow[],
        byMonth: (byMonth.data ?? []) as AdminMonthlyRow[],
      }
    },
  })
}

/** KPIs globales: overview + altas por mes + demografía. */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [overview, signups, demo] = await Promise.all([
        supabase.rpc('admin_stats_overview'),
        supabase.rpc('admin_signups_by_month'),
        supabase.rpc('admin_demographics'),
      ])
      if (overview.error) throw overview.error
      if (signups.error) throw signups.error
      if (demo.error) throw demo.error
      return {
        overview: ((overview.data ?? [])[0] ?? null) as AdminStatsOverview | null,
        signups: (signups.data ?? []) as AdminSignupRow[],
        demographics: (demo.data ?? []) as AdminDemographicRow[],
      }
    },
  })
}

/** Evolución de usuarios por plan (RPC admin-only), con granularidad día/semana/mes. */
export function useAdminPlanEvolution(granularity: PlanEvolutionGranularity) {
  return useQuery({
    queryKey: ['admin', 'plan_evolution', granularity],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_plan_evolution', { p_granularity: granularity })
      if (error) throw error
      return (data ?? []) as AdminPlanEvolutionRow[]
    },
  })
}

/** Forzar el plan de un usuario (admin-only; RLS + trigger acotan la escritura solo a `plan`). */
export function useAdminSetPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: PlanType }) => {
      const { error } = await supabase
        .from('user_settings')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'plan_evolution'] })
    },
  })
}

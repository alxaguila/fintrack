import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AdminUserRow, AdminCategoryBreakdownRow, AdminMonthlyRow,
  AdminStatsOverview, AdminBucketRow, AdminDemographicRow, AdminPlanEvolutionRow,
  PlanType,
} from '@/lib/database.types'

/** Granularidad compartida por las gráficas de evolución (plan / altas / conexiones). */
export type EvolutionGranularity = 'day' | 'week' | 'month'

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

/** KPIs globales: overview + demografía (altas/conexiones van en sus propios hooks, con granularidad). */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const [overview, demo] = await Promise.all([
        supabase.rpc('admin_stats_overview'),
        supabase.rpc('admin_demographics'),
      ])
      if (overview.error) throw overview.error
      if (demo.error) throw demo.error
      return {
        overview: ((overview.data ?? [])[0] ?? null) as AdminStatsOverview | null,
        demographics: (demo.data ?? []) as AdminDemographicRow[],
      }
    },
  })
}

/** Evolución de usuarios por plan (RPC admin-only), con granularidad día/semana/mes. */
export function useAdminPlanEvolution(granularity: EvolutionGranularity) {
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

/** Altas de usuarios (RPC admin-only), con granularidad día/semana/mes. */
export function useAdminSignupsEvolution(granularity: EvolutionGranularity) {
  return useQuery({
    queryKey: ['admin', 'signups_evolution', granularity],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_signups_by_granularity', { p_granularity: granularity })
      if (error) throw error
      return (data ?? []) as AdminBucketRow[]
    },
  })
}

/**
 * Conexiones de usuarios (RPC admin-only), con granularidad día/semana/mes.
 * Solo cuenta logins registrados a partir de la migración 046 (login_events)
 * — no hay histórico previo, auth.users solo guardaba el último login.
 */
export function useAdminLoginsEvolution(granularity: EvolutionGranularity) {
  return useQuery({
    queryKey: ['admin', 'logins_evolution', granularity],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_logins_by_granularity', { p_granularity: granularity })
      if (error) throw error
      return (data ?? []) as AdminBucketRow[]
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

/** Borra por completo a OTRO usuario (Edge Function delete-account con target_user_id; admin-only). */
export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        body: { target_user_id: userId },
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  AdminUserRow, AdminCategoryBreakdownRow, AdminMonthlyRow,
  AdminStatsOverview, AdminSignupRow, AdminDemographicRow,
} from '@/lib/database.types'

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

import { useQuery, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PlanLimits, PlanUsage, PlanType } from '@/lib/database.types'
import { checkLimit, type LimitDimension } from '@/lib/plan'
import { useUserSettings } from './useUserSettings'

/** Invalidar tras cualquier alta que consuma cupo (import, perfil, cuenta, regla). */
export function invalidatePlanUsage(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['plan_usage'] })
}

/** Límites de los 3 planes (para la comparativa en /settings/plan). Lectura pública para autenticados. */
export function useAllPlanLimits() {
  return useQuery({
    queryKey: ['plan_limits', 'all'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('plan_limits').select('*')
      if (error) throw error
      return (data ?? []) as PlanLimits[]
    },
  })
}

function usePlanLimits(plan: PlanType | undefined) {
  return useQuery({
    queryKey: ['plan_limits', plan],
    enabled: !!plan,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('plan_limits').select('*').eq('plan', plan!).maybeSingle()
      if (error) throw error
      return data as PlanLimits | null
    },
  })
}

function usePlanUsage() {
  return useQuery({
    queryKey: ['plan_usage'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_plan_usage')
      if (error) throw error
      return (data?.[0] ?? null) as PlanUsage | null
    },
  })
}

/**
 * Fuente única de verdad del plan del usuario autenticado: plan actual +
 * límites (`plan_limits`) + consumo del mes en curso (`get_plan_usage`).
 * Combina 3 queries cacheadas de TanStack Query; se usa en todos los gates.
 */
export function usePlan() {
  const { data: settings, isLoading: loadingSettings } = useUserSettings()
  const plan = settings?.plan
  const limitsQuery = usePlanLimits(plan)
  const usageQuery = usePlanUsage()

  return {
    plan,
    limits: limitsQuery.data ?? undefined,
    usage: usageQuery.data ?? undefined,
    isLoading: loadingSettings || limitsQuery.isLoading || usageQuery.isLoading,
  }
}

/**
 * Gate reutilizable para una dimensión con tope numérico (perfiles, cuentas,
 * reglas...). Uso en el sitio de creación:
 *   const gate = useLimitGate('profiles')
 *   if (gate.limited) { setShowLimitDialog(true); return }
 */
export function useLimitGate(dimension: LimitDimension) {
  const { plan, limits, usage, isLoading } = usePlan()
  const result = checkLimit(limits, usage, dimension)
  return { ...result, plan, isLoading }
}

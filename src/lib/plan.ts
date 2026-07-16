import type { PlanLimits, PlanType, PlanUsage } from './database.types'

/** Dimensiones de uso con tope numérico por plan (NULL en `plan_limits` = ilimitado). */
export type LimitDimension = 'profiles' | 'accounts' | 'imports' | 'movements' | 'rules'

const DIMENSION_KEYS: Record<LimitDimension, { limitKey: keyof PlanLimits; usageKey: keyof PlanUsage }> = {
  profiles:  { limitKey: 'max_profiles',           usageKey: 'profiles_count' },
  accounts:  { limitKey: 'max_accounts',            usageKey: 'accounts_count' },
  imports:   { limitKey: 'max_imports_per_month',   usageKey: 'imports_this_month' },
  movements: { limitKey: 'max_movements_per_month', usageKey: 'movements_this_month' },
  rules:     { limitKey: 'max_rules',               usageKey: 'rules_count' },
}

export interface LimitCheck {
  /** true si el uso actual ya alcanzó o supera el tope (bloqueo duro). */
  limited: boolean
  /** Tope del plan, o null si esa dimensión es ilimitada en el plan actual. */
  limit: number | null
  used: number
  /** Cupo restante, o null si es ilimitado. */
  remaining: number | null
}

/** Evalúa una dimensión de uso contra el plan actual. Sin límites cargados → nunca bloquea. */
export function checkLimit(
  limits: PlanLimits | undefined,
  usage: PlanUsage | undefined,
  dimension: LimitDimension,
): LimitCheck {
  const { limitKey, usageKey } = DIMENSION_KEYS[dimension]
  const limit = limits ? (limits[limitKey] as number | null) : null
  const used = usage ? (usage[usageKey] as number) : 0
  if (limit == null) return { limited: false, limit: null, used, remaining: null }
  return { limited: used >= limit, limit, used, remaining: Math.max(0, limit - used) }
}

export type FeatureFlag =
  | 'has_ai_classification'
  | 'has_budget'
  | 'has_export'
  | 'has_scheduled_export'
  | 'has_investments'
  | 'has_networth'

export function hasFeature(limits: PlanLimits | undefined, flag: FeatureFlag): boolean {
  return !!limits?.[flag]
}

/**
 * Días que faltan hasta que se restablezca el contador mensual (1 de mes que
 * viene, hora local). Se usa en el mensaje de bloqueo duro de una dimensión
 * mensual (movimientos/importaciones).
 */
export function daysUntilReset(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const diffDays = Math.round((nextMonthStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}

/** Dimensiones cuyo cupo es mensual (muestran el aviso de "se restablece en X días"). */
export const MONTHLY_DIMENSIONS: ReadonlySet<LimitDimension> = new Set(['imports', 'movements'])

/**
 * Bloqueo duro de una dimensión: la mutación que lo lanza no llega a escribir
 * nada. El llamador debe capturarlo (`instanceof PlanLimitError`) y mostrar
 * `LimitReachedDialog` en vez del toast de error genérico.
 */
export class PlanLimitError extends Error {
  constructor(public dimension: LimitDimension, public limit: number, public plan: PlanType) {
    super(`plan_limit_reached:${dimension}`)
    this.name = 'PlanLimitError'
  }
}

/**
 * Colores por plan para el admin (badge de Usuarios + gráfica de evolución en
 * Estadísticas). No reutiliza teal/rosa: esos ya significan ingreso/gasto en
 * el resto de la app.
 */
export const PLAN_COLORS: Record<PlanType, { hex: string; bgClass: string; textClass: string }> = {
  free:    { hex: '#94a3b8', bgClass: 'bg-slate-100',  textClass: 'text-slate-600' },
  pro:     { hex: '#6366f1', bgClass: 'bg-indigo-100', textClass: 'text-indigo-700' },
  premium: { hex: '#d97706', bgClass: 'bg-amber-100',  textClass: 'text-amber-700' },
}

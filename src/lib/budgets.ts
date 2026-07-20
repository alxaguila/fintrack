// Lógica de negocio de Presupuestos: agregación de sobres (category_groups) a
// partir del importe presupuestado por subcategoría (categories) — el total del
// sobre es SIEMPRE la suma de sus subcategorías, nunca un valor independiente.
//
// Cuando una subcategoría no tiene regla propia (`budget_rules`), se PROPONE un
// importe (media de los últimos 6 meses) que se trata como si fuera el
// presupuesto a todos los efectos (barras, totales, proyección) hasta que el
// usuario lo confirma arrastrando el marcador — momento en el que se guarda de
// verdad. `isProposed`/`hasRule` distinguen ambos casos para la UI.
import type { BudgetOverride, BudgetRule, Category, CategoryGroup } from './database.types'
import type { DashboardBreakdownRow } from '@/hooks/useTransactions'

/** Sobres visibles por defecto para todos los usuarios, aunque no tengan nada
 *  presupuestado todavía. El resto de sobres aparecen en cuanto el usuario les
 *  pone un importe real (regla) a alguna subcategoría — la propuesta automática
 *  no cuenta para esto, solo un importe confirmado. */
export const DEFAULT_BUDGET_GROUP_SLUGS: readonly string[] = [
  'food_grocery', 'housing', 'mobility', 'food_leisure', 'shopping',
]

/** 'YYYY-MM-01' del mes de `date` (por defecto hoy). */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

/** Desplaza un 'YYYY-MM-01' `delta` meses (negativo = hacia atrás). */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Lista de 'YYYY-MM-01' entre dos meses, ambos incluidos. */
export function monthsBetween(fromMonth: string, toMonth: string): string[] {
  const months: string[] = []
  let cur = fromMonth
  let guard = 0
  while (cur <= toMonth && guard < 60) {
    months.push(cur)
    cur = addMonths(cur, 1)
    guard++
  }
  return months
}

/** Mes "de referencia" de un periodo para calcular medias/propuestas: el último
 *  mes del periodo que ya ha empezado (o el último del periodo si es futuro). */
export function pickReferenceMonth(periodMonths: string[], todayMonth: string): string {
  const pastOrCurrent = periodMonths.filter(m => m <= todayMonth)
  return pastOrCurrent[pastOrCurrent.length - 1] ?? periodMonths[periodMonths.length - 1]
}

/** Importe efectivo de una subcategoría en un mes concreto: la excepción puntual
 *  gana a la regla recurrente; sin ninguna de las dos, no hay importe real. */
export function effectiveAmount(rule: BudgetRule | undefined, override: BudgetOverride | undefined): number | null {
  if (override) return override.amount
  if (rule) return rule.amount
  return null
}

// Semáforo de estado gasto-vs-presupuesto (excepción deliberada a "sin
// semáforo verde/rojo" del sistema de diseño: aquí es un estado, no ingreso/gasto).
export const BUDGET_STATUS_COLOR = {
  under: '#16A34A',
  near: '#F59E0B',
  over: '#DC2626',
  neutral: '#94A3B8',
} as const

/** Color de estado de un importe gastado frente a un presupuesto de referencia
 *  (el ACTUAL, puede ser el que se está arrastrando en vivo). */
export function budgetStatusColor(spent: number, budget: number | null): string {
  if (!budget || budget <= 0) return BUDGET_STATUS_COLOR.neutral
  if (spent <= budget) return BUDGET_STATUS_COLOR.under
  if (spent <= budget * 1.1) return BUDGET_STATUS_COLOR.near
  return BUDGET_STATUS_COLOR.over
}

export interface SubcategoryBudget {
  category: Category
  /** Importe aplicable (real si hay regla, propuesto si no). `null` = nada que proponer (sin histórico). */
  budgeted: number | null
  /** true si `budgeted` viene de una regla guardada por el usuario. */
  hasRule: boolean
  /** true si `budgeted` es una propuesta (media de 6 meses) aún no confirmada. */
  isProposed: boolean
  spent: number
  /** Media mensual de los 6 meses previos al mes de referencia. */
  avg6m: number
  /** Gasto de los últimos 12 meses NATURALES (desde hoy, fijo, no depende del periodo navegado). */
  history12: { month: string; spent: number }[]
}

export interface EnvelopeSummary {
  group: CategoryGroup
  budgeted: number
  spent: number
  remaining: number
  /** Estimación de gasto al cierre del periodo. Si el periodo ya cerró, coincide con `spent`. */
  projection: number
  /** % de variación del gasto del periodo vs la media (escalada al nº de meses del periodo). */
  vsAvgPct: number | null
  /** true si alguna subcategoría tiene una regla real (no solo propuesta). */
  hasActualBudget: boolean
  subcategories: SubcategoryBudget[]
}

/** Proyección lineal simple dentro de un rango [from, to]: ritmo de gasto actual
 *  extrapolado a todo el periodo. Si el periodo no está en curso, el dato ya está cerrado. */
export function projectSpendForPeriod(spent: number, range: { from: string; to: string }, today: Date = new Date()): number {
  if (!isCurrentPeriod(range, today)) return spent
  const fromD = new Date(range.from)
  const toD = new Date(range.to)
  const todayD = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const totalDays = Math.round((toD.getTime() - fromD.getTime()) / 86_400_000) + 1
  const elapsed = Math.round((todayD.getTime() - fromD.getTime()) / 86_400_000) + 1
  if (elapsed <= 0) return spent
  return (spent / elapsed) * totalDays
}

export function isCurrentPeriod(range: { from: string; to: string }, today: Date = new Date()): boolean {
  const fromD = new Date(range.from)
  const toD = new Date(range.to)
  const todayD = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return todayD >= fromD && todayD <= toD
}

export function daysRemainingInPeriod(range: { from: string; to: string }, today: Date = new Date()): number {
  if (!isCurrentPeriod(range, today)) return 0
  const toD = new Date(range.to)
  const todayD = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((toD.getTime() - todayD.getTime()) / 86_400_000))
}

export interface BuildContext {
  groups: CategoryGroup[]
  categories: Category[]
  rules: BudgetRule[]
  /** Excepciones puntuales que cubran, como mínimo, `periodMonths`. */
  overrides: BudgetOverride[]
  /** Desglose de gasto que cubra, como mínimo, `periodMonths` ∪ los 12 meses naturales ∪ los 6 previos al mes de referencia. */
  breakdown: DashboardBreakdownRow[]
  /** Meses ('YYYY-MM-01') que componen el periodo navegado (1 si es mes, 3 si trimestre, 12 si año). */
  periodMonths: string[]
  /** Mes usado como referencia para medias/propuestas y para editar (siempre a nivel mensual). */
  referenceMonth: string
  todayMonth: string
  today?: Date
}

function subcategoryBudgetsByCategory(params: BuildContext): Map<string, SubcategoryBudget> {
  const { groups, categories, rules, overrides, breakdown, periodMonths, referenceMonth, todayMonth } = params
  const ruleByCategory = new Map(rules.map(r => [r.category_id, r]))
  const overrideByKey = new Map(overrides.map(o => [`${o.category_id}|${o.month}`, o]))

  const last6Months: string[] = []
  for (let i = 1; i <= 6; i++) last6Months.push(addMonths(referenceMonth, -i))
  const last12Months: string[] = []
  for (let i = 11; i >= 0; i--) last12Months.push(addMonths(todayMonth, -i))

  const groupType = new Map(groups.map(g => [g.id, g.type]))
  const expenseCategories = categories.filter(c => groupType.get(c.group_id) === 'gasto')

  const result = new Map<string, SubcategoryBudget>()
  for (const cat of expenseCategories) {
    const catRows = breakdown.filter(r => r.category_id === cat.id && r.transaction_type === 'gasto')
    const spentInMonth = (m: string) => catRows.filter(r => r.month === m).reduce((s, r) => s + r.total_abs, 0)

    const spent = periodMonths.reduce((s, m) => s + spentInMonth(m), 0)
    const rule = ruleByCategory.get(cat.id)
    const avg6m = last6Months.reduce((s, m) => s + spentInMonth(m), 0) / 6

    let budgeted: number | null
    let isProposed: boolean
    if (rule) {
      budgeted = periodMonths.reduce((s, m) => s + (overrideByKey.get(`${cat.id}|${m}`)?.amount ?? rule.amount), 0)
      isProposed = false
    } else if (avg6m > 0) {
      budgeted = avg6m * periodMonths.length
      isProposed = true
    } else {
      budgeted = null
      isProposed = false
    }

    result.set(cat.id, {
      category: cat,
      budgeted,
      hasRule: !!rule,
      isProposed,
      spent,
      avg6m,
      history12: last12Months.map(m => ({ month: m, spent: spentInMonth(m) })),
    })
  }
  return result
}

/** Resumen de UN sobre concreto, sin importar si ya está "visible" (se usa
 *  tanto en la lista principal como al abrir un sobre inactivo desde "añadir categoría"). */
export function summarizeGroup(
  group: CategoryGroup,
  subByCategory: Map<string, SubcategoryBudget>,
  categories: Category[],
  params: { periodMonths: string[]; range: { from: string; to: string }; today?: Date },
): EnvelopeSummary {
  const subs = categories
    .filter(c => c.group_id === group.id)
    .map(c => subByCategory.get(c.id))
    .filter((s): s is SubcategoryBudget => !!s)

  const budgeted = subs.reduce((s, x) => s + (x.budgeted ?? 0), 0)
  const spent = subs.reduce((s, x) => s + x.spent, 0)
  const avg6mTotal = subs.reduce((s, x) => s + x.avg6m, 0) * params.periodMonths.length

  return {
    group,
    budgeted,
    spent,
    remaining: budgeted - spent,
    projection: projectSpendForPeriod(spent, params.range, params.today),
    vsAvgPct: avg6mTotal > 0 ? ((spent - avg6mTotal) / avg6mTotal) * 100 : null,
    hasActualBudget: subs.some(s => s.hasRule),
    subcategories: subs,
  }
}

export function buildEnvelopeSummaries(params: BuildContext & { range: { from: string; to: string } }): EnvelopeSummary[] {
  const { groups, categories, periodMonths, range, today } = params
  const subByCategory = subcategoryBudgetsByCategory(params)
  const expenseGroups = groups.filter(g => g.type === 'gasto')

  const summaries: EnvelopeSummary[] = []
  for (const group of expenseGroups) {
    const summary = summarizeGroup(group, subByCategory, categories, { periodMonths, range, today })
    const isDefault = DEFAULT_BUDGET_GROUP_SLUGS.includes(group.slug)
    if (!isDefault && !summary.hasActualBudget) continue
    summaries.push(summary)
  }

  return summaries.sort((a, b) => b.spent - a.spent)
}

/** Resumen "bajo demanda" de un sobre aún no visible (para el flujo de añadir categoría). */
export function buildSingleEnvelopeSummary(
  group: CategoryGroup,
  params: BuildContext & { range: { from: string; to: string } },
): EnvelopeSummary {
  const subByCategory = subcategoryBudgetsByCategory(params)
  return summarizeGroup(group, subByCategory, params.categories, { periodMonths: params.periodMonths, range: params.range, today: params.today })
}

/** Sobres de gasto que aún no aparecen en la lista (ni son default ni tienen nada presupuestado). */
export function inactiveEnvelopeGroups(groups: CategoryGroup[], summaries: EnvelopeSummary[]): CategoryGroup[] {
  const visibleIds = new Set(summaries.map(s => s.group.id))
  return groups.filter(g => g.type === 'gasto' && !visibleIds.has(g.id))
}

export function totalsFromSummaries(summaries: EnvelopeSummary[]) {
  const budgeted = summaries.reduce((s, x) => s + x.budgeted, 0)
  const spent = summaries.reduce((s, x) => s + x.spent, 0)
  const projection = summaries.reduce((s, x) => s + x.projection, 0)
  return { budgeted, spent, available: budgeted - spent, projection, vsBudget: projection - budgeted }
}

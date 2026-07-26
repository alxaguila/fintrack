// Cálculo puro (sin React) de la calculadora "aportación para objetivo de
// patrimonio" (Módulo 2). 100% client-side, igual que compoundInterest.ts.

export interface RetirementSavingsInput {
  currentAge: number
  retirementAge: number
  targetWealth: number
  currentCapital: number
  annualRatePct: number
}

export interface WealthProjectionPoint {
  age: number
  balance: number
}

export interface CostOfWaitingComparison {
  delayYears: number
  delayedMonthlyContribution: number
}

export interface RetirementSavingsResult {
  /** 0 si el capital inicial ya alcanza el objetivo por su cuenta. */
  requiredMonthlyContribution: number
  yearsToRetirement: number
  /** Un punto por edad, de currentAge a retirementAge (ambos incluidos). */
  projection: WealthProjectionPoint[]
  /** null si no queda margen suficiente hasta la jubilación para simular el retraso. */
  costOfWaiting: CostOfWaitingComparison | null
}

export const RETIREMENT_SAVINGS_LIMITS = {
  currentAge: { min: 18, max: 65 },
  retirementAge: { min: 19, max: 75 },
  targetWealth: { min: 50_000, max: 2_000_000 },
  currentCapital: { min: 0, max: 150_000 },
  annualRatePct: { min: 0, max: 15 },
} as const

/** Ventana usada por el indicador "coste de esperar" (ver calculateRetirementSavings). */
const DELAY_YEARS = 3

export const RETIREMENT_SAVINGS_DEFAULTS: RetirementSavingsInput = {
  currentAge: 35,
  retirementAge: 65,
  targetWealth: 1_000_000,
  currentCapital: 10_000,
  annualRatePct: 8,
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Usada tanto para leer los query params de deep-linking como para validar inputs manuales. */
export function clampRetirementSavingsInput(raw: Partial<Record<keyof RetirementSavingsInput, unknown>>): RetirementSavingsInput {
  const d = RETIREMENT_SAVINGS_DEFAULTS
  const l = RETIREMENT_SAVINGS_LIMITS
  const currentAge = Math.round(clampNumber(raw.currentAge, d.currentAge, l.currentAge.min, l.currentAge.max))
  const retirementAgeRaw = Math.round(clampNumber(raw.retirementAge, d.retirementAge, l.retirementAge.min, l.retirementAge.max))
  // La edad de jubilación siempre tiene que ser posterior a la edad actual.
  const retirementAge = Math.max(currentAge + 1, retirementAgeRaw)
  return {
    currentAge,
    retirementAge,
    targetWealth: clampNumber(raw.targetWealth, d.targetWealth, l.targetWealth.min, l.targetWealth.max),
    currentCapital: clampNumber(raw.currentCapital, d.currentCapital, l.currentCapital.min, l.currentCapital.max),
    annualRatePct: clampNumber(raw.annualRatePct, d.annualRatePct, l.annualRatePct.min, l.annualRatePct.max),
  }
}

/** PMT: aportación mensual necesaria para pasar de `pv` a `fv` en `months` meses a una tasa mensual `monthlyRate`. */
function requiredMonthlyPayment(pv: number, fv: number, months: number, monthlyRate: number): number {
  if (months <= 0) return 0
  if (monthlyRate === 0) return Math.max(0, (fv - pv) / months)
  const growth = Math.pow(1 + monthlyRate, months)
  const pmt = (fv - pv * growth) / ((growth - 1) / monthlyRate)
  return Math.max(0, pmt)
}

export function calculateRetirementSavings(input: RetirementSavingsInput): RetirementSavingsResult {
  const { currentAge, retirementAge, targetWealth, currentCapital, annualRatePct } = input
  const months = (retirementAge - currentAge) * 12
  const monthlyRate = annualRatePct / 1200
  const requiredMonthlyContribution = requiredMonthlyPayment(currentCapital, targetWealth, months, monthlyRate)

  const projection: WealthProjectionPoint[] = [{ age: currentAge, balance: currentCapital }]
  let balance = currentCapital
  for (let age = currentAge + 1; age <= retirementAge; age++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + requiredMonthlyContribution
    }
    projection.push({ age, balance })
  }

  // "Coste de esperar": el capital actual sigue creciendo igual durante los
  // próximos DELAY_YEARS años (eso no depende de cuándo empieces a aportar);
  // lo que cambia es que la ventana de aportación mensual se acorta esos años.
  // Ojo: NO es "cuánto necesitarías si hubieras empezado antes" — eso asumiría
  // tener ya hoy el mismo capital en el pasado, algo poco realista si ese
  // capital se ha ido construyendo con el tiempo.
  const delayMonths = DELAY_YEARS * 12
  const remainingMonths = months - delayMonths
  const costOfWaiting: CostOfWaitingComparison | null =
    remainingMonths > 0
      ? {
          delayYears: DELAY_YEARS,
          delayedMonthlyContribution: requiredMonthlyPayment(
            currentCapital * Math.pow(1 + monthlyRate, delayMonths),
            targetWealth,
            remainingMonths,
            monthlyRate,
          ),
        }
      : null

  return {
    requiredMonthlyContribution,
    yearsToRetirement: retirementAge - currentAge,
    projection,
    costOfWaiting,
  }
}

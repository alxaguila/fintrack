// Cálculo puro (sin React) de la calculadora de interés compuesto de la landing.
// 100% client-side: no persiste ni envía a ningún sitio los valores introducidos.

export type CapitalizationFrequency = 'monthly' | 'annual'

export interface CompoundInterestInput {
  initialCapital: number
  monthlyContribution: number
  years: number
  annualRatePct: number
  annualContributionIncreasePct: number
  frequency: CapitalizationFrequency
}

export interface YearBreakdown {
  /** 0 = punto de partida (antes del año 1), usado como origen del gráfico. */
  year: number
  contributedThisYear: number
  interestThisYear: number
  cumulativeContributed: number
  cumulativeInterest: number
  endBalance: number
}

export interface CompoundInterestResult {
  finalBalance: number
  /** Incluye el capital inicial. */
  totalContributed: number
  totalInterest: number
  yearlyBreakdown: YearBreakdown[]
}

export const COMPOUND_INTEREST_LIMITS = {
  initialCapital: { min: 0, max: 500_000 },
  monthlyContribution: { min: 0, max: 10_000 },
  years: { min: 1, max: 50 },
  annualRatePct: { min: 1, max: 15 },
  annualContributionIncreasePct: { min: 0, max: 10 },
} as const

export const COMPOUND_INTEREST_DEFAULTS: CompoundInterestInput = {
  initialCapital: 1000,
  monthlyContribution: 300,
  years: 25,
  annualRatePct: 8,
  annualContributionIncreasePct: 2,
  frequency: 'monthly',
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Usada tanto para leer los query params de deep-linking como para validar inputs manuales. */
export function clampCompoundInterestInput(raw: Partial<Record<keyof CompoundInterestInput, unknown>>): CompoundInterestInput {
  const d = COMPOUND_INTEREST_DEFAULTS
  const l = COMPOUND_INTEREST_LIMITS
  return {
    initialCapital: clampNumber(raw.initialCapital, d.initialCapital, l.initialCapital.min, l.initialCapital.max),
    monthlyContribution: clampNumber(raw.monthlyContribution, d.monthlyContribution, l.monthlyContribution.min, l.monthlyContribution.max),
    years: Math.round(clampNumber(raw.years, d.years, l.years.min, l.years.max)),
    annualRatePct: clampNumber(raw.annualRatePct, d.annualRatePct, l.annualRatePct.min, l.annualRatePct.max),
    annualContributionIncreasePct: clampNumber(
      raw.annualContributionIncreasePct,
      d.annualContributionIncreasePct,
      l.annualContributionIncreasePct.min,
      l.annualContributionIncreasePct.max,
    ),
    frequency: raw.frequency === 'annual' ? 'annual' : raw.frequency === 'monthly' ? 'monthly' : d.frequency,
  }
}

export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const { initialCapital, monthlyContribution, years, annualRatePct, annualContributionIncreasePct, frequency } = input

  const yearlyBreakdown: YearBreakdown[] = [
    {
      year: 0,
      contributedThisYear: 0,
      interestThisYear: 0,
      cumulativeContributed: initialCapital,
      cumulativeInterest: 0,
      endBalance: initialCapital,
    },
  ]

  let balance = initialCapital
  let cumulativeContributed = initialCapital
  let cumulativeInterest = 0
  let currentMonthlyContribution = monthlyContribution

  for (let year = 1; year <= years; year++) {
    let contributedThisYear = 0
    let interestThisYear = 0

    if (frequency === 'monthly') {
      // r = interés anual / (100 × 12); Saldo_m = Saldo_(m-1) × (1+r) + aportación del mes.
      const r = annualRatePct / (100 * 12)
      for (let m = 0; m < 12; m++) {
        const interest = balance * r
        balance += interest + currentMonthlyContribution
        interestThisYear += interest
        contributedThisYear += currentMonthlyContribution
      }
    } else {
      // Capitalización anual: las aportaciones del año no generan interés hasta el
      // cierre, donde se aplica una única vez sobre saldo + aportaciones del año.
      const r = annualRatePct / 100
      contributedThisYear = currentMonthlyContribution * 12
      const balanceBeforeInterest = balance + contributedThisYear
      interestThisYear = balanceBeforeInterest * r
      balance = balanceBeforeInterest + interestThisYear
    }

    cumulativeContributed += contributedThisYear
    cumulativeInterest += interestThisYear
    yearlyBreakdown.push({
      year,
      contributedThisYear,
      interestThisYear,
      cumulativeContributed,
      cumulativeInterest,
      endBalance: balance,
    })

    // La aportación mensual sube cada 12 meses según el % de incremento anual.
    currentMonthlyContribution *= 1 + annualContributionIncreasePct / 100
  }

  return {
    finalBalance: balance,
    totalContributed: cumulativeContributed,
    totalInterest: cumulativeInterest,
    yearlyBreakdown,
  }
}

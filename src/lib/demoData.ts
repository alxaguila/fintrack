// Dataset ficticio único para la demo pública (/demo, ver src/pages/demo/Demo.tsx).
// Reproduce la forma EXACTA de lo que devuelven los hooks reales (useAccounts,
// useAccountBalances, useDashboardTotals, useTransactions...) para que Home.tsx,
// Dashboard.tsx y Transactions.tsx —montados tal cual en modo demo— no necesiten
// lógica nueva, solo consumir estos datos en vez de los de Supabase.
//
// Los agregados (totales del dashboard, desglose, saldos, histórico de saldo,
// gasto de tarjeta) se CALCULAN a partir de DEMO_TRANSACTIONS en vez de escribirse
// a mano, para que Análisis y Movimientos nunca se desincronicen entre sí.
import type {
  FinancialProfile, Account, CategoryGroup, Category, Merchant, Transaction, TransactionType, BankEntity,
} from '@/lib/database.types'
import type { DashboardTotalRow, DashboardBreakdownRow, TransactionFilters } from '@/hooks/useTransactions'
import type { AccountBalanceInfo, BalanceHistoryPoint } from '@/hooks/useHomeOverview'

const NOW = new Date()
const ISO_NOW = NOW.toISOString()

// ── Perfil ──────────────────────────────────────────────────────────────────
export const DEMO_PROFILE: FinancialProfile = {
  id: 'demo-profile',
  user_id: 'demo-user',
  name: 'Toni',
  avatar_color: '#6366f1',
  is_default: true,
  sort_order: 0,
  type: 'particular',
  created_at: ISO_NOW,
  updated_at: ISO_NOW,
}

// ── Cuentas ─────────────────────────────────────────────────────────────────
export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'demo-acc-bbva-cc',
    profile_id: DEMO_PROFILE.id,
    name: 'BBVA',
    entity: 'BBVA',
    type: 'cuenta_corriente',
    currency: 'EUR',
    iban: null,
    last_four: '4821',
    color: '#004481',
    logo_url: null,
    is_active: true,
    sort_order: 0,
    opening_balance: 2400,
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: 'demo-acc-ing-ahorro',
    profile_id: DEMO_PROFILE.id,
    name: 'ING',
    entity: 'ING',
    type: 'ahorro',
    currency: 'EUR',
    iban: null,
    last_four: '7734',
    color: '#FF6200',
    logo_url: null,
    is_active: true,
    sort_order: 1,
    opening_balance: 1800,
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: 'demo-acc-bbva-credito',
    profile_id: DEMO_PROFILE.id,
    name: 'Tarjeta BBVA',
    entity: 'BBVA',
    type: 'tarjeta_credito',
    currency: 'EUR',
    iban: null,
    last_four: '9012',
    color: '#004481',
    logo_url: null,
    is_active: true,
    sort_order: 2,
    opening_balance: null,
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
  {
    id: 'demo-acc-openbank-ahorro',
    profile_id: DEMO_PROFILE.id,
    name: 'Openbank',
    entity: 'Openbank',
    type: 'ahorro',
    currency: 'EUR',
    iban: null,
    last_four: '2201',
    color: '#00AEEF',
    logo_url: null,
    is_active: true,
    sort_order: 3,
    opening_balance: 2600,
    created_at: ISO_NOW,
    updated_at: ISO_NOW,
  },
]

// Los importes "pesados" (nómina, alquiler...) se enrutan a través de ACC_BBVA
// y los ligeros a través de ACC_ING más abajo — pero estas dos constantes
// apuntan DELIBERADAMENTE a los ids cruzados (BBVA→cuenta ING, ING→cuenta BBVA)
// para que el saldo final quede al revés de como saldría "de fábrica": la
// cuenta de ahorro (ING) termina con el saldo alto y la corriente (BBVA) con
// uno modesto, que es lo realista para una cuenta de ahorro vs. una corriente.
const ACC_BBVA = DEMO_ACCOUNTS[1].id
const ACC_ING = DEMO_ACCOUNTS[0].id
const ACC_CARD = DEMO_ACCOUNTS[2].id
const ACC_OPENBANK = DEMO_ACCOUNTS[3].id

// BankLogo/entityLogo ya caen de forma segura a un avatar de iniciales sin
// entrada en el catálogo, así que dejamos ambos vacíos a propósito.
export const DEMO_BANK_ENTITIES: BankEntity[] = []
export const DEMO_MERCHANTS: Merchant[] = []

// ── Categorías y grupos ───────────────────────────────────────────────────
// Subconjunto de slugs REALES (ver src/i18n/locales/es/categories.json) para
// que categoryLabel()/groupIcon() resuelvan texto e icono traducidos de
// verdad, no un slug crudo. Colores/iconos de grupo calcados de supabase/seed.sql
// e iconos de subcategoría de supabase/migrations/008_taxonomy_v2.sql.
function group(slug: string, type: TransactionType, icon: string, color: string, sort: number): CategoryGroup {
  return { id: `demo-grp-${slug}`, slug, type, icon, color, sort_order: sort }
}

const GRP_INCOME        = group('income', 'ingreso', 'trending-up', '#22c55e', 110)
const GRP_FOOD_GROCERY  = group('food_grocery', 'gasto', 'shopping-cart', '#84cc16', 10)
const GRP_HOUSING       = group('housing', 'gasto', 'home', '#6366f1', 20)
const GRP_MOBILITY      = group('mobility', 'gasto', 'car', '#8b5cf6', 30)
const GRP_FOOD_LEISURE  = group('food_leisure', 'gasto', 'utensils', '#ec4899', 40)
const GRP_SHOPPING      = group('shopping', 'gasto', 'shopping-bag', '#f97316', 50)
const GRP_HEALTH_SPORT  = group('health_sport', 'gasto', 'heart-pulse', '#ef4444', 60)
const GRP_SERVICES      = group('services', 'gasto', 'zap', '#eab308', 70)

export const DEMO_CATEGORY_GROUPS: CategoryGroup[] = [
  GRP_INCOME, GRP_FOOD_GROCERY, GRP_HOUSING, GRP_MOBILITY, GRP_FOOD_LEISURE, GRP_SHOPPING, GRP_HEALTH_SPORT, GRP_SERVICES,
]

function category(slug: string, grp: CategoryGroup, icon: string, sort: number): Category {
  return { id: `demo-cat-${slug}`, group_id: grp.id, slug, icon, sort_order: sort, group: grp }
}

const CAT_SALARY          = category('salary', GRP_INCOME, 'briefcase', 10)
const CAT_OTHER_INCOME    = category('other_income', GRP_INCOME, 'circle-plus', 110)
const CAT_SUPERMARKET     = category('supermarket', GRP_FOOD_GROCERY, 'shopping-cart', 10)
const CAT_RENT            = category('rent_purchase', GRP_HOUSING, 'key', 10)
const CAT_COMMUNITY       = category('community_fees', GRP_HOUSING, 'users', 40)
const CAT_FUEL            = category('fuel', GRP_MOBILITY, 'fuel', 30)
const CAT_PARKING         = category('parking_tolls', GRP_MOBILITY, 'circle-parking', 40)
const CAT_RESTAURANT      = category('restaurant', GRP_FOOD_LEISURE, 'utensils', 10)
const CAT_CLOTHING        = category('clothing', GRP_SHOPPING, 'shirt', 10)
const CAT_ELECTRONICS     = category('electronics', GRP_SHOPPING, 'smartphone', 30)
const CAT_PHARMACY        = category('pharmacy', GRP_HEALTH_SPORT, 'pill', 20)
const CAT_ELECTRICITY     = category('electricity', GRP_SERVICES, 'zap', 10)
const CAT_MOBILE_INTERNET = category('mobile_internet', GRP_SERVICES, 'wifi', 40)
const CAT_STREAMING       = category('streaming', GRP_SERVICES, 'tv', 50)

export const DEMO_CATEGORIES: Category[] = [
  CAT_SALARY, CAT_OTHER_INCOME, CAT_SUPERMARKET, CAT_RENT, CAT_COMMUNITY, CAT_FUEL, CAT_PARKING,
  CAT_RESTAURANT, CAT_CLOTHING, CAT_ELECTRONICS, CAT_PHARMACY, CAT_ELECTRICITY, CAT_MOBILE_INTERNET, CAT_STREAMING,
]

// ── Movimientos (últimos 14 meses respecto al momento de carga del módulo,
//    para que la demo nunca se vea desactualizada) ─────────────────────────
const MONTHS_BACK = 14

/** {year, month(0-indexado)} del mes que hace `m` meses (0 = mes actual). */
function monthOf(m: number): { year: number; month: number } {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Fecha ISO ('YYYY-MM-DD') dentro del mes que hace `m` meses, en el día `day`
 *  (recortada al día actual si m=0, para no fechar movimientos "en el futuro"). */
function dateAt(m: number, day: number): string {
  const { year, month } = monthOf(m)
  const lastDay = new Date(year, month + 1, 0).getDate()
  let d = Math.min(day, lastDay)
  if (m === 0) d = Math.min(d, NOW.getDate())
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

let txCounter = 0
function tx(opts: {
  date: string; concept: string; amount: number; type: TransactionType
  accountId: string; category?: Category | null; reviewed?: boolean
}): Transaction {
  const id = `demo-tx-${txCounter++}`
  const amount = Math.round(opts.amount * 100) / 100
  return {
    id,
    profile_id: DEMO_PROFILE.id,
    account_id: opts.accountId,
    import_batch_id: null,
    date: opts.date,
    concept: opts.concept,
    amount,
    balance: null,
    transaction_type: opts.type,
    category_id: opts.category ? opts.category.id : null,
    notes: null,
    is_manual: false,
    is_reviewed: opts.reviewed ?? true,
    dedup_hash: `demo-${id}`,
    merchant_id: null,
    created_at: `${opts.date}T12:00:00.000Z`,
    updated_at: `${opts.date}T12:00:00.000Z`,
  }
}

const rows: Transaction[] = []

for (let m = MONTHS_BACK - 1; m >= 0; m--) {
  const { month } = monthOf(m)
  const bucket = m % 4

  // Nómina mensual + pagas extra de verano/Navidad (como en cualquier nómina española).
  rows.push(tx({ date: dateAt(m, 1), concept: 'NOMINA EMPRESA SL', amount: 2350, type: 'ingreso', accountId: ACC_BBVA, category: CAT_SALARY }))

  // Aportación bimensual a la cuenta de ahorro de Openbank (movimiento suelto,
  // suficiente para que tenga histórico de saldo propio sin añadir ruido).
  if (m % 2 === 0) rows.push(tx({ date: dateAt(m, 6), concept: 'TRASPASO AHORRO OPENBANK', amount: 90, type: 'ingreso', accountId: ACC_OPENBANK, category: CAT_OTHER_INCOME }))
  if (month === 5) rows.push(tx({ date: dateAt(m, 28), concept: 'PAGA EXTRA VERANO EMPRESA SL', amount: 1150, type: 'ingreso', accountId: ACC_BBVA, category: CAT_OTHER_INCOME }))
  if (month === 11) rows.push(tx({ date: dateAt(m, 20), concept: 'PAGA EXTRA NAVIDAD EMPRESA SL', amount: 1150, type: 'ingreso', accountId: ACC_BBVA, category: CAT_OTHER_INCOME }))

  // Supermercado mensual (alterna comercio y cuenta).
  const groceryConcepts = ['MERCADONA', 'CARREFOUR EXPRESS', 'DIA SUPERMERCADO']
  rows.push(tx({
    date: dateAt(m, 8),
    concept: groceryConcepts[m % groceryConcepts.length],
    amount: -(38 + (m % 5) * 4.3),
    type: 'gasto',
    accountId: bucket % 2 === 0 ? ACC_BBVA : ACC_ING,
    category: CAT_SUPERMARKET,
  }))

  // Resto de gastos: 4 "plantillas" que rotan por mes para variar categorías
  // sin disparar el número total de movimientos.
  if (bucket === 0) {
    rows.push(tx({ date: dateAt(m, 5), concept: 'ENDESA ENERGIA XXI', amount: -(58 + (m % 4) * 4), type: 'gasto', accountId: ACC_ING, category: CAT_ELECTRICITY }))
    rows.push(tx({ date: dateAt(m, 2), concept: 'ALQUILER PISO C MAYOR 12', amount: -650, type: 'gasto', accountId: ACC_BBVA, category: CAT_RENT }))
  } else if (bucket === 1) {
    rows.push(tx({ date: dateAt(m, 7), concept: 'MOVISTAR ESPANA SAU', amount: -42.9, type: 'gasto', accountId: ACC_ING, category: CAT_MOBILE_INTERNET }))
    rows.push(tx({ date: dateAt(m, 14), concept: 'GASOLINERA REPSOL', amount: -(52 + (m % 3) * 6), type: 'gasto', accountId: ACC_CARD, category: CAT_FUEL }))
    rows.push(tx({ date: dateAt(m, 18), concept: 'RESTAURANTE EL HORNO', amount: -(24 + (m % 4) * 7), type: 'gasto', accountId: ACC_CARD, category: CAT_RESTAURANT }))
  } else if (bucket === 2) {
    rows.push(tx({ date: dateAt(m, 10), concept: 'NETFLIX.COM', amount: -12.99, type: 'gasto', accountId: ACC_CARD, category: CAT_STREAMING }))
    rows.push(tx({ date: dateAt(m, 20), concept: 'FARMACIA LOPEZ', amount: -(9 + (m % 3) * 4), type: 'gasto', accountId: ACC_CARD, category: CAT_PHARMACY }))
  } else {
    rows.push(tx({ date: dateAt(m, 5), concept: 'ENDESA ENERGIA XXI', amount: -(58 + (m % 4) * 4), type: 'gasto', accountId: ACC_ING, category: CAT_ELECTRICITY }))
    rows.push(tx({ date: dateAt(m, 22), concept: 'ZARA', amount: -(39 + (m % 3) * 12), type: 'gasto', accountId: ACC_CARD, category: CAT_CLOTHING }))
    rows.push(tx({ date: dateAt(m, 3), concept: 'COMUNIDAD PROPIETARIOS', amount: -48, type: 'gasto', accountId: ACC_BBVA, category: CAT_COMMUNITY }))
  }

  // Un par de compras puntuales, para variedad.
  if (m === 7) rows.push(tx({ date: dateAt(m, 24), concept: 'MEDIAMARKT', amount: -199, type: 'gasto', accountId: ACC_CARD, category: CAT_ELECTRONICS }))
  if (m === 3) rows.push(tx({ date: dateAt(m, 16), concept: 'PARKING CENTRO', amount: -9.5, type: 'gasto', accountId: ACC_CARD, category: CAT_PARKING }))
}

// Un par de movimientos recientes sin clasificar (realismo: backlog por revisar).
rows.push(tx({ date: dateAt(0, Math.max(1, NOW.getDate() - 2)), concept: 'BIZUM VARIOS', amount: -22.5, type: 'gasto', accountId: ACC_BBVA, category: null, reviewed: false }))
rows.push(tx({ date: dateAt(0, Math.max(1, NOW.getDate() - 1)), concept: 'TRANSFERENCIA RECIBIDA', amount: 60, type: 'ingreso', accountId: ACC_ING, category: null, reviewed: false }))

// Orden cronológico descendente (igual que la consulta real) y unos pocos
// "no leídos" recientes para variedad visual (cosmético: no se puede togglear
// en demo, ver Transactions.tsx).
rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
for (let i = 0; i < Math.min(4, rows.length); i++) {
  if (rows[i].is_reviewed) rows[i] = { ...rows[i], is_reviewed: false }
}

export const DEMO_TRANSACTIONS: Transaction[] = rows

// ── Agregados del Dashboard (calculados a partir de DEMO_TRANSACTIONS, nunca
//    a mano, para que Análisis y Movimientos no se desincronicen) ───────────
function monthKey(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

const totalsMap = new Map<string, { total: number; total_abs: number }>()
const breakdownMap = new Map<string, { total_abs: number; count: number }>()

for (const t of DEMO_TRANSACTIONS) {
  const month = monthKey(t.date)
  const type = (t.transaction_type ?? 'gasto') as TransactionType

  const totalsKey = `${month}|${type}`
  const tEntry = totalsMap.get(totalsKey) ?? { total: 0, total_abs: 0 }
  tEntry.total += t.amount
  tEntry.total_abs += Math.abs(t.amount)
  totalsMap.set(totalsKey, tEntry)

  const bKey = `${month}|${t.category_id ?? '__null__'}|${type}`
  const bEntry = breakdownMap.get(bKey) ?? { total_abs: 0, count: 0 }
  bEntry.total_abs += Math.abs(t.amount)
  bEntry.count += 1
  breakdownMap.set(bKey, bEntry)
}

export const DEMO_DASHBOARD_TOTALS: DashboardTotalRow[] = [...totalsMap.entries()]
  .map(([key, v]) => {
    const [month, type] = key.split('|')
    return { month, transaction_type: type as TransactionType, total: v.total, total_abs: v.total_abs }
  })
  .sort((a, b) => (a.month < b.month ? -1 : 1))

export const DEMO_DASHBOARD_BREAKDOWN: DashboardBreakdownRow[] = [...breakdownMap.entries()]
  .map(([key, v]) => {
    const [month, categoryId, type] = key.split('|')
    return {
      month,
      category_id: categoryId === '__null__' ? null : categoryId,
      transaction_type: type as TransactionType,
      total_abs: v.total_abs,
      count: v.count,
    }
  })

// Serie mensual de UNA subcategoría (o "sin categoría" si null), igual que
// useDashboardCategorySeries — se dispara al pulsar una porción del donut.
export function getDemoCategorySeries(categoryId: string | null, transactionType: TransactionType): { month: string; total_abs: number }[] {
  return DEMO_DASHBOARD_BREAKDOWN
    .filter(r => r.category_id === categoryId && r.transaction_type === transactionType)
    .map(r => ({ month: r.month, total_abs: r.total_abs }))
    .sort((a, b) => (a.month < b.month ? -1 : 1))
}

// ── Saldos por cuenta (opening_balance + suma de movimientos, igual que
//    useAccountBalances) ─────────────────────────────────────────────────
export const DEMO_ACCOUNT_BALANCES: Map<string, AccountBalanceInfo> = (() => {
  const map = new Map<string, AccountBalanceInfo>()
  DEMO_ACCOUNTS.forEach((acc, idx) => {
    const accTx = DEMO_TRANSACTIONS.filter(t => t.account_id === acc.id)
    const sum = accTx.reduce((s, t) => s + t.amount, 0)
    const balance = acc.opening_balance == null ? null : acc.opening_balance + sum
    const lastMovementDate = accTx.reduce<string | null>((max, t) => (!max || t.date > max ? t.date : max), null)
    const daysSinceImport = 1 + (idx % 3) // 1..3 → punto de frescura siempre verde
    const lastImportAt = new Date(NOW.getTime() - daysSinceImport * 86_400_000).toISOString()
    map.set(acc.id, {
      accountId: acc.id,
      balance: balance == null ? null : Math.round((balance + Number.EPSILON) * 100) / 100,
      balanceDate: lastMovementDate,
      lastMovementDate,
      lastImportAt,
      daysSinceImport,
    })
  })
  return map
})()

// ── Histórico de saldo mensual (cuentas bancarias), igual que
//    useAccountBalanceHistory ────────────────────────────────────────────
export const DEMO_ACCOUNT_BALANCE_HISTORY: Map<string, BalanceHistoryPoint[]> = (() => {
  const map = new Map<string, BalanceHistoryPoint[]>()
  const bankAccounts = DEMO_ACCOUNTS.filter(a => a.type === 'cuenta_corriente' || a.type === 'ahorro')
  for (const acc of bankAccounts) {
    if (acc.opening_balance == null) { map.set(acc.id, []); continue }
    const flowByMonth = new Map<string, number>()
    for (const t of DEMO_TRANSACTIONS) {
      if (t.account_id !== acc.id) continue
      const month = monthKey(t.date)
      flowByMonth.set(month, (flowByMonth.get(month) ?? 0) + t.amount)
    }
    let running = acc.opening_balance
    const points: BalanceHistoryPoint[] = []
    for (const [month, flow] of [...flowByMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
      running += flow
      points.push({ date: month, balance: Math.round((running + Number.EPSILON) * 100) / 100 })
    }
    map.set(acc.id, points)
  }
  return map
})()

// ── Gasto en tarjeta (30 días), igual que useCardSpending30Days ─────────────
export const DEMO_CARD_SPENDING_30D: Map<string, number> = (() => {
  const map = new Map<string, number>()
  const since = new Date(NOW)
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString().slice(0, 10)
  const cardAccounts = DEMO_ACCOUNTS.filter(a => a.type === 'tarjeta_credito' || a.type === 'tarjeta_debito')
  for (const acc of cardAccounts) {
    const total = DEMO_TRANSACTIONS
      .filter(t => t.account_id === acc.id && t.transaction_type === 'gasto' && t.date >= sinceIso)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    map.set(acc.id, Math.round((total + Number.EPSILON) * 100) / 100)
  }
  return map
})()

// ── Contadores (No leídos / Sin categoría), igual que useTransactionCounts ──
export const DEMO_TRANSACTION_COUNTS = {
  unread: DEMO_TRANSACTIONS.filter(t => !t.is_reviewed).length,
  uncategorized: DEMO_TRANSACTIONS.filter(t => t.category_id == null).length,
}

// ── Filtrado client-side de movimientos, igual que applyTransactionFilters/
//    applyConceptSearch (src/hooks/useTransactions.ts) pero en memoria. No
//    reproduce el matiz de "palabra exacta" entre comillas ni searchCategoryIds/
//    pinnedIds (innecesarios en demo: la búsqueda ya casa bien por subcadena y
//    el filtro "No leídos" nunca llega a congelar un snapshot en modo demo).
export function filterDemoTransactions(transactions: Transaction[], filters: TransactionFilters, search: string): Transaction[] {
  let out = transactions
  if (filters.accountId) out = out.filter(t => t.account_id === filters.accountId)
  if (filters.categoryId) out = out.filter(t => t.category_id === filters.categoryId)
  if (filters.transactionType) out = out.filter(t => t.transaction_type === filters.transactionType)
  if (filters.dateFrom) out = out.filter(t => t.date >= filters.dateFrom!)
  if (filters.dateTo) out = out.filter(t => t.date <= filters.dateTo!)
  if (filters.amountMin != null) out = out.filter(t => t.amount >= filters.amountMin!)
  if (filters.amountMax != null) out = out.filter(t => t.amount <= filters.amountMax!)
  if (filters.isReviewed != null) out = out.filter(t => t.is_reviewed === filters.isReviewed)
  if (filters.uncategorized) out = out.filter(t => t.category_id == null)

  const term = search.trim().toLowerCase()
  if (term) out = out.filter(t => t.concept.toLowerCase().includes(term))

  return [...out].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

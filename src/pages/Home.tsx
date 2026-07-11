import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { AlertTriangle, CreditCard, Info, Landmark, Pencil, PiggyBank, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactionCounts } from '@/hooks/useTransactions'
import {
  useAccountBalances,
  useAccountBalanceHistory,
  useCardSpending30Days,
  useCardSpendingHistory,
} from '@/hooks/useHomeOverview'
import { AccountFormDialog } from '@/components/accounts/AccountForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Account } from '@/lib/database.types'

const C_TOTAL = '#10295A'
// Colores corporativos: teal = saldo/positivo · coral = gasto/negativo
const C_INCOME  = '#14B8A6'
const C_EXPENSE = '#CB6391'

// Separador de miles garantizado con regex — independiente del locale del browser
function fmt(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`
}

// Entero grande · decimales y € medianos grises
function AmountSplit({ amount, intClass, decClass, color }: {
  amount: number
  intClass: string
  decClass: string
  color?: string
}) {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (
    <>
      <span className={intClass} style={color ? { color } : undefined}>{sign}{intFmt}</span>
      <span className={decClass} style={color ? { color, opacity: 0.7 } : undefined}>,{dec} €</span>
    </>
  )
}

// Icono según el tipo de cuenta
function accountIcon(type: Account['type']): LucideIcon {
  if (type === 'ahorro') return PiggyBank
  if (type === 'tarjeta_credito' || type === 'tarjeta_debito') return CreditCard
  return Landmark // cuenta_corriente
}

type ChartRange = '3M' | '6M' | '1A' | '5A' | 'Todo'
type ChartMode  = 'saldo' | 'gasto'
const RANGES: ChartRange[] = ['3M', '6M', '1A', '5A', 'Todo']

function rangeFrom(range: ChartRange): string | null {
  if (range === 'Todo') return null
  const d = new Date()
  if      (range === '3M') d.setMonth(d.getMonth() - 3)
  else if (range === '6M') d.setMonth(d.getMonth() - 6)
  else if (range === '1A') d.setFullYear(d.getFullYear() - 1)
  else if (range === '5A') d.setFullYear(d.getFullYear() - 5)
  return d.toISOString().slice(0, 10)
}

// Etiquetas del eje Y: "12k €" para miles, "500 €" para el resto.
function fmtAxis(v: number): string {
  const n = Number(v)
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k €`
  return `${n} €`
}

function formatMonthLabel(iso: string): string {
  const d   = new Date(iso + 'T00:00:00')
  const mon = d.toLocaleString('es-ES', { month: 'short' }).replace('.', '')
  return `${mon}-${d.getFullYear().toString().slice(2)}`
}

function toMonthlyBalance(points: { date: string; balance: number }[]): { date: string; balance: number }[] {
  const byMonth = new Map<string, number>()
  for (const p of points) byMonth.set(p.date.slice(0, 7), p.balance)
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, balance]) => ({ date: `${month}-01`, balance }))
}

// ── Pastilla de cuenta ────────────────────────────────────────────────────────
function AccountChip({
  account, amount, subLabel, reserveSubLabel, noAmountLabel,
  daysSinceImport, isLoading, onClick, onEdit,
}: {
  account: Account
  amount: number | null
  subLabel?: string       // texto bajo el importe (solo tarjetas: "últ. 30 días")
  reserveSubLabel: boolean // reserva la altura de esa línea aunque no haya texto → igualar filas
  noAmountLabel: string
  daysSinceImport: number | null
  isLoading: boolean
  onClick: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation('home')
  const Icon = accountIcon(account.type)
  const isOld = daysSinceImport != null && daysSinceImport > 15
  // "Sin alias" se guardó como name === entity (ver AccountForm); en ese caso no hay 2ª línea.
  const alias = account.name.trim().toLowerCase() === account.entity.trim().toLowerCase() ? '' : account.name

  let dateText: string
  if (daysSinceImport == null)    dateText = t('accounts.never_updated')
  else if (daysSinceImport === 0) dateText = t('accounts.updated_today')
  else                            dateText = t('accounts.updated_days_ago', { count: daysSinceImport })

  const bg     = `${account.color}1f`
  const border = `${account.color}40`

  return (
    // group/chip para mostrar el botón de editar solo en hover
    <div
      className="group/chip relative w-44 shrink-0 rounded-2xl border shadow-sm overflow-hidden"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Botón editar — solo visible en hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/chip:opacity-100 transition-opacity hover:bg-black/10 z-10"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>

      {/* Contenido principal */}
      <button onClick={onClick} className="w-full flex flex-col gap-0.5 px-4 py-3 pr-8 text-left">
        {/* Icono según tipo + entidad en negrita */}
        <div className="flex items-center gap-1.5 w-full">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-sm font-bold truncate">{account.entity}</p>
        </div>
        {/* Alias (si existe); línea reservada para no descuadrar alturas */}
        <p className="text-xs text-muted-foreground truncate w-full mb-1 min-h-[1rem]">{alias}</p>

        {isLoading ? (
          <Skeleton className="h-7 w-24" style={{ backgroundColor: `${account.color}30` }} />
        ) : amount != null ? (
          <p className="leading-none">
            <AmountSplit amount={amount} intClass="text-xl font-extrabold tracking-tight" decClass="text-sm font-semibold text-muted-foreground" />
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{noAmountLabel}</p>
        )}

        {/* Línea de sublabel (solo tarjetas) o spacer para igualar altura entre filas */}
        {reserveSubLabel && (
          <div className="h-3.5 mt-0.5">
            {subLabel && <p className="text-[10px] text-muted-foreground">{subLabel}</p>}
          </div>
        )}

        <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${isOld ? 'text-red-500' : 'text-muted-foreground'}`}>
          {isOld && <AlertTriangle className="h-3 w-3 shrink-0" />}
          {dateText}
        </p>
      </button>
    </div>
  )
}

// ── Fila: título encima + tarjeta con número + chips ──────────────────────────
function AccountRow({
  sectionTitle, infoTooltip, totalLabel, total, totalColor, accounts,
  chipData, chipsLoading, balancesLoading,
  chipSubLabel, reserveChipSubLabel, noAmountLabel, onAccountClick, onEditAccount,
}: {
  sectionTitle: string
  infoTooltip?: string
  totalLabel: string
  total: number
  totalColor?: string
  accounts: Account[]
  chipData: Map<string, { amount: number | null; daysSinceImport: number | null }> | undefined
  chipsLoading: boolean
  balancesLoading: boolean
  chipSubLabel?: string
  reserveChipSubLabel: boolean
  noAmountLabel: string
  onAccountClick: (id: string) => void
  onEditAccount: (account: Account) => void
}) {
  if (accounts.length === 0) return null

  return (
    <div className="shrink-0 space-y-2">
      {/* Título de sección — encima, alineado al inicio (izquierda) del número (px-6 de la tarjeta) */}
      <p className="pl-6 text-xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
        {sectionTitle}
        {infoTooltip && (
          <span className="relative group/info cursor-help inline-flex items-center">
            <Info className="h-3.5 w-3.5 text-muted-foreground font-normal" />
            <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 px-2 py-1 text-xs bg-popover text-popover-foreground rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover/info:opacity-100 transition-opacity z-20 border font-normal">
              {infoTooltip}
            </span>
          </span>
        )}
      </p>

      {/* Tarjeta */}
      <div className="flex items-stretch rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Número + label, centrado verticalmente */}
        <div className="w-[200px] shrink-0 flex flex-col justify-center gap-1 px-6 py-4">
          {balancesLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">{totalLabel}</p>
              <p className="leading-none">
                <AmountSplit
                  amount={total}
                  intClass="text-3xl font-extrabold tracking-tight"
                  decClass="text-lg font-bold text-muted-foreground"
                  color={totalColor}
                />
              </p>
            </>
          )}
        </div>

        {/* Separador vertical */}
        <div className="w-px bg-border shrink-0 my-3" />

        {/* Chips scrollables */}
        <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 no-scrollbar">
          {accounts.map(acc => (
            <AccountChip
              key={acc.id}
              account={acc}
              amount={chipData?.get(acc.id)?.amount ?? null}
              subLabel={chipSubLabel}
              reserveSubLabel={reserveChipSubLabel}
              noAmountLabel={noAmountLabel}
              daysSinceImport={chipData?.get(acc.id)?.daysSinceImport ?? null}
              isLoading={chipsLoading}
              onClick={() => onAccountClick(acc.id)}
              onEdit={() => onEditAccount(acc)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tooltip de la gráfica ─────────────────────────────────────────────────────
// `showTotal`: en modo gasto (barras apiladas) no hay serie __total__, así que
// se calcula sumando las entradas y se muestra en una fila de cierre.
function ChartTooltip({ active, payload, label, accounts, showTotal }: any) {
  if (!active || !payload?.length) return null
  const rows = payload as any[]
  const total = rows.reduce((s, e) => s + Number(e.value ?? 0), 0)
  return (
    <div className="rounded-xl border bg-card px-3 py-2 shadow-lg text-xs space-y-1 min-w-[170px]">
      <p className="font-semibold text-muted-foreground mb-1">{formatMonthLabel(String(label))}</p>
      {rows.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-foreground">
              {entry.dataKey === '__total__'
                ? 'Total'
                : (accounts as Account[]).find((a: Account) => a.id === entry.dataKey)?.name ?? entry.dataKey}
            </span>
          </span>
          <span className="font-semibold tabular-nums">{fmt(Number(entry.value))}</span>
        </div>
      ))}
      {showTotal && rows.length > 1 && (
        <div className="flex items-center justify-between gap-4 border-t pt-1 mt-1">
          <span className="font-semibold" style={{ color: C_TOTAL }}>Total</span>
          <span className="font-bold tabular-nums" style={{ color: C_TOTAL }}>{fmt(total)}</span>
        </div>
      )}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useTranslation('home')
  const { activeProfile } = useProfile()
  const navigate = useNavigate()

  const [chartRange,     setChartRange]     = useState<ChartRange>('1A')
  const [chartMode,      setChartMode]      = useState<ChartMode>('saldo')
  const [editAccount,    setEditAccount]    = useState<Account | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: accounts = [],  isLoading: accountsLoading } = useAccounts(activeProfile?.id)
  const { data: balances,       isLoading: balancesLoading } = useAccountBalances(activeProfile?.id, accounts)
  const { data: balanceHistory, isLoading: historyLoading }  = useAccountBalanceHistory(activeProfile?.id, accounts)
  const { data: card30d,        isLoading: card30dLoading }  = useCardSpending30Days(activeProfile?.id, accounts)
  const { data: cardHistory,    isLoading: cardHistLoading } = useCardSpendingHistory(activeProfile?.id, accounts)
  const { data: counts }                                     = useTransactionCounts(activeProfile?.id)

  const bankAccounts   = useMemo(() => accounts.filter(a => a.type === 'cuenta_corriente' || a.type === 'ahorro'), [accounts])
  // Solo tarjetas de crédito — las de débito no generan sección de gasto ni modo gráfica
  const creditAccounts = useMemo(() => accounts.filter(a => a.type === 'tarjeta_credito'), [accounts])
  const hasCreditCards = creditAccounts.length > 0

  const bankChipData = useMemo(() => {
    if (!balances) return undefined
    const m = new Map<string, { amount: number | null; daysSinceImport: number | null }>()
    for (const acc of bankAccounts) {
      const b = balances.get(acc.id)
      m.set(acc.id, { amount: b?.balance ?? null, daysSinceImport: b?.daysSinceImport ?? null })
    }
    return m
  }, [balances, bankAccounts])

  const cardChipData = useMemo(() => {
    if (!balances || !card30d) return undefined
    const m = new Map<string, { amount: number | null; daysSinceImport: number | null }>()
    for (const acc of creditAccounts) {
      const b = balances.get(acc.id)
      m.set(acc.id, { amount: card30d.get(acc.id) ?? null, daysSinceImport: b?.daysSinceImport ?? null })
    }
    return m
  }, [balances, card30d, creditAccounts])

  const bankTotal   = useMemo(() => bankAccounts.reduce((s, a)   => s + (balances?.get(a.id)?.balance ?? 0), 0), [balances, bankAccounts])
  const creditTotal = useMemo(() => creditAccounts.reduce((s, a) => s + (card30d?.get(a.id) ?? 0), 0), [card30d, creditAccounts])

  // Orden de las pastillas: 1) actualizaciones más antiguas primero (más días,
  // nunca-actualizado al frente), 2) fecha de último movimiento más reciente
  // primero, 3) mayor saldo/gasto primero.
  function sortAccounts(list: Account[], amountOf: (a: Account) => number | null): Account[] {
    return [...list].sort((a, b) => {
      const ia = balances?.get(a.id), ib = balances?.get(b.id)
      const da = ia?.daysSinceImport ?? Infinity
      const db = ib?.daysSinceImport ?? Infinity
      if (da !== db) return db - da
      const ma = ia?.lastMovementDate ?? ''
      const mb = ib?.lastMovementDate ?? ''
      if (ma !== mb) return ma < mb ? 1 : -1
      return (amountOf(b) ?? 0) - (amountOf(a) ?? 0)
    })
  }

  const bankAccountsSorted   = useMemo(() => sortAccounts(bankAccounts,   a => balances?.get(a.id)?.balance ?? null), [bankAccounts, balances])
  const creditAccountsSorted = useMemo(() => sortAccounts(creditAccounts, a => card30d?.get(a.id) ?? null),          [creditAccounts, balances, card30d])

  const since = rangeFrom(chartRange)

  const evolutionData = useMemo(() => {
    if (!balanceHistory || bankAccounts.length === 0) return []
    // Mapa mensual con TODO el histórico (sin filtrar por rango): así el saldo
    // de meses anteriores a la ventana sigue disponible para arrastrarlo hacia
    // adelante, y una cuenta que dejó de subir extractos no desaparece ni deja
    // de sumar en el Total.
    const allMonthly = new Map<string, Map<string, number>>()
    for (const acc of bankAccounts) {
      const pts = balanceHistory.get(acc.id) ?? []
      const mmap = new Map<string, number>()
      for (const p of toMonthlyBalance(pts)) mmap.set(p.date, p.balance)
      allMonthly.set(acc.id, mmap)
    }
    // Eje X: solo los meses dentro de la ventana seleccionada.
    const dateSet = new Set<string>()
    for (const [, mmap] of allMonthly)
      for (const d of mmap.keys())
        if (!since || d >= since) dateSet.add(d)
    return [...dateSet].sort().map(date => {
      const row: Record<string, string | number> = { date }
      let total = 0; let hasAny = false
      for (const acc of bankAccounts) {
        const mmap = allMonthly.get(acc.id) ?? new Map<string, number>()
        // Último saldo conocido hasta este mes, incluyendo historia previa a la ventana.
        let last: number | null = null
        for (const [m, bal] of mmap) { if (m <= date) last = bal; else break }
        if (last != null) { row[acc.id] = last; total += last; hasAny = true }
      }
      if (bankAccounts.length > 1 && hasAny) row['__total__'] = total
      return row
    })
  }, [balanceHistory, bankAccounts, since])

  const spendingData = useMemo(() => {
    if (!cardHistory || creditAccounts.length === 0) return []
    const dateSet = new Set<string>()
    for (const [, pts] of cardHistory)
      for (const p of pts) if (!since || p.date >= since) dateSet.add(p.date)
    return [...dateSet].sort().map(date => {
      const row: Record<string, string | number> = { date }
      let total = 0
      for (const acc of creditAccounts) {
        // Mes sin datos = 0 gasto (no se puentea el hueco con una recta).
        const match = (cardHistory.get(acc.id) ?? []).find(p => p.date === date)
        const amt = match ? match.amount : 0
        row[acc.id] = amt; total += amt
      }
      if (creditAccounts.length > 1) row['__total__'] = total
      return row
    })
  }, [cardHistory, creditAccounts, since])

  // Si no hay tarjetas de crédito, forzar modo saldo siempre
  const effectiveMode  = hasCreditCards ? chartMode : 'saldo'
  const chartData      = effectiveMode === 'saldo' ? evolutionData  : spendingData
  const activeAccounts = effectiveMode === 'saldo' ? bankAccountsSorted : creditAccountsSorted
  // Series (una por cuenta). En modo saldo se añade además la línea Total; en
  // gasto no hace falta, porque la altura de la pila de barras ya es el total.
  const chartLines     = [
    ...activeAccounts.map(a => ({ key: a.id, color: a.color, label: a.name })),
    ...(effectiveMode === 'saldo' && activeAccounts.length > 1
      ? [{ key: '__total__', color: C_TOTAL, label: 'Total' }]
      : []),
  ]
  const isChartLoading = effectiveMode === 'saldo' ? historyLoading : cardHistLoading

  function openEdit(account: Account) {
    setEditAccount(account)
    setEditDialogOpen(true)
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <h2 className="text-xl font-semibold">{t('no_profile.title')}</h2>
        <p className="text-muted-foreground">{t('no_profile.description')}</p>
      </div>
    )
  }

  if (!accountsLoading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center p-6">
        <Wallet className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">{t('empty.title')}</p>
        <p className="text-sm text-muted-foreground">{t('empty.description')}</p>
        <Button onClick={() => navigate('/accounts')}>{t('empty.action')}</Button>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greetingKey = hour >= 6 && hour < 14 ? 'morning' : hour >= 14 && hour < 21 ? 'afternoon' : 'evening'

  return (
    <div className="flex flex-col gap-5 p-6 h-full">
      <div className="shrink-0">
        <h1 className="font-serif text-[32px] leading-tight tracking-tight text-foreground">
          {t(`greeting.${greetingKey}`)}, <span className="italic">{activeProfile.name}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('greeting_subtitle')}</p>
      </div>

      {/* Banner sin categorizar */}
      {!!counts?.uncategorized && (
        <button
          onClick={() => navigate('/transactions?uncategorized=true')}
          className="shrink-0 w-full text-left rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2.5 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-sm text-amber-800">
            {t('alerts.uncategorized', { count: counts.uncategorized })}
            {' · '}
            <span className="font-semibold underline underline-offset-2">{t('alerts.review_now')}</span>
          </span>
        </button>
      )}

      {/* Fila cuentas bancarias */}
      <AccountRow
        sectionTitle={t('accounts.bank_section')}
        totalLabel={t('accounts.bank_total_label')}
        total={bankTotal}
        totalColor={C_INCOME}
        accounts={bankAccountsSorted}
        chipData={bankChipData}
        chipsLoading={balancesLoading}
        balancesLoading={balancesLoading}
        reserveChipSubLabel={hasCreditCards}  // reserva espacio si hay tarjetas (para igualar altura)
        noAmountLabel={t('accounts.no_balance')}
        onAccountClick={(id) => navigate(`/transactions?accountId=${id}`)}
        onEditAccount={openEdit}
      />

      {/* Fila tarjetas de crédito — solo si existen */}
      {hasCreditCards && (
        <AccountRow
          sectionTitle={t('accounts.card_section')}
          infoTooltip={t('accounts.card_section_info')}
          totalLabel={t('accounts.card_total_label')}
          total={creditTotal}
          totalColor={C_EXPENSE}
          accounts={creditAccountsSorted}
          chipData={cardChipData}
          chipsLoading={balancesLoading || card30dLoading}
          balancesLoading={balancesLoading || card30dLoading}
          chipSubLabel={t('accounts.last_30_days')}
          reserveChipSubLabel={true}
          noAmountLabel={t('accounts.no_spending')}
          onAccountClick={(id) => navigate(`/transactions?accountId=${id}`)}
          onEditAccount={openEdit}
        />
      )}

      {/* Gráfica */}
      <Card className="rounded-2xl flex-1 flex flex-col min-h-0" style={{ minHeight: 260 }}>
        <CardHeader className="pb-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Modo — solo si hay tarjetas de crédito */}
            <div className="inline-flex rounded-lg border p-0.5 text-sm">
              <button
                onClick={() => setChartMode('saldo')}
                className={`px-3 py-1 rounded-md transition-colors ${effectiveMode === 'saldo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('evolution.mode_saldo')}
              </button>
              {hasCreditCards && (
                <button
                  onClick={() => setChartMode('gasto')}
                  className={`px-3 py-1 rounded-md transition-colors ${effectiveMode === 'gasto' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('evolution.mode_gasto')}
                </button>
              )}
            </div>
            {/* Rangos */}
            <div className="flex gap-1">
              {RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${chartRange === r ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t(`evolution.range_${r}`)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 pb-4">
          {isChartLoading ? (
            <Skeleton className="h-full w-full min-h-[200px]" />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-sm text-muted-foreground">{t('evolution.no_data')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {effectiveMode === 'saldo' ? (
                // Saldo = magnitud continua (stock) → área con línea Total.
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                  <defs>
                    {chartLines.map(line => (
                      <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={line.color} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatMonthLabel} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={52} dy={4} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} tickFormatter={fmtAxis} />
                  <Tooltip content={<ChartTooltip accounts={activeAccounts} />} />
                  {chartLines.map(line => (
                    <Area
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.color}
                      strokeWidth={line.key === '__total__' ? 2.5 : 2}
                      strokeDasharray={line.key === '__total__' ? '6 3' : undefined}
                      fill={`url(#grad-${line.key})`}
                      dot={false}
                      connectNulls
                      name={line.label}
                    />
                  ))}
                </AreaChart>
              ) : (
                // Gasto = flujo mensual independiente → columnas apiladas (altura = total).
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatMonthLabel} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={20} dy={4} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} tickFormatter={fmtAxis} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.12)' }} content={<ChartTooltip accounts={activeAccounts} showTotal />} />
                  {chartLines.map((line, i) => (
                    <Bar
                      key={line.key}
                      dataKey={line.key}
                      stackId="spend"
                      fill={line.color}
                      name={line.label}
                      maxBarSize={56}
                      // Esquinas superiores redondeadas solo en la barra más alta de la pila.
                      radius={i === chartLines.length - 1 ? [5, 5, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición de cuenta */}
      {activeProfile && (
        <AccountFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profileId={activeProfile.id}
          editing={editAccount}
          sortOrder={accounts.length}
        />
      )}
    </div>
  )
}

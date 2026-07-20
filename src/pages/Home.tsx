import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronDown, CreditCard, Pencil, Wallet } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useAccounts } from '@/hooks/useAccounts'
import { useBankEntities } from '@/hooks/useBankEntities'
import {
  useAccountBalances,
  useAccountBalanceHistory,
  useCardSpending30Days,
} from '@/hooks/useHomeOverview'
import { AccountFormDialog } from '@/components/accounts/AccountForm'
import { BankLogo } from '@/components/BankLogo'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Account } from '@/lib/database.types'

// ── Tokens del diseño dolfin (específicos de Posición Global) ─────────────────
const INK        = '#0A2540'
const FRESH_OK   = '#16A34A'
const FRESH_WARN = '#E0A81E'
const FRESH_STALE = '#DC5B4B'

// Separador de miles garantizado (independiente del locale del navegador).
function fmt(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`
}

// Entero + decimales/€ atenuados, con tamaños/colores configurables.
function AmountSplit({ amount, intClass, decClass, intColor, decColor }: {
  amount: number
  intClass: string
  decClass: string
  intColor?: string
  decColor?: string
}) {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (
    <>
      <span className={intClass} style={intColor ? { color: intColor } : undefined}>{sign}{intFmt}</span>
      <span className={decClass} style={decColor ? { color: decColor } : undefined}>,{dec} €</span>
    </>
  )
}

// Color del punto de frescura: <7 verde · 7-15 ámbar · >15 (o nunca) rojo.
function freshColor(days: number | null): string {
  if (days == null) return FRESH_STALE
  if (days < 7) return FRESH_OK
  if (days <= 15) return FRESH_WARN
  return FRESH_STALE
}

type ChartRange = '3M' | '6M' | '1A' | '5A' | 'Todo'
const RANGES: ChartRange[] = ['3M', '6M', '1A', '5A', 'Todo']

// Persistencia de las preferencias de visualizado de la gráfica (rango + series
// activas) para conservarlas al navegar fuera y volver a Posición Global.
const LS_RANGE = 'gp_chart_range'
const LS_SERIES = 'gp_chart_series'
function loadRange(): ChartRange {
  try {
    const v = localStorage.getItem(LS_RANGE)
    if (v && (RANGES as string[]).includes(v)) return v as ChartRange
  } catch { /* localStorage no disponible */ }
  return '1A'
}
function loadSeries(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_SERIES)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return new Set(arr.map(String))
    }
  } catch { /* ignore */ }
  return new Set(['__total__'])
}

function rangeFrom(range: ChartRange): string | null {
  if (range === 'Todo') return null
  const d = new Date()
  if      (range === '3M') d.setMonth(d.getMonth() - 3)
  else if (range === '6M') d.setMonth(d.getMonth() - 6)
  else if (range === '1A') d.setFullYear(d.getFullYear() - 1)
  else if (range === '5A') d.setFullYear(d.getFullYear() - 5)
  return d.toISOString().slice(0, 10)
}

function fmtAxis(v: number): string {
  const n = Number(v)
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k €`
  return `${n} €`
}

function formatMonthLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const mon = d.toLocaleString('es-ES', { month: 'short' }).replace('.', '')
  return `${mon} ${d.getFullYear().toString().slice(2)}`
}

function toMonthlyBalance(points: { date: string; balance: number }[]): { date: string; balance: number }[] {
  const byMonth = new Map<string, number>()
  for (const p of points) byMonth.set(p.date.slice(0, 7), p.balance)
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, balance]) => ({ date: `${month}-01`, balance }))
}

// Nombre visible de la cuenta: alias si difiere de la entidad, si no la entidad.
function accountLabel(a: Account): string {
  return a.name.trim().toLowerCase() === a.entity.trim().toLowerCase() ? a.entity : a.name
}
function accountSub(a: Account, typeLabel: string): string {
  return a.name.trim().toLowerCase() === a.entity.trim().toLowerCase() ? typeLabel : a.entity
}

// ── Tile de cuenta ────────────────────────────────────────────────────────────
function AccountTile({ account, logoUrl, amount, daysSinceImport, isLoading, typeLabel, updatedText, onClick, onEdit }: {
  account: Account
  logoUrl: string | null
  amount: number | null
  daysSinceImport: number | null
  isLoading: boolean
  typeLabel: string
  updatedText: string
  onClick: () => void
  onEdit: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="group/tile relative flex min-w-[150px] flex-1 cursor-pointer flex-col rounded-2xl border border-[#ECE7DD] bg-white p-[14px_14px_12px] shadow-[0_4px_14px_rgba(10,37,64,0.04)] transition-shadow hover:shadow-[0_6px_18px_rgba(10,37,64,0.08)]"
    >
      {/* Editar — solo en hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-black/5 group-hover/tile:opacity-100"
      >
        <Pencil className="h-3 w-3 text-[#94A3B8]" />
      </button>

      <div className="flex items-center gap-2 pr-5">
        <BankLogo entity={account.entity} color={account.color} logoUrl={logoUrl} size={28} />
        <div className="min-w-0 leading-[1.15]">
          <div className="truncate text-[12.5px] font-semibold text-[#0A2540]">{accountLabel(account)}</div>
          <div className="truncate text-[10.5px] text-[#94A3B8]">{accountSub(account, typeLabel)}</div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-[13px] h-6 w-24" />
      ) : amount != null ? (
        <div className="mt-[13px] leading-none">
          <AmountSplit amount={amount} intClass="text-[19px] font-semibold text-[#0A2540]" decClass="text-[13px] font-semibold" decColor="#B4BEC9" />
        </div>
      ) : (
        <div className="mt-[13px] text-[13px] text-[#94A3B8]">—</div>
      )}

      <div className="mt-[7px] flex items-center gap-[6px] text-[10.5px] text-[#A9B4BF]">
        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: freshColor(daysSinceImport) }} />
        {updatedText}
      </div>
    </div>
  )
}

// ── Tooltip de la gráfica ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, nameOf }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[170px] rounded-xl border border-[#ECE7DD] bg-white px-[13px] py-[11px] shadow-[0_12px_30px_rgba(10,37,64,0.16)]">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.03em] text-[#94A3B8]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        {formatMonthLabel(String(label))}
      </div>
      {(payload as any[]).map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-[9px] py-[2px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
          <span className="flex-1 whitespace-nowrap text-[12px] text-[#6B7C8C]">{nameOf(entry.dataKey)}</span>
          <span className="text-[12.5px] font-semibold text-[#0A2540] tabular-nums">{fmt(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useTranslation('home')
  const { t: tc } = useTranslation('common')
  const { activeProfile } = useProfile()
  const { data: settings } = useUserSettings()
  const navigate = useNavigate()

  const [chartRange, setChartRange] = useState<ChartRange>(loadRange)
  const [creditOpen, setCreditOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  // Series activas en la gráfica: por defecto solo el Total; las cuentas se añaden.
  const [activeSeries, setActiveSeries] = useState<Set<string>>(loadSeries)

  // Persistir las preferencias de visualizado al cambiarlas.
  useEffect(() => { try { localStorage.setItem(LS_RANGE, chartRange) } catch { /* ignore */ } }, [chartRange])
  useEffect(() => { try { localStorage.setItem(LS_SERIES, JSON.stringify([...activeSeries])) } catch { /* ignore */ } }, [activeSeries])

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts(activeProfile?.id)
  const { data: bankEntities = [] } = useBankEntities()
  const { data: balances, isLoading: balancesLoading }      = useAccountBalances(activeProfile?.id, accounts)
  const { data: balanceHistory, isLoading: historyLoading } = useAccountBalanceHistory(activeProfile?.id, accounts)
  const { data: card30d, isLoading: card30dLoading }        = useCardSpending30Days(activeProfile?.id, accounts)

  const bankAccounts   = useMemo(() => accounts.filter(a => a.type === 'cuenta_corriente' || a.type === 'ahorro'), [accounts])
  const creditAccounts = useMemo(() => accounts.filter(a => a.type === 'tarjeta_credito'), [accounts])
  const hasCredit = creditAccounts.length > 0

  // Logo por cuenta: el propio de la cuenta si lo tiene, si no el de su entidad
  // en el catálogo (bank_entities), si no null → ficha con inicial (BankLogo).
  const entityLogo = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of bankEntities) if (e.logo_url) m.set(e.name.trim().toLowerCase(), e.logo_url)
    return m
  }, [bankEntities])
  const logoFor = (a: Account): string | null =>
    a.logo_url || entityLogo.get(a.entity.trim().toLowerCase()) || null

  // Orden de los tiles: más antiguos primero → último movimiento reciente → mayor importe.
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
  const bankSorted   = useMemo(() => sortAccounts(bankAccounts, a => balances?.get(a.id)?.balance ?? null), [bankAccounts, balances])
  const creditSorted = useMemo(() => sortAccounts(creditAccounts, a => card30d?.get(a.id) ?? null), [creditAccounts, balances, card30d])

  const bankTotal = useMemo(() => bankAccounts.reduce((s, a) => s + (balances?.get(a.id)?.balance ?? 0), 0), [balances, bankAccounts])
  const cardTotal = useMemo(() => creditAccounts.reduce((s, a) => s + (card30d?.get(a.id) ?? 0), 0), [card30d, creditAccounts])

  // Mapa mensual (histórico completo) del saldo de cada cuenta bancaria.
  const monthlyByAccount = useMemo(() => {
    const m = new Map<string, Map<string, number>>()
    if (!balanceHistory) return m
    for (const acc of bankAccounts) {
      const mmap = new Map<string, number>()
      for (const p of toMonthlyBalance(balanceHistory.get(acc.id) ?? [])) mmap.set(p.date, p.balance)
      m.set(acc.id, mmap)
    }
    return m
  }, [balanceHistory, bankAccounts])

  // Total mensual (histórico completo) para la variación "este mes".
  const monthlyTotals = useMemo(() => {
    const dateSet = new Set<string>()
    for (const [, mmap] of monthlyByAccount) for (const d of mmap.keys()) dateSet.add(d)
    return [...dateSet].sort().map(date => {
      let total = 0
      for (const [, mmap] of monthlyByAccount) {
        let last: number | null = null
        for (const [m, bal] of mmap) { if (m <= date) last = bal; else break }
        if (last != null) total += last
      }
      return { date, total }
    })
  }, [monthlyByAccount])

  // Variación % del último mes con datos frente al anterior.
  const changePct = useMemo(() => {
    if (monthlyTotals.length < 2) return null
    const cur = monthlyTotals[monthlyTotals.length - 1].total
    const prev = monthlyTotals[monthlyTotals.length - 2].total
    if (prev === 0) return null
    return ((cur - prev) / Math.abs(prev)) * 100
  }, [monthlyTotals])

  // Serie de la gráfica (ventana del rango) con Total + una clave por cuenta.
  const since = rangeFrom(chartRange)
  const evolutionData = useMemo(() => {
    const dateSet = new Set<string>()
    for (const [, mmap] of monthlyByAccount)
      for (const d of mmap.keys()) if (!since || d >= since) dateSet.add(d)
    return [...dateSet].sort().map(date => {
      const row: Record<string, string | number> = { date }
      let total = 0; let hasAny = false
      for (const acc of bankAccounts) {
        const mmap = monthlyByAccount.get(acc.id) ?? new Map<string, number>()
        let last: number | null = null
        for (const [m, bal] of mmap) { if (m <= date) last = bal; else break }
        if (last != null) { row[acc.id] = last; total += last; hasAny = true }
      }
      if (hasAny) row['__total__'] = total
      return row
    })
  }, [monthlyByAccount, bankAccounts, since])

  // Series disponibles para los chips: Total + cuentas bancarias.
  const series = useMemo(() => ([
    { id: '__total__', name: t('evolution.series_total'), color: INK, last: bankTotal },
    ...bankSorted.map(a => ({ id: a.id, name: accountLabel(a), color: a.color, last: balances?.get(a.id)?.balance ?? 0 })),
  ]), [bankSorted, balances, bankTotal, t])

  const nameOf = (id: string) => series.find(s => s.id === id)?.name ?? id
  function toggleSeries(id: string) {
    setActiveSeries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function openEdit(a: Account) { setEditAccount(a); setEditOpen(true) }

  function updatedText(days: number | null): string {
    if (days == null) return t('accounts.never_updated')
    if (days === 0) return t('accounts.updated_today')
    return t('accounts.updated_days_ago', { count: days })
  }

  if (!activeProfile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">{t('no_profile.title')}</h2>
        <p className="text-muted-foreground">{t('no_profile.description')}</p>
      </div>
    )
  }

  if (!accountsLoading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 py-20 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">{t('empty.title')}</p>
        <p className="text-sm text-muted-foreground">{t('empty.description')}</p>
        <Button onClick={() => navigate('/app/accounts')}>{t('empty.action')}</Button>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greetingKey = hour >= 6 && hour < 14 ? 'morning' : hour >= 14 && hour < 21 ? 'afternoon' : 'evening'
  const displayName = settings?.first_name?.trim() || activeProfile.name

  const changeUp = (changePct ?? 0) >= 0
  const changeColor = changeUp ? '#0F9D6B' : FRESH_STALE

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 md:h-full md:gap-4 md:p-[24px_30px]">
      {/* Cabecera */}
      <div className="shrink-0">
        <h1 className="text-[26px] leading-[1.05] tracking-[-0.01em] text-[#0A2540] md:text-[28px]" style={{ fontFamily: '"Newsreader", serif', fontWeight: 400 }}>
          {t(`greeting.${greetingKey}`)}, <span className="italic">{displayName}</span>
        </h1>
        <p className="mt-[5px] text-[13.5px] text-[#6B7C8C]">{t('greeting_subtitle')}</p>
      </div>

      {/* Cinta de cuentas: total + tiles */}
      <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-stretch">
        {/* Total (navy) */}
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-[#0A2540] p-[16px_18px] text-[#EAF4FA] md:min-w-[230px] md:max-w-[260px] md:flex-[1.25]">
          <div className="pointer-events-none absolute -right-[30px] -top-[30px] h-[120px] w-[120px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(56,176,214,.35),transparent 70%)' }} />
          <div className="relative text-[11.5px] font-medium text-[#9DC4D9]">{t('total.label')}</div>
          {balancesLoading ? (
            <Skeleton className="relative mt-2 h-8 w-40 bg-white/10" />
          ) : (
            <div className="relative mt-2 leading-none">
              <AmountSplit amount={bankTotal} intClass="text-[30px] font-semibold" decClass="text-[17px] font-semibold" intColor="#EAF4FA" decColor="#6E98AE" />
            </div>
          )}
          {changePct != null && (
            <div className="relative mt-[9px] flex items-center gap-[6px] text-[12px] font-medium" style={{ color: changeColor }}>
              <span
                className="inline-block h-0 w-0"
                style={changeUp
                  ? { borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `6px solid ${changeColor}` }
                  : { borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `6px solid ${changeColor}` }}
              />
              {changeUp ? '+' : ''}{changePct.toFixed(1).replace('.', ',')}% {t('total.change_this_month')}
            </div>
          )}
          <button
            onClick={() => setAccountsOpen(o => !o)}
            className="relative mt-[10px] flex items-center gap-1 text-[11px] font-medium text-[#9DC4D9] md:hidden"
          >
            {t(accountsOpen ? 'accounts.hide' : 'accounts.show')}
            <ChevronDown className={`h-[13px] w-[13px] transition-transform ${accountsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Tiles de cuenta (scroll horizontal si no caben) */}
        <div className={`${accountsOpen ? 'flex' : 'hidden'} gap-3 overflow-x-auto no-scrollbar md:flex md:flex-1`}>
          {bankSorted.map(acc => (
            <AccountTile
              key={acc.id}
              account={acc}
              logoUrl={logoFor(acc)}
              amount={balances?.get(acc.id)?.balance ?? null}
              daysSinceImport={balances?.get(acc.id)?.daysSinceImport ?? null}
              isLoading={balancesLoading}
              typeLabel={tc(`account_type.${acc.type}`)}
              updatedText={updatedText(balances?.get(acc.id)?.daysSinceImport ?? null)}
              onClick={() => navigate(`/app/transactions?accountId=${acc.id}`)}
              onEdit={() => openEdit(acc)}
            />
          ))}
        </div>
      </div>

      {/* Tarjetas de crédito (plegable) */}
      {hasCredit && (
        <div className="shrink-0 overflow-hidden rounded-[14px] border border-[#ECE7DD] bg-white shadow-[0_4px_14px_rgba(10,37,64,0.04)]">
          <button onClick={() => setCreditOpen(o => !o)} className="flex w-full items-center gap-3 px-[18px] py-3 text-left">
            <CreditCard className="h-[17px] w-[17px] shrink-0 text-[#8A96A3]" strokeWidth={1.6} />
            <span className="text-[13.5px] font-semibold text-[#0A2540]">{t('cards.section')}</span>
            <span className="truncate text-[12.5px] text-[#94A3B8]">
              {t('cards.summary', { amount: fmt(cardTotal) })} · {t('cards.count', { count: creditAccounts.length })}
            </span>
            <ChevronDown className={`ml-auto h-[14px] w-[14px] shrink-0 text-[#94A3B8] transition-transform ${creditOpen ? 'rotate-180' : ''}`} />
          </button>
          {creditOpen && (
            <div className="flex flex-col gap-3 px-[18px] pb-4 md:flex-row">
              {creditSorted.map(c => (
                <div key={c.id} onClick={() => navigate(`/app/transactions?accountId=${c.id}`)} className="flex flex-1 cursor-pointer items-center gap-[10px] rounded-xl border border-[#EFEBE2] bg-[#FAF7F1] p-[11px_13px]">
                  <BankLogo entity={c.entity} color={c.color} logoUrl={logoFor(c)} size={26} radius={7} />
                  <div className="min-w-0 flex-1 leading-[1.2]">
                    <div className="truncate text-[12px] font-semibold text-[#0A2540]">{accountLabel(c)}</div>
                    <div className="truncate text-[10.5px] text-[#94A3B8]">{accountSub(c, tc(`account_type.${c.type}`))}</div>
                  </div>
                  <div className="text-[14px] font-semibold text-[#B5533A]">
                    {card30dLoading ? '…' : <AmountSplit amount={card30d?.get(c.id) ?? 0} intClass="text-[14px] font-semibold" decClass="text-[11px]" decColor="#D8A392" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gráfica: evolución de patrimonio */}
      <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#ECE7DD] bg-white p-[18px_22px_14px] shadow-[0_4px_14px_rgba(10,37,64,0.04)]">
        {/* Cabecera: título + rango */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[15px] font-semibold text-[#0A2540]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{t('evolution.title')}</span>
            <span className="text-[12px] text-[#94A3B8]">{t('evolution.subtitle')}</span>
          </div>
          <div className="hidden gap-[2px] rounded-[9px] bg-[#F2EFE8] p-[3px] md:flex">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`rounded-[7px] px-[11px] py-[5px] text-[12px] font-semibold transition-colors ${chartRange === r ? 'bg-white text-[#0A7BAE]' : 'text-[#94A3B8]'}`}
              >
                {t(`evolution.range_${r}`)}
              </button>
            ))}
          </div>
          <Select value={chartRange} onValueChange={(v) => setChartRange(v as ChartRange)}>
            <SelectTrigger className="flex h-auto w-auto gap-1 rounded-full border-none bg-[#F2EFE8] px-3 py-1.5 text-[12px] font-semibold text-[#0A7BAE] shadow-none md:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {RANGES.map(r => (
                <SelectItem key={r} value={r}>{t(`evolution.range_${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chips de series */}
        <div className="mt-[14px] flex gap-2 overflow-x-auto no-scrollbar pb-[2px]">
          {series.map(s => {
            const on = activeSeries.has(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleSeries(s.id)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[10px] pr-3 transition-colors"
                style={{ borderColor: on ? s.color : '#E0DACE', background: on ? '#fff' : 'transparent' }}
              >
                <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: on ? s.color : '#C7CFD8' }} />
                <span className="whitespace-nowrap text-[12.5px] font-semibold" style={{ color: on ? '#0A2540' : '#8A96A3' }}>{s.name}</span>
                <span className="text-[12px] font-medium" style={{ color: on ? '#94A3B8' : '#BDC6CF' }}>{fmt(s.last)}</span>
              </button>
            )
          })}
        </div>

        {/* Plot */}
        <div className="relative mt-[14px] min-h-0 flex-1">
          {historyLoading ? (
            <Skeleton className="h-full w-full" />
          ) : evolutionData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('evolution.no_data')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionData} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="gp-total-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INK} stopOpacity={0.13} />
                    <stop offset="100%" stopColor={INK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#EFEBE2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatMonthLabel} tick={{ fontSize: 11, fill: '#B4BEC9' }} axisLine={false} tickLine={false} minTickGap={40} dy={6} />
                <YAxis tick={{ fontSize: 11, fill: '#B4BEC9' }} axisLine={false} tickLine={false} width={52} tickFormatter={fmtAxis} />
                <Tooltip content={<ChartTooltip nameOf={nameOf} />} cursor={{ stroke: INK, strokeOpacity: 0.18, strokeWidth: 1.2, strokeDasharray: '4 4' }} />
                {/* Área bajo el Total (si está activo) */}
                {activeSeries.has('__total__') && (
                  <Area type="monotone" dataKey="__total__" stroke="none" fill="url(#gp-total-area)" connectNulls isAnimationActive={false} />
                )}
                {/* Líneas de las series activas */}
                {series.filter(s => activeSeries.has(s.id)).map(s => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    stroke={s.color}
                    strokeWidth={s.id === '__total__' ? 3.2 : 2.3}
                    dot={false}
                    activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#fff' }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Diálogo de edición de cuenta */}
      <AccountFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profileId={activeProfile.id}
        editing={editAccount}
        sortOrder={accounts.length}
      />
    </div>
  )
}

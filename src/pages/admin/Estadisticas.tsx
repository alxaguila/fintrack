import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  useAdminStats, useAdminPlanEvolution, useAdminSignupsEvolution, useAdminLoginsEvolution,
  type EvolutionGranularity,
} from '@/hooks/useAdminAnalytics'
import { PLAN_COLORS } from '@/lib/plan'
import type { AdminDemographicRow, PlanType } from '@/lib/database.types'
import { AdminHeader } from './AdminHeader'

const PLAN_ORDER: PlanType[] = ['free', 'pro', 'premium']
const EVOLUTION_GRANULARITIES: EvolutionGranularity[] = ['day', 'week', 'month']

/** Recuerda la granularidad elegida por gráfica (localStorage, por navegador) entre visitas a /admin/estadisticas. */
function usePersistedGranularity(storageKey: string): [EvolutionGranularity, (g: EvolutionGranularity) => void] {
  const fullKey = `admin_stats_granularity_${storageKey}`
  const [granularity, setGranularityState] = useState<EvolutionGranularity>(() => {
    const stored = localStorage.getItem(fullKey)
    return stored === 'day' || stored === 'week' || stored === 'month' ? stored : 'month'
  })
  const setGranularity = (g: EvolutionGranularity) => {
    setGranularityState(g)
    localStorage.setItem(fullKey, g)
  }
  return [granularity, setGranularity]
}

export default function Estadisticas() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data, isLoading } = useAdminStats()
  const ov = data?.overview

  const pctOnboarding = ov && ov.total_users > 0 ? Math.round((ov.onboarded_users / ov.total_users) * 100) : 0
  const avgTx = ov && ov.total_users > 0 ? Math.round(ov.total_transactions / ov.total_users) : 0

  const demoByDim = useMemo(() => groupDemographics(data?.demographics ?? []), [data])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <AdminHeader title={t('stats.title')} />

      {isLoading || !ov ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kpi label={t('stats.users')} value={ov.total_users} />
            <Kpi label={t('stats.onboarding')} value={`${pctOnboarding}%`} sub={t('stats.onboarding_sub', { done: ov.onboarded_users, total: ov.total_users })} />
            <Kpi label={t('stats.admins')} value={ov.admin_users} />
            <Kpi label={t('stats.profiles')} value={ov.total_profiles} />
            <Kpi label={t('stats.accounts')} value={ov.total_accounts} />
            <Kpi label={t('stats.movements')} value={ov.total_transactions} />
            <Kpi label={t('stats.imported')} value={ov.imported_transactions} />
            <Kpi label={t('stats.manual')} value={ov.manual_transactions} />
            <Kpi label={t('stats.avg_tx')} value={avgTx} />
          </div>

          {/* Altas por día/semana/mes */}
          <BucketEvolutionSection
            storageKey="signups"
            titleKey="stats.signups"
            useEvolution={useAdminSignupsEvolution}
            color="#14B8A6"
          />

          {/* Conexiones por día/semana/mes */}
          <BucketEvolutionSection
            storageKey="logins"
            titleKey="stats.logins"
            useEvolution={useAdminLoginsEvolution}
            color="#6366F1"
          />

          {/* Evolución de usuarios por plan */}
          <PlanEvolutionSection />

          {/* Demografía */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DemoBlock title={t('stats.by_country')} rows={demoByDim.country} />
            <DemoBlock title={t('stats.by_employment')} rows={demoByDim.employment} />
            <DemoBlock title={t('stats.by_goal')} rows={demoByDim.goal} />
          </div>
        </>
      )}
    </div>
  )
}

/** Serie bucket/cnt (altas o conexiones) con selector de granularidad día/semana/mes. */
function BucketEvolutionSection({
  storageKey, titleKey, useEvolution, color,
}: {
  storageKey: string
  titleKey: 'stats.signups' | 'stats.logins'
  useEvolution: (granularity: EvolutionGranularity) => ReturnType<typeof useAdminSignupsEvolution>
  color: string
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [granularity, setGranularity] = usePersistedGranularity(storageKey)
  const { data: rows = [], isLoading } = useEvolution(granularity)

  const chartData = useMemo(
    () => rows.map((r) => ({ label: granularity === 'month' ? r.bucket.slice(0, 7) : r.bucket, cnt: r.cnt })),
    [rows, granularity],
  )
  const title = t(titleKey)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <div className="inline-flex rounded-lg border p-0.5 text-xs">
          {EVOLUTION_GRANULARITIES.map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`rounded-md px-2.5 py-1 transition-colors ${granularity === g ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t(`stats.granularity.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-slate-500">{tc('empty_state.no_data')}</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={false} tickLine={false} axisLine={false} height={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: `${color}11` }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="cnt" name={title} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

/** Cuántos usuarios había en cada plan a lo largo del tiempo (RPC admin_plan_evolution). */
function PlanEvolutionSection() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [granularity, setGranularity] = usePersistedGranularity('plan_evolution')
  const { data: rows = [], isLoading } = useAdminPlanEvolution(granularity)

  const chartData = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>()
    for (const r of rows) {
      const entry = map.get(r.bucket) ?? { bucket: r.bucket }
      entry[r.plan] = r.cnt
      map.set(r.bucket, entry)
    }
    return [...map.values()]
      .sort((a, b) => (a.bucket < b.bucket ? -1 : 1))
      .map((e) => ({ ...e, label: granularity === 'month' ? String(e.bucket).slice(0, 7) : String(e.bucket) }))
  }, [rows, granularity])

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{t('stats.plan_evolution')}</h2>
        <div className="inline-flex rounded-lg border p-0.5 text-xs">
          {EVOLUTION_GRANULARITIES.map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`rounded-md px-2.5 py-1 transition-colors ${granularity === g ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t(`stats.granularity.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-slate-500">{tc('empty_state.no_data')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            {PLAN_ORDER.map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: PLAN_COLORS[p].hex }} />
                {tc(`plan.name.${p}`)}
              </span>
            ))}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                {PLAN_ORDER.map((p) => (
                  <Bar key={p} dataKey={p} stackId="plan" name={tc(`plan.name.${p}`)} fill={PLAN_COLORS[p].hex} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function DemoBlock({ title, rows }: { title: string; rows: { bucket: string; cnt: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.cnt))
  return (
    <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">—</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.bucket} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate text-xs text-slate-500">{r.bucket}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#CB6391]" style={{ width: `${(r.cnt / max) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{r.cnt}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function groupDemographics(rows: AdminDemographicRow[]) {
  const out: Record<'country' | 'employment' | 'goal', { bucket: string; cnt: number }[]> = {
    country: [], employment: [], goal: [],
  }
  for (const r of rows) {
    if (r.dimension === 'country') out.country.push({ bucket: r.bucket, cnt: r.cnt })
    else if (r.dimension === 'employment') out.employment.push({ bucket: r.bucket, cnt: r.cnt })
    else if (r.dimension === 'goal') out.goal.push({ bucket: r.bucket, cnt: r.cnt })
  }
  return out
}

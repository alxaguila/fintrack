import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Search, Users as UsersIcon } from 'lucide-react'
import { useAdminUsers, useAdminUserActivity } from '@/hooks/useAdminAnalytics'
import type { AdminUserRow } from '@/lib/database.types'
import { categoryLabel } from '@/lib/categoryIcons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { AdminHeader } from './AdminHeader'

const typeColor = (t: string | null) => (t === 'ingreso' ? '#14B8A6' : t === 'gasto' ? '#CB6391' : '#64748b')

export default function Usuarios() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: users = [], isLoading } = useAdminUsers()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<AdminUserRow | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return users
    return users.filter((u) =>
      u.email.toLowerCase().includes(needle) || (u.full_name ?? '').toLowerCase().includes(needle))
  }, [users, q])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <AdminHeader title={t('users.title')} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder={t('users.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{t('users.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filtered.map((u) => (
            <button
              key={u.user_id}
              onClick={() => setSelected(u)}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                <UsersIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {u.full_name || u.email.split('@')[0]}
                  {u.is_admin && <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                </p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-xs text-slate-500">{t('users.joined', { date: formatDate(u.created_at.slice(0, 10)) })}</p>
                <p className="text-xs text-slate-400">{t('users.tx_count', { count: u.transactions_count })}</p>
              </div>
              {!u.onboarding_completed && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {t('users.pending')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <UserDetailDialog user={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function UserDetailDialog({ user, onClose }: { user: AdminUserRow | null; onClose: () => void }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data, isLoading } = useAdminUserActivity(user?.user_id ?? null)

  const monthMax = useMemo(() => Math.max(1, ...(data?.byMonth ?? []).map((m) => Number(m.total_abs))), [data])

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="break-words">{user?.full_name || user?.email}</DialogTitle>
          <DialogDescription className="break-words">{user?.email}</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-5">
            {/* Ficha */}
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Fact label={t('users.country')} value={user.country ?? '—'} />
              <Fact label={t('users.employment')} value={user.employment_status ?? '—'} />
              <Fact label={t('users.joined_label')} value={formatDate(user.created_at.slice(0, 10))} />
              <Fact label={t('users.profiles')} value={String(user.profiles_count)} />
              <Fact label={t('users.accounts')} value={String(user.accounts_count)} />
              <Fact label={t('users.movements')} value={String(user.transactions_count)} />
            </div>

            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t('users.masked_note')}</p>

            {isLoading ? (
              <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
            ) : (
              <>
                {/* Serie mensual (barras CSS) */}
                {(data?.byMonth?.length ?? 0) > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[15px] font-bold">{t('users.monthly')}</h3>
                    <div className="space-y-1.5">
                      {aggregateMonths(data!.byMonth).map((m) => (
                        <div key={m.month} className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-xs text-slate-500">{m.month.slice(0, 7)}</span>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-teal-400" style={{ width: `${(m.total / monthMax) * 100}%` }} />
                          </div>
                          <span className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-500">{formatCurrency(m.total)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Desglose por categoría */}
                {(data?.byCategory?.length ?? 0) > 0 ? (
                  <section className="space-y-2">
                    <h3 className="text-[15px] font-bold">{t('users.by_category')}</h3>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      {data!.byCategory.map((c, i) => (
                        <div key={`${c.category_id ?? 'none'}-${i}`} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: typeColor(c.transaction_type) }} />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {c.category_slug ? categoryLabel(c.category_slug) : t('users.uncategorized')}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">{c.cnt}</span>
                          <span className="w-24 shrink-0 text-right text-sm tabular-nums">{formatCurrency(Number(c.total_abs))}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <p className="text-sm text-slate-500">{t('users.no_activity')}</p>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  )
}

/** Suma todos los tipos por mes para la barra (magnitud total del mes). */
function aggregateMonths(rows: { month: string; total_abs: number }[]): { month: string; total: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.month, (map.get(r.month) ?? 0) + Number(r.total_abs))
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
}

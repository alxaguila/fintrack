import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Search, Trash2, AlertTriangle } from 'lucide-react'
import { useAdminUsers, useAdminUserActivity, useAdminSetPlan, useAdminDeleteUser } from '@/hooks/useAdminAnalytics'
import type { AdminUserRow, PlanType } from '@/lib/database.types'
import { PLAN_COLORS } from '@/lib/plan'
import { SortHeader, nextSort, type SortDir } from './SortHeader'
import { categoryLabel } from '@/lib/categoryIcons'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { AdminHeader } from './AdminHeader'

const typeColor = (t: string | null) => (t === 'ingreso' ? '#14B8A6' : t === 'gasto' ? '#CB6391' : '#64748b')
const PLAN_ORDER: PlanType[] = ['free', 'pro', 'premium']
type UserSortKey = 'user' | 'plan' | 'joined' | 'last_login' | 'movements' | 'accounts'
// Palabra que hay que teclear para confirmar el borrado (igual en ES/EN, ver Settings.tsx).
const DELETE_WORD = 'delete'

function PlanBadge({ plan }: { plan: PlanType }) {
  const { t } = useTranslation('common')
  const c = PLAN_COLORS[plan]
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', c.bgClass, c.textClass)}>
      {t(`plan.name.${plan}`)}
    </span>
  )
}

export default function Usuarios() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: users = [], isLoading } = useAdminUsers()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<AdminUserRow | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: UserSortKey; dir: SortDir }>({ key: 'joined', dir: 'desc' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id ?? null))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return users
    return users.filter((u) =>
      u.email.toLowerCase().includes(needle) || (u.full_name ?? '').toLowerCase().includes(needle))
  }, [users, q])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp: number
      switch (sort.key) {
        case 'user':
          cmp = (a.full_name || a.email).localeCompare(b.full_name || b.email)
          break
        case 'plan':
          cmp = PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan)
          break
        case 'joined':
          cmp = a.created_at.localeCompare(b.created_at)
          break
        case 'last_login':
          cmp = (a.last_sign_in_at ?? '').localeCompare(b.last_sign_in_at ?? '')
          break
        case 'movements':
          cmp = a.transactions_count - b.transactions_count
          break
        case 'accounts':
          cmp = a.accounts_count - b.accounts_count
          break
      }
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sort])

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
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">
                  <SortHeader label={t('users.col_user')} active={sort.key === 'user'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'user', false))} />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortHeader label={t('users.col_plan')} active={sort.key === 'plan'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'plan', true))} />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortHeader label={t('users.col_joined')} active={sort.key === 'joined'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'joined', true))} />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortHeader label={t('users.col_last_login')} active={sort.key === 'last_login'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'last_login', true))} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader label={t('users.col_movements')} active={sort.key === 'movements'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'movements', true))} className="justify-end" />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortHeader label={t('users.col_accounts')} active={sort.key === 'accounts'} dir={sort.dir}
                    onClick={() => setSort((s) => nextSort(s, 'accounts', true))} className="justify-end" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr
                  key={u.user_id}
                  onClick={() => setSelected(u)}
                  className="cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50"
                >
                  <td className="min-w-0 max-w-xs px-4 py-3">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      {u.full_name || u.email.split('@')[0]}
                      {u.is_admin && <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                    </p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                    {!u.onboarding_completed && (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {t('users.pending')}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><PlanBadge plan={u.plan} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(u.created_at.slice(0, 10))}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {u.last_sign_in_at ? formatDate(u.last_sign_in_at.slice(0, 10)) : t('users.never_connected')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">{u.transactions_count}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">{u.accounts_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserDetailDialog user={selected} myUserId={myUserId} onClose={() => setSelected(null)} />
    </div>
  )
}

function UserDetailDialog({
  user, myUserId, onClose,
}: {
  user: AdminUserRow | null
  myUserId: string | null
  onClose: () => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data, isLoading } = useAdminUserActivity(user?.user_id ?? null)
  const setPlan = useAdminSetPlan()
  const deleteUser = useAdminDeleteUser()
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null)
  // 0 = cerrado, 1 = primer aviso, 2 = confirmación escribiendo "delete".
  const [deleteStep, setDeleteStep] = useState(0)
  const [deleteWord, setDeleteWord] = useState('')

  const monthMax = useMemo(() => Math.max(1, ...(data?.byMonth ?? []).map((m) => Number(m.total_abs))), [data])
  const canConfirmDelete = deleteWord.trim().toLowerCase() === DELETE_WORD

  async function confirmPlanChange() {
    if (!user || !pendingPlan) return
    try {
      await setPlan.mutateAsync({ userId: user.user_id, plan: pendingPlan })
      toast({ variant: 'success', title: t('users.plan_changed', { plan: tc(`plan.name.${pendingPlan}`) }) })
    } catch (err: any) {
      toast({ variant: 'destructive', title: tc('errors.save_failed'), description: err?.message })
    }
    setPendingPlan(null)
  }

  function closeDelete() {
    if (deleteUser.isPending) return
    setDeleteStep(0)
    setDeleteWord('')
  }

  async function confirmDelete() {
    if (!user || !canConfirmDelete) return
    try {
      await deleteUser.mutateAsync(user.user_id)
      setDeleteStep(0)
      setDeleteWord('')
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('users.delete.error'), description: err?.message })
    }
  }

  return (
    <>
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

            {/* Plan de suscripción */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-500">{t('users.plan')}</span>
              <Select value={user.plan} onValueChange={(v) => v !== user.plan && setPendingPlan(v as PlanType)}>
                <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>{tc(`plan.name.${p}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Zona de peligro */}
            {user.user_id !== myUserId && (
              <button
                onClick={() => setDeleteStep(1)}
                className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-rose-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-rose-600">{t('users.delete.title')}</span>
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Confirmación del borrado de usuario (aviso 1: irreversibilidad) */}
    <Dialog open={deleteStep === 1} onOpenChange={(o) => !o && closeDelete()}>
      <DialogContent className="rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            {t('users.delete.warn1.title')}
          </DialogTitle>
          <DialogDescription>
            {t('users.delete.warn1.body', { name: user?.full_name || user?.email })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeDelete}>{t('users.delete.cancel')}</Button>
          <Button variant="destructive" onClick={() => setDeleteStep(2)}>{t('users.delete.continue')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmación del borrado de usuario (aviso 2: escribir "delete") */}
    <Dialog open={deleteStep === 2} onOpenChange={(o) => !o && closeDelete()}>
      <DialogContent className="rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            {t('users.delete.warn2.title')}
          </DialogTitle>
          <DialogDescription>
            {t('users.delete.warn2.body', { name: user?.full_name || user?.email })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <p className="text-sm text-slate-600">
            {t('users.delete.warn2.prompt')}{' '}
            <span className="font-mono font-bold text-rose-600">{DELETE_WORD}</span>
          </p>
          <Input
            value={deleteWord}
            onChange={(e) => setDeleteWord(e.target.value)}
            placeholder={DELETE_WORD}
            autoComplete="off"
            className={cn('font-mono', canConfirmDelete && 'border-rose-400')}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeDelete} disabled={deleteUser.isPending}>{t('users.delete.cancel')}</Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={!canConfirmDelete || deleteUser.isPending}>
            {deleteUser.isPending ? t('users.delete.deleting') : t('users.delete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmación del cambio de plan (diálogo hermano, no anidado) */}
    <Dialog open={!!pendingPlan} onOpenChange={(o) => !o && setPendingPlan(null)}>
      <DialogContent className="sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('users.plan_confirm_title')}</DialogTitle>
          <DialogDescription>
            {t('users.plan_confirm_body', { name: user?.full_name || user?.email, plan: pendingPlan ? tc(`plan.name.${pendingPlan}`) : '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPendingPlan(null)} disabled={setPlan.isPending}>{tc('actions.cancel')}</Button>
          <Button onClick={confirmPlanChange} disabled={setPlan.isPending}>
            {setPlan.isPending ? tc('actions.loading') : tc('actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
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

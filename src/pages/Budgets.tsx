import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useCategoryGroups, useCategories } from '@/hooks/useCategories'
import { useBudgetRules, useBudgetCategoryOrder } from '@/hooks/useBudgets'
import { useDashboardBreakdown } from '@/hooks/useTransactions'
import { bucketKey, bucketRange, prevPeriodKey, nextPeriodKey, type Granularity } from '@/lib/periods'
import {
  addMonths, buildEnvelopeSummaries, buildSingleEnvelopeSummary, daysInMonth,
  daysRemainingInPeriod, inactiveEnvelopeGroups, isCurrentPeriod, monthKey, monthsBetween,
  pickReferenceMonth, totalsFromSummaries,
} from '@/lib/budgets'
import { categoryIcon } from '@/lib/categoryIcons'
import { BudgetSummaryCard } from '@/components/budgets/BudgetSummaryCard'
import { EnvelopeRow } from '@/components/budgets/EnvelopeRow'
import { EnvelopeDetailDialog } from '@/components/budgets/EnvelopeDetailDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { CategoryGroup } from '@/lib/database.types'

const GRANULARITIES: Granularity[] = ['month', 'quarter', 'year']

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function periodLabel(key: string, g: Granularity, lang: string): string {
  if (g === 'year') return key
  if (g === 'quarter') {
    const [y, q] = key.split('-Q')
    return lang === 'en' ? `Q${q} ${y}` : `${q}T ${y}`
  }
  const [y, m] = key.split('-')
  const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function monthLabel(month: string, lang: string): string {
  const [y, m] = month.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function Budgets() {
  const { t, i18n } = useTranslation('budgets')
  const { t: tc } = useTranslation('categories')
  const { activeProfile } = useProfile()
  const profileId = activeProfile?.id

  const todayMonth = useMemo(() => monthKey(), [])
  const [granularity, setGranularity] = useState<Granularity>('month')
  const [periodKey, setPeriodKey] = useState(() => bucketKey(todayDateStr(), 'month'))
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [pendingGroup, setPendingGroup] = useState<CategoryGroup | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  function handleGranularityChange(g: Granularity) {
    setGranularity(g)
    setPeriodKey(bucketKey(todayDateStr(), g))
  }

  const range = useMemo(() => bucketRange(periodKey, granularity), [periodKey, granularity])
  const periodMonths = useMemo(
    () => monthsBetween(`${range.from.slice(0, 7)}-01`, `${range.to.slice(0, 7)}-01`),
    [range],
  )
  const referenceMonth = useMemo(() => pickReferenceMonth(periodMonths, todayMonth), [periodMonths, todayMonth])
  const editingRange = useMemo(() => ({
    from: referenceMonth,
    to: `${referenceMonth.slice(0, 7)}-${String(daysInMonth(referenceMonth)).padStart(2, '0')}`,
  }), [referenceMonth])

  const { data: groups = [] } = useCategoryGroups()
  const { data: categories = [] } = useCategories()
  const { data: rules = [] } = useBudgetRules(profileId)
  const { data: categoryOrderRows = [] } = useBudgetCategoryOrder(profileId)
  const categoryOrder = useMemo(
    () => new Map(categoryOrderRows.map(r => [r.category_id, r.sort_order])),
    [categoryOrderRows],
  )

  const breakdownRange = useMemo(() => {
    const earliestMonth = [periodMonths[0], addMonths(todayMonth, -11), addMonths(referenceMonth, -6)].sort()[0]
    const latestMonth = [periodMonths[periodMonths.length - 1], todayMonth].sort().slice(-1)[0]
    return { from: earliestMonth, to: `${latestMonth.slice(0, 7)}-${String(daysInMonth(latestMonth)).padStart(2, '0')}` }
  }, [periodMonths, todayMonth, referenceMonth])
  const { data: breakdown = [], isLoading: breakdownLoading } = useDashboardBreakdown(profileId, breakdownRange)

  const buildParams = { groups, categories, rules, breakdown, todayMonth, categoryOrder }

  const summaries = useMemo(
    () => buildEnvelopeSummaries({ ...buildParams, periodMonths, referenceMonth, range }),
    [groups, categories, rules, breakdown, periodMonths, referenceMonth, range, todayMonth, categoryOrder],
  )
  const totals = useMemo(() => totalsFromSummaries(summaries), [summaries])
  const daysRemaining = daysRemainingInPeriod(range)
  const currentPeriod = isCurrentPeriod(range)

  const monthlyHistory = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) months.push(addMonths(todayMonth, -i))
    return months.map(m => ({
      month: m,
      spent: summaries.reduce(
        (s, env) => s + env.subcategories.reduce((s2, sub) => s2 + (sub.history12.find(h => h.month === m)?.spent ?? 0), 0),
        0,
      ),
    }))
  }, [summaries, todayMonth])

  const inactiveGroups = useMemo(() => inactiveEnvelopeGroups(groups, summaries), [groups, summaries])

  const openGroup = summaries.find(s => s.group.id === openGroupId)
  const activeGroup = openGroup?.group ?? pendingGroup
  const editSummary = useMemo(() => {
    if (!activeGroup) return null
    return buildSingleEnvelopeSummary(activeGroup, { ...buildParams, periodMonths: [referenceMonth], referenceMonth, range: editingRange })
  }, [activeGroup, groups, categories, rules, breakdown, referenceMonth, editingRange, todayMonth, categoryOrder])
  const pendingSummary = useMemo(() => {
    if (!pendingGroup) return null
    return buildSingleEnvelopeSummary(pendingGroup, { ...buildParams, periodMonths, referenceMonth, range })
  }, [pendingGroup, groups, categories, rules, breakdown, periodMonths, referenceMonth, range, todayMonth, categoryOrder])

  const dialogGroup = openGroup ?? pendingSummary
  const loading = !profileId || breakdownLoading

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <div className="inline-flex rounded-lg border p-0.5 text-sm">
            {GRANULARITIES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => handleGranularityChange(g)}
                className={`rounded-md px-3 py-1 transition-colors ${granularity === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t(`granularity.${g}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
            <button type="button" onClick={() => setPeriodKey(k => prevPeriodKey(k, granularity))} aria-label={t('month_nav.prev')} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[110px] px-2 text-center text-sm font-semibold text-slate-800">{periodLabel(periodKey, granularity, i18n.language)}</span>
            <button type="button" onClick={() => setPeriodKey(k => nextPeriodKey(k, granularity))} aria-label={t('month_nav.next')} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        ) : (
          <BudgetSummaryCard
            budgeted={totals.budgeted}
            spent={totals.spent}
            available={totals.available}
            projection={totals.projection}
            vsBudget={totals.vsBudget}
            daysRemaining={daysRemaining}
            isCurrentPeriod={currentPeriod}
            monthlyHistory={monthlyHistory}
          />
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-800">{t('envelopes.title')}</h2>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 rounded-full">
            <Plus className="h-3.5 w-3.5" />
            {t('add_envelope.button')}
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : summaries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">{t('envelopes.empty')}</p>
          ) : (
            summaries.map(summary => (
              <EnvelopeRow key={summary.group.id} summary={summary} onClick={() => setOpenGroupId(summary.group.id)} />
            ))
          )}
        </div>
      </div>

      {dialogGroup && editSummary && profileId && (
        <EnvelopeDetailDialog
          open={!!dialogGroup}
          onOpenChange={open => { if (!open) { setOpenGroupId(null); setPendingGroup(null) } }}
          groupLabel={tc(`category_group.${dialogGroup.group.slug}`)}
          groupColor={dialogGroup.group.color ?? '#64748b'}
          periodSubcategories={dialogGroup.subcategories}
          editSubcategories={editSummary.subcategories}
          profileId={profileId}
          editingMonthLabel={granularity !== 'month' ? monthLabel(referenceMonth, i18n.language) : undefined}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('add_envelope.title')}</DialogTitle>
          </DialogHeader>
          {inactiveGroups.length === 0 ? (
            <p className="text-sm text-slate-500">{t('add_envelope.empty')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {inactiveGroups.map(group => {
                const Icon = categoryIcon(group.icon)
                const color = group.color ?? '#64748b'
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => { setAddOpen(false); setPendingGroup(group) }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1f` }}>
                      <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
                    </span>
                    <span className="font-medium text-slate-800">{tc(`category_group.${group.slug}`)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { fmtAmount } from '@/components/ui/amount-split'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { BudgetAmountSlider } from './BudgetAmountSlider'
import { toast } from '@/hooks/useToast'
import { useUpsertBudgetRule, useUpsertBudgetOverride, useDeleteBudgetOverride } from '@/hooks/useBudgets'
import { budgetStatusColor, type SubcategoryBudget } from '@/lib/budgets'
import type { BudgetOverride } from '@/lib/database.types'
import { cn } from '@/lib/utils'

interface EnvelopeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupLabel: string
  groupColor: string
  /** Subcategorías con los totales del PERIODO visualizado (mes/trimestre/año): para los textos y el histórico. */
  periodSubcategories: SubcategoryBudget[]
  /** Subcategorías con el importe del MES concreto que se edita (el marcador siempre edita a nivel mensual). */
  editSubcategories: SubcategoryBudget[]
  /** Excepciones puntuales YA filtradas al mes que se edita. */
  overridesByCategory: Map<string, BudgetOverride>
  profileId: string
  referenceMonth: string
  /** Etiqueta del mes que se edita; se muestra solo si el periodo visualizado no es "mes". */
  editingMonthLabel?: string
}

function fmtCompact(n: number): string {
  return `${Math.round(n)}€`
}

// Franja limpia de 12 meses en 2 filas (mes / importe), sin tabla ni separadores.
// El color de cada importe compara ese mes contra `referenceAmount` (el
// presupuesto ACTUAL, que puede ser el valor que se está arrastrando en vivo).
function MonthAmountStrip({ history, referenceAmount, lang }: { history: { month: string; spent: number }[]; referenceAmount: number | null; lang: string }) {
  return (
    <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
      {history.map(h => {
        const [y, m] = h.month.split('-').map(Number)
        const label = new Date(y, m - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short' }).replace('.', '')
        return (
          <div key={h.month} className="flex w-10 shrink-0 flex-col items-center gap-0.5">
            <span className="text-[10px] capitalize text-slate-400">{label}</span>
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: budgetStatusColor(h.spent, referenceAmount) }}>
              {fmtCompact(h.spent)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SubcategoryEditor({
  periodSub, editSub, color, override, profileId, referenceMonth, lang,
}: {
  periodSub: SubcategoryBudget
  editSub: SubcategoryBudget
  color: string
  override: BudgetOverride | undefined
  profileId: string
  referenceMonth: string
  lang: string
}) {
  const { t } = useTranslation('budgets')
  const { t: tc } = useTranslation('common')
  const [overrideMode, setOverrideMode] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [liveAmount, setLiveAmount] = useState<number | null>(null)
  const Icon = categoryIcon(periodSub.category.icon)
  const editAmount = editSub.budgeted ?? 0
  const displayAmount = liveAmount ?? editAmount
  const upsertRule = useUpsertBudgetRule()
  const upsertOverride = useUpsertBudgetOverride()
  const deleteOverride = useDeleteBudgetOverride()

  async function handleCommit(newAmount: number) {
    try {
      if (override || overrideMode) {
        await upsertOverride.mutateAsync({ profile_id: profileId, category_id: editSub.category.id, month: referenceMonth, amount: newAmount })
      } else {
        await upsertRule.mutateAsync({ profile_id: profileId, category_id: editSub.category.id, amount: newAmount })
      }
      setOverrideMode(false)
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    } finally {
      setLiveAmount(null)
    }
  }

  async function handleResetOverride() {
    if (!override) return
    try {
      await deleteOverride.mutateAsync({ id: override.id, profileId })
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1f` }}>
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{categoryLabel(periodSub.category.slug)}</p>
          <p className="truncate text-xs text-slate-500">
            {periodSub.budgeted
              ? t('detail.subtitle_spent', { spent: fmtAmount(periodSub.spent), budgeted: fmtAmount(periodSub.budgeted) })
              : `${fmtAmount(periodSub.spent)} · ${t('detail.subtitle_no_budget')}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-800">{editAmount > 0 ? fmtAmount(editAmount) : '—'}</p>
          {editSub.isProposed && editAmount > 0 && <p className="text-[10px] text-slate-400">{t('detail.proposed_badge')}</p>}
        </div>
      </div>

      <div className="mt-3">
        <BudgetAmountSlider spent={editSub.spent} amount={editAmount} onCommit={handleCommit} onDrag={setLiveAmount} color={color} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button type="button" onClick={() => setShowHistory(v => !v)} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700">
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showHistory && 'rotate-180')} />
          {t('detail.history_toggle')}
        </button>

        {override ? (
          <button type="button" onClick={handleResetOverride} className="inline-flex items-center gap-1 font-medium text-[var(--brand-primary)] hover:underline">
            <RotateCcw className="h-3.5 w-3.5" />
            {t('detail.reset_override')}
          </button>
        ) : (
          <label className="inline-flex items-center gap-1.5 text-slate-500">
            <input type="checkbox" checked={overrideMode} onChange={e => setOverrideMode(e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300" />
            {t('detail.override_toggle')}
          </label>
        )}
      </div>

      {overrideMode && !override && <p className="mt-1 text-[11px] text-slate-400">{t('detail.override_hint')}</p>}
      {showHistory && <MonthAmountStrip history={periodSub.history12} referenceAmount={displayAmount} lang={lang} />}
    </div>
  )
}

export function EnvelopeDetailDialog({
  open, onOpenChange, groupLabel, groupColor, periodSubcategories, editSubcategories, overridesByCategory, profileId, referenceMonth, editingMonthLabel,
}: EnvelopeDetailDialogProps) {
  const { t, i18n } = useTranslation('budgets')
  const [showGroupHistory, setShowGroupHistory] = useState(false)

  const groupHistory = periodSubcategories[0]?.history12.map((_, i) => ({
    month: periodSubcategories[0].history12[i].month,
    spent: periodSubcategories.reduce((s, sub) => s + (sub.history12[i]?.spent ?? 0), 0),
  })) ?? []
  const groupBudgetedNow = editSubcategories.reduce((s, sub) => s + (sub.budgeted ?? 0), 0)
  const editByCategory = new Map(editSubcategories.map(s => [s.category.id, s]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{groupLabel}</DialogTitle>
          {editingMonthLabel && <p className="text-xs font-medium text-slate-500">{t('detail.editing_month', { month: editingMonthLabel })}</p>}
        </DialogHeader>

        {groupHistory.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowGroupHistory(v => !v)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showGroupHistory && 'rotate-180')} />
              {t('detail.history_toggle')}
            </button>
            {showGroupHistory && <MonthAmountStrip history={groupHistory} referenceAmount={groupBudgetedNow} lang={i18n.language} />}
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {periodSubcategories.map((periodSub, i) => {
            const editSub = editByCategory.get(periodSub.category.id)
            if (!editSub) return null
            return (
              <div key={periodSub.category.id}>
                {i > 0 && <Separator className="-mx-6 w-auto bg-slate-100" />}
                <SubcategoryEditor
                  periodSub={periodSub}
                  editSub={editSub}
                  color={groupColor}
                  override={overridesByCategory.get(periodSub.category.id)}
                  profileId={profileId}
                  referenceMonth={referenceMonth}
                  lang={i18n.language}
                />
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

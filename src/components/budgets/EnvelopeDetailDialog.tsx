import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fmtAmount } from '@/components/ui/amount-split'
import { categoryIcon, categoryLabel } from '@/lib/categoryIcons'
import { BudgetAmountSlider } from './BudgetAmountSlider'
import { toast } from '@/hooks/useToast'
import { useUpsertBudgetRule, useReorderBudgetCategories } from '@/hooks/useBudgets'
import { budgetStatusColor, type SubcategoryBudget } from '@/lib/budgets'
import { cn } from '@/lib/utils'

interface EnvelopeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupLabel: string
  groupColor: string
  /** Subcategorías con los totales del PERIODO visualizado (mes/trimestre/año): para los textos, el orden y el histórico. */
  periodSubcategories: SubcategoryBudget[]
  /** Subcategorías con el importe del MES concreto que se edita (el marcador siempre edita a nivel mensual). */
  editSubcategories: SubcategoryBudget[]
  profileId: string
  /** Etiqueta del mes que se edita; se muestra solo si el periodo visualizado no es "mes". */
  editingMonthLabel?: string
}

function fmtCompact(n: number): string {
  return `${Math.round(n)}€`
}

// Franja limpia de 12 meses en 2 filas (mes / importe), a todo el ancho
// disponible. El color de cada importe compara ese mes contra `referenceAmount`
// (el presupuesto ACTUAL, que puede ser el valor que se está arrastrando en vivo).
function MonthAmountStrip({ history, referenceAmount, lang }: { history: { month: string; spent: number }[]; referenceAmount: number | null; lang: string }) {
  return (
    <div className="mt-2 flex gap-1">
      {history.map(h => {
        const [y, m] = h.month.split('-').map(Number)
        const label = new Date(y, m - 1, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short' }).replace('.', '')
        return (
          <div key={h.month} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
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

// Reordena una lista arrastrando por un "grip": al pasar el punto medio de la
// fila vecina se intercambian posiciones (sin necesidad de medir cada fila con
// precisión de píxel). Confirma con `onCommit` al soltar.
function useDragReorder<T>(items: T[], keyOf: (item: T) => string, rowHeight: number, onCommit: (orderedKeys: string[]) => void) {
  const [order, setOrder] = useState(items)
  useEffect(() => { setOrder(items) }, [items])
  const draggingKeyRef = useRef<string | null>(null)
  const startYRef = useRef(0)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  function startDrag(e: React.PointerEvent<HTMLElement>, key: string) {
    draggingKeyRef.current = key
    startYRef.current = e.clientY
    setDraggingKey(key)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    if (!draggingKeyRef.current) return
    const delta = e.clientY - startYRef.current
    if (Math.abs(delta) < rowHeight / 2) return
    const shift = delta > 0 ? 1 : -1
    setOrder(prev => {
      const idx = prev.findIndex(i => keyOf(i) === draggingKeyRef.current)
      const newIdx = idx + shift
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(idx, 1)
      next.splice(newIdx, 0, moved)
      return next
    })
    startYRef.current = e.clientY
  }
  function endDrag(e: React.PointerEvent<HTMLElement>) {
    if (!draggingKeyRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingKeyRef.current = null
    setDraggingKey(null)
    onCommit(order.map(keyOf))
  }

  return { order, draggingKey, startDrag, moveDrag, endDrag }
}

function SubcategoryEditor({
  periodSub, editSub, color, profileId, isDragging, onDragStart, onDragMove, onDragEnd, lang,
}: {
  periodSub: SubcategoryBudget
  editSub: SubcategoryBudget
  color: string
  profileId: string
  isDragging: boolean
  onDragStart: (e: React.PointerEvent<HTMLElement>) => void
  onDragMove: (e: React.PointerEvent<HTMLElement>) => void
  onDragEnd: (e: React.PointerEvent<HTMLElement>) => void
  lang: string
}) {
  const { t } = useTranslation('budgets')
  const { t: tc } = useTranslation('common')
  const [showHistory, setShowHistory] = useState(false)
  const [liveAmount, setLiveAmount] = useState<number | null>(null)
  const Icon = categoryIcon(periodSub.category.icon)
  const editAmount = editSub.budgeted ?? 0
  const displayAmount = liveAmount ?? editAmount
  const over = displayAmount > 0 && editSub.spent > displayAmount
  const upsertRule = useUpsertBudgetRule()

  async function handleCommit(newAmount: number) {
    try {
      await upsertRule.mutateAsync({ profile_id: profileId, category_id: editSub.category.id, amount: newAmount })
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    } finally {
      setLiveAmount(null)
    }
  }

  return (
    <div className={cn(
      'rounded-2xl border bg-white p-4 transition-shadow',
      over ? 'border-2 border-[#DC2626]' : 'border-slate-200',
      isDragging && 'shadow-lg ring-2 ring-slate-300',
    )}>
      <div className="flex items-center gap-2">
        <span
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          style={{ touchAction: 'none' }}
          className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-slate-300 hover:text-slate-400 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
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
          <p className="text-sm font-bold tabular-nums text-slate-800">{displayAmount > 0 ? fmtAmount(displayAmount) : '—'}</p>
          {editSub.isProposed && liveAmount == null && editAmount > 0 && <p className="text-[10px] text-slate-400">{t('detail.proposed_badge')}</p>}
        </div>
      </div>

      <div className="mt-3">
        <BudgetAmountSlider spent={editSub.spent} amount={editAmount} onCommit={handleCommit} onDrag={setLiveAmount} color={color} />
      </div>

      <button type="button" onClick={() => setShowHistory(v => !v)} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showHistory && 'rotate-180')} />
        {t('detail.history_toggle')}
      </button>

      {showHistory && <MonthAmountStrip history={periodSub.history12} referenceAmount={displayAmount} lang={lang} />}
    </div>
  )
}

export function EnvelopeDetailDialog({
  open, onOpenChange, groupLabel, groupColor, periodSubcategories, editSubcategories, profileId, editingMonthLabel,
}: EnvelopeDetailDialogProps) {
  const { t, i18n } = useTranslation('budgets')
  const reorder = useReorderBudgetCategories()

  const { order, draggingKey, startDrag, moveDrag, endDrag } = useDragReorder(
    periodSubcategories,
    s => s.category.id,
    140,
    categoryIds => reorder.mutate({ profile_id: profileId, categoryIds }),
  )

  const groupHistory = periodSubcategories[0]?.history12.map((_, i) => ({
    month: periodSubcategories[0].history12[i].month,
    spent: periodSubcategories.reduce((s, sub) => s + (sub.history12[i]?.spent ?? 0), 0),
  })) ?? []
  const groupBudgetedNow = editSubcategories.reduce((s, sub) => s + (sub.budgeted ?? 0), 0)
  const editByCategory = new Map(editSubcategories.map(s => [s.category.id, s]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{groupLabel}</DialogTitle>
          {editingMonthLabel && <p className="text-xs font-medium text-slate-500">{t('detail.editing_month', { month: editingMonthLabel })}</p>}
        </DialogHeader>

        {groupHistory.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500">{t('detail.history_toggle')}</p>
            <MonthAmountStrip history={groupHistory} referenceAmount={groupBudgetedNow} lang={i18n.language} />
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {order.map(periodSub => {
            const editSub = editByCategory.get(periodSub.category.id)
            if (!editSub) return null
            return (
              <SubcategoryEditor
                key={periodSub.category.id}
                periodSub={periodSub}
                editSub={editSub}
                color={groupColor}
                profileId={profileId}
                isDragging={draggingKey === periodSub.category.id}
                onDragStart={e => startDrag(e, periodSub.category.id)}
                onDragMove={moveDrag}
                onDragEnd={endDrag}
                lang={i18n.language}
              />
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

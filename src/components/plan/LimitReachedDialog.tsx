import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { daysUntilReset, MONTHLY_DIMENSIONS, type LimitDimension } from '@/lib/plan'
import type { PlanType } from '@/lib/database.types'

interface LimitReachedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimension: LimitDimension
  plan: PlanType
  limit: number
}

/** Bloqueo duro reutilizable: se dispara cuando una alta supera el tope del plan. */
export function LimitReachedDialog({ open, onOpenChange, dimension, plan, limit }: LimitReachedDialogProps) {
  const { t } = useTranslation('common')
  const isMonthly = MONTHLY_DIMENSIONS.has(dimension)
  const days = daysUntilReset()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="break-words">{t('plan.limit_reached.title')}</DialogTitle>
          <DialogDescription className="break-words">
            {t(`plan.limit_reached.${dimension}`, { plan: t(`plan.name.${plan}`), limit })}
            {isMonthly && (
              <>
                {' '}
                {days === 1
                  ? t('plan.limit_reached.reset_hint_one')
                  : t('plan.limit_reached.reset_hint', { days })}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

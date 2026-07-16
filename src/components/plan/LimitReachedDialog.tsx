import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { daysUntilReset, MONTHLY_DIMENSIONS, type LimitDimension } from '@/lib/plan'
import type { PlanType } from '@/lib/database.types'
import { UpgradePlanDialog } from './UpgradePlanDialog'

interface LimitReachedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimension: LimitDimension
  plan: PlanType
  limit: number
}

/**
 * Bloqueo duro reutilizable: se dispara cuando una alta supera el tope del
 * plan. El botón cierra este aviso y abre el popup real de "Mejorar plan".
 */
export function LimitReachedDialog({ open, onOpenChange, dimension, plan, limit }: LimitReachedDialogProps) {
  const { t } = useTranslation('common')
  const isMonthly = MONTHLY_DIMENSIONS.has(dimension)
  const days = daysUntilReset()
  const [comparePlansOpen, setComparePlansOpen] = useState(false)
  // "Cuentas" tiene título específico; el resto de dimensiones usa el genérico.
  const title = dimension === 'accounts' ? t('plan.limit_reached.title_accounts') : t('plan.limit_reached.title')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="break-words">{title}</DialogTitle>
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
            <Button onClick={() => { onOpenChange(false); setComparePlansOpen(true) }}>{t('plan.limit_reached.cta_upgrade')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradePlanDialog open={comparePlansOpen} onOpenChange={setComparePlansOpen} />
    </>
  )
}

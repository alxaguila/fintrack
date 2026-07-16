import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UpgradeHintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
}

/**
 * Aviso de función exclusiva de un plan superior (p. ej. más histórico del
 * Dashboard). A diferencia de `LimitReachedDialog` (tope de uso alcanzado),
 * este es un teaser de una función bloqueada por el plan, sin contador.
 * Placeholder hasta que exista la pantalla de planes real (Fase 2).
 */
export function UpgradeHintDialog({ open, onOpenChange, title, description }: UpgradeHintDialogProps) {
  const { t } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="break-words">{title}</DialogTitle>
          <DialogDescription className="break-words">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

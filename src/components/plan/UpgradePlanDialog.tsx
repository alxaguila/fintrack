import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BRAND, BrandMark } from '@/components/landing/brand'
import { PricingCards } from '@/components/landing/PricingCards'

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Popup de "Mejorar plan" desde el sidebar (solo FREE). Reutiliza las mismas
 * tarjetas de la landing con la estética navy de marca; PRO/PREMIUM van sin
 * CTA activa porque aún no hay pasarela de pago (fase pendiente).
 */
export function UpgradePlanDialog({ open, onOpenChange }: UpgradePlanDialogProps) {
  const { t } = useTranslation('common')
  const [annual, setAnnual] = useState(true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] w-full gap-0 overflow-y-auto border-0 p-0 sm:max-w-6xl sm:rounded-2xl"
        style={{ background: BRAND.cream, fontFamily: BRAND.sans }}
      >
        {/* Cabecera navy */}
        <div style={{ background: BRAND.ink, padding: '26px 30px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -80, top: -90, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.3),transparent 70%)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={26} />
            <span style={{ font: `600 18px ${BRAND.display}`, letterSpacing: '-.03em', color: '#fff' }}>fintrack</span>
          </div>
          <DialogTitle asChild>
            <h2 style={{ position: 'relative', margin: '16px 0 0', font: `500 28px ${BRAND.display}`, letterSpacing: '-.025em', color: '#EAF4FA' }}>{t('upgrade_dialog.title')}</h2>
          </DialogTitle>
          <DialogDescription asChild>
            <p style={{ position: 'relative', margin: '6px 0 0', maxWidth: 560, font: `400 14.5px/1.5 ${BRAND.sans}`, color: '#9FBAC9' }}>{t('upgrade_dialog.subtitle')}</p>
          </DialogDescription>
        </div>

        {/* Cuerpo: toggle + tarjetas */}
        <div style={{ padding: '30px 24px 34px' }}>
          <PricingCards annual={annual} onAnnualChange={setAnnual} variant="upgrade" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

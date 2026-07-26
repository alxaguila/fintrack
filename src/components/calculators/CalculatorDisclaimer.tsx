import { useTranslation } from 'react-i18next'
import { BRAND } from '@/components/landing/brand'

// Igual que renderInline/renderDisclaimer de BlogDocument: el tramo
// **marcado** del texto i18n se convierte en el link al Aviso Legal.
function renderWithLink(text: string, href: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <a key={i} href={href} style={{ color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}>{part.slice(2, -2)}</a>
      : <span key={i}>{part}</span>
  )
}

/**
 * Disclaimer legal breve para cualquier calculadora financiera (colocar
 * debajo del bloque de resultados). El texto viene de
 * calculators.json → common.disclaimer (es/en), con el link al Aviso Legal
 * marcado como **texto**.
 */
export function CalculatorDisclaimer() {
  const { t } = useTranslation('calculators')

  return (
    <div style={{ padding: '12px 16px', borderRadius: 14, background: '#F0ECE2', font: `400 12.5px/1.6 ${BRAND.sans}`, color: '#75828E' }}>
      {renderWithLink(t('common.disclaimer'), '/aviso-legal')}
    </div>
  )
}

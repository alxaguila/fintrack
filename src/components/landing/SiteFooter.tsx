import { useTranslation } from 'react-i18next'
import { BRAND, BrandMark } from './brand'

// Estilos propios (no dependen del <style> de Landing) para que el footer
// funcione igual de bien insertado en cualquier página nueva.
const STYLE = `
.ftf-foot a{color:#586470;transition:color .2s ease}
.ftf-foot a:hover{color:${BRAND.ink}}
.ftf-grid{grid-template-columns:1.4fr 1fr 1fr 1fr}
@media (max-width:1024px){.ftf-grid{grid-template-columns:repeat(3,1fr)!important}}
@media (max-width:768px){.ftf-grid{grid-template-columns:repeat(2,1fr)!important;gap:24px!important}}
@media (max-width:520px){.ftf-grid{grid-template-columns:1fr!important}}
`

/**
 * Footer compartido por toda la puerta de entrada (landing, páginas legales
 * y cualquier pantalla pública futura). Los anchors a secciones de la landing
 * (`/#producto`...) funcionan también estando ya en "/": el navegador solo
 * actualiza el hash y hace scroll, sin recarga.
 */
export function SiteFooter() {
  const { t } = useTranslation('landing')

  return (
    <footer className="ftf-foot" style={{ borderTop: '1px solid #E3DCCE', background: BRAND.cream }}>
      <style>{STYLE}</style>
      <div style={{ maxWidth: 1408, margin: '0 auto', padding: '56px 34px 28px', boxSizing: 'border-box' }}>
        <div className="ftf-grid" style={{ display: 'grid', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <BrandMark size={28} /><span style={{ font: `600 21px ${BRAND.wordmark}`, letterSpacing: '-.03em', color: BRAND.ink }}>zafyros</span>
            </div>
            <p style={{ margin: '16px 0 0', maxWidth: 240, font: `400 14px/1.6 ${BRAND.sans}`, color: '#586470' }}>{t('footer.tagline')}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, font: `400 14px ${BRAND.sans}`, color: '#586470' }}>
            <a href="/#producto">{t('nav.product')}</a>
            <a href="/#seguridad">{t('nav.security')}</a>
            <a href="/#precios">{t('nav.pricing')}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, font: `400 14px ${BRAND.sans}`, color: '#586470' }}>
            <span>{t('footer.blog')}</span>
            <span>{t('footer.calculators')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, font: `400 14px ${BRAND.sans}`, color: '#586470' }}>
            <a href="/aviso-legal">{t('footer.legalNotice')}</a>
            <a href="/privacidad">{t('footer.privacy')}</a>
            <a href="/cookies">{t('footer.cookies')}</a>
            <a href="/terminos">{t('footer.terms')}</a>
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #E3DCCE', font: `400 13px ${BRAND.sans}`, color: '#93A1AB' }}>{t('footer.copy')}</div>
      </div>
    </footer>
  )
}

import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BRAND, BrandMark } from './brand'

// Estilos propios (no dependen del <style> de Landing) para que el header
// funcione igual de bien insertado en cualquier página nueva.
const STYLE = `
.fts-nlink{transition:color .2s ease}
.fts-nlink:hover{color:#fff}
.fts-cta{transition:background .2s ease}
.fts-cta:hover{background:#EAF4FA!important}
@media (max-width:520px){.fts-cta{display:none!important}}
`

/**
 * Alto total a reservar (padding-top) en páginas de contenido que usan este
 * header siempre visible (sin hero debajo que lo oculte), para que no tape
 * el principio del contenido.
 */
export const SITE_HEADER_SPACE = 96

// Separación entre el viewport y la pastilla (arriba/izq/dcha), igual que el
// margen exterior del hero.
const TOP_OFFSET = 14

type Props = {
  /** Controla la aparición con transición (usado por Landing al hacer scroll
   *  pasado el hero). Páginas sin hero deben dejarlo en `true` (por defecto):
   *  el header queda fijo y siempre visible. */
  visible?: boolean
  /** Por defecto navega a "/". En Landing se sobreescribe con scroll-to-top. */
  onLogoClick?: () => void
  /** Por defecto navega a "/?login=1" (abre el popup de login en la landing). */
  onLogin?: () => void
  /** Por defecto navega a "/register". */
  onRegister?: () => void
  /** Color de fondo de la página, para tapar el hueco alrededor de la pastilla
   *  (arriba/izq/dcha) y que no se vea el contenido pasando por detrás al hacer
   *  scroll. Por defecto el crema de la landing/páginas legales. */
  pageBackground?: string
}

/**
 * Header fijo compartido por toda la puerta de entrada (landing, registro,
 * páginas legales y cualquier pantalla pública futura): misma barra navy
 * redondeada con foco de luz que el hero — mismo ancho, radio y gradientes —
 * para que la identidad visual sea consistente en toda la web de marketing.
 */
export function SiteHeader({ visible = true, onLogoClick, onLogin, onRegister, pageBackground = BRAND.cream }: Props) {
  const { t, i18n } = useTranslation('landing')
  const navigate = useNavigate()
  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'

  const setLang = (next: 'es' | 'en') => {
    if (next === lang) return
    i18n.changeLanguage(next)
    localStorage.setItem('fintrack_language', next)
  }

  const segBase: React.CSSProperties = { font: `600 12px ${BRAND.sans}`, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', border: 'none' }
  const langOn = { background: '#fff', color: BRAND.ink }
  const langOff = { background: 'transparent', color: '#8FA9B8' }

  // Alto real de la pastilla (varía con el idioma/tamaño de fuente): se mide para
  // que el fondo de respaldo la cubra con precisión, sin números mágicos.
  const pillRef = useRef<HTMLDivElement>(null)
  const [pillHeight, setPillHeight] = useState(60)
  useLayoutEffect(() => {
    const el = pillRef.current
    if (!el) return
    const update = () => setPillHeight(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      {/* Fondo de respaldo: tapa el hueco alrededor de la pastilla (arriba/izq/dcha)
          para que no se vea el contenido pasando por detrás al hacer scroll. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 49,
          height: TOP_OFFSET + pillHeight + 6,
          background: pageBackground,
          opacity: visible ? 1 : 0,
          transition: 'opacity .3s ease',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed', top: TOP_OFFSET, left: TOP_OFFSET, right: TOP_OFFSET, zIndex: 50,
          transform: visible ? 'translateY(0)' : 'translateY(-140%)',
          opacity: visible ? 1 : 0,
          transition: 'transform .35s cubic-bezier(.2,.7,.2,1), opacity .3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <style>{STYLE}</style>
        <div ref={pillRef} style={{ position: 'relative', maxWidth: 1780, margin: '0 auto', background: BRAND.ink, borderRadius: 26, overflow: 'hidden', boxShadow: '0 14px 34px rgba(10,37,64,.28)' }}>
          {/* Foco de luz, igual que el hero */}
          <div style={{ position: 'absolute', right: -60, top: -70, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.34),transparent 66%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -50, bottom: -70, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,123,174,.3),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', gap: 16 }}>
          <button onClick={onLogoClick ?? (() => navigate('/'))} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer' }}>
            <BrandMark size={24} />
            <span style={{ font: `600 18px ${BRAND.display}`, letterSpacing: '-.03em', color: '#fff' }}>fintrack</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: 3 }}>
              <button onClick={() => setLang('es')} style={{ ...segBase, ...(lang === 'es' ? langOn : langOff) }}>ES</button>
              <button onClick={() => setLang('en')} style={{ ...segBase, ...(lang === 'en' ? langOn : langOff) }}>EN</button>
            </div>
            <button onClick={onLogin ?? (() => navigate('/?login=1'))} className="fts-nlink" style={{ font: `500 14px ${BRAND.sans}`, color: '#B7CDDA', background: 'none', border: 'none', cursor: 'pointer' }}>
              {t('nav.login')}
            </button>
            <button onClick={onRegister ?? (() => navigate('/register'))} className="fts-cta" style={{ background: '#fff', color: BRAND.ink, font: `600 14px ${BRAND.sans}`, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
              {t('nav.cta')}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

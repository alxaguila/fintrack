import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BRAND } from './brand'
import type { PlanType } from '@/lib/database.types'

interface PricingCardsProps {
  annual: boolean
  onAnnualChange: (annual: boolean) => void
  /** 'marketing' (landing, botones activos) o 'upgrade' (popup/página in-app: sin pasarela de pago todavía). */
  variant?: 'marketing' | 'upgrade'
  /** Solo relevante en 'upgrade': marca la tarjeta del plan que ya tiene el usuario. */
  currentPlan?: PlanType
  onFreeCta?: () => void
  onProCta?: () => void
}

const CSS = `
.ftpc-seg{transition:all .2s ease}
.ftpc-primary{transition:background .2s ease}
.ftpc-primary:hover{background:${BRAND.accentHover}!important}
.ftpc-ghost{transition:background .2s ease}
.ftpc-ghost:hover{background:#EAF4FA!important}
.ftpc-price-hint{display:none}
.ftpc-price-grid::-webkit-scrollbar{display:none}
@media (max-width:1024px){
  .ftpc-price-hint{display:block!important}
  .ftpc-price-grid{display:flex!important;max-width:none!important;margin:0 calc(var(--pc-bleed) * -1)!important;padding:10px var(--pc-bleed) 26px!important;gap:14px!important;align-items:stretch!important;overflow-x:auto!important;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .ftpc-price-grid>*{flex:0 0 86%;scroll-snap-align:center;scroll-snap-stop:always;opacity:.7;transform:scale(.95)!important;transition:transform .35s cubic-bezier(.2,.7,.2,1),opacity .35s ease}
  .ftpc-price-grid>.ftpc-p-on{opacity:1;transform:scale(1)!important}
}
@media (max-width:520px){
  .ftpc-price-grid>*{flex-basis:88%}
}
`

const accent = BRAND.accent

/**
 * Tarjetas FREE/PRO/PREMIUM con selector mensual/anual. Se usa tanto en la
 * landing (`variant="marketing"`) como en el popup de "Mejorar plan" dentro
 * de la app (`variant="upgrade"`). En desktop es un grid de 3 columnas; el
 * carrusel con scroll-snap solo se activa por media query en viewports
 * estrechos (móvil), nunca en escritorio.
 */
export function PricingCards({ annual, onAnnualChange, variant = 'marketing', currentPlan, onFreeCta, onProCta }: PricingCardsProps) {
  const { t, i18n } = useTranslation('landing')
  const priceRef = useRef<HTMLDivElement>(null)

  // Carrusel de planes en móvil. El swipe y el frenado los pone scroll-snap; aquí solo
  // arrancamos centrados en PRO y marcamos la tarjeta activa (clase por DOM en vez de
  // estado: el scroll dispara demasiado como para re-renderizar).
  useLayoutEffect(() => {
    const el = priceRef.current
    if (!el) return
    const cards = () => Array.from(el.children) as HTMLElement[]
    const scrolls = () => el.scrollWidth > el.clientWidth + 1

    const sync = () => {
      // En escritorio es un grid sin scroll: todas las tarjetas van a plena presencia.
      if (!scrolls()) return cards().forEach((c) => c.classList.add('ftpc-p-on'))
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      cards().forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
        if (dist < bestDist) { bestDist = dist; best = i }
      })
      cards().forEach((c, i) => c.classList.toggle('ftpc-p-on', i === best))
    }

    const centerPro = () => {
      if (!scrolls()) return
      const pro = el.children[1] as HTMLElement | undefined
      if (!pro) return
      el.scrollLeft = pro.offsetLeft + pro.offsetWidth / 2 - el.clientWidth / 2
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { raf = 0; sync() })
    }
    // Solo re-centramos al cruzar el breakpoint, nunca en `resize`: en móvil la barra de
    // URL lo dispara al hacer scroll y devolvería al usuario a PRO a la fuerza.
    const mq = window.matchMedia('(max-width:1024px)')
    const onBreakpoint = () => { centerPro(); sync() }

    centerPro()
    sync()
    el.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener('change', onBreakpoint)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', onBreakpoint)
    }
  }, [])

  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const money = (v: number) => (lang === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ','))
  const proPrice = money(annual ? 5.99 : 7.99)
  const premPrice = money(annual ? 14.99 : 19.99)

  const freeFeatures = t('pricing.free.features', { returnObjects: true }) as string[]
  const proFeatures = t('pricing.pro.features', { returnObjects: true }) as string[]
  const premFeatures = t('pricing.premium.features', { returnObjects: true }) as string[]

  const billBase: React.CSSProperties = {
    font: `600 14px ${BRAND.sans}`, padding: '9px 20px', borderRadius: 9, cursor: 'pointer', border: 'none',
    display: 'inline-flex', alignItems: 'center',
  }
  const billOn = { background: '#fff', color: BRAND.ink, boxShadow: '0 2px 8px rgba(10,37,64,.1)' }
  const billOff = { background: 'transparent', color: '#7B857E' }

  const check = (stroke: string) => (
    <svg width="16" height="16" viewBox="0 0 18 18" style={{ flex: 'none', marginTop: 2 }}>
      <path d="M4 9.5 L7.5 13 L14 5.5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const isUpgrade = variant === 'upgrade'
  // El carrusel móvil "sangra" hasta el borde del contenedor: el sangrado debe
  // coincidir con el padding horizontal real de cada consumidor (34px en la
  // landing, 24px en las pantallas in-app), o las tarjetas quedan cortadas.
  const bleed = isUpgrade ? 24 : 34
  const currentBoxStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', textAlign: 'center', borderRadius: 12, padding: '13px 0', font: `600 14.5px ${BRAND.sans}`,
  }

  return (
    <div style={{ fontFamily: BRAND.sans, ['--pc-bleed' as string]: `${bleed}px` }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 42 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EAE5DA', borderRadius: 12, padding: 4 }}>
          <button type="button" className="ftpc-seg" onClick={() => onAnnualChange(false)} style={{ ...billBase, ...(annual ? billOff : billOn) }}>{t('pricing.monthly')}</button>
          <button type="button" className="ftpc-seg" onClick={() => onAnnualChange(true)} style={{ ...billBase, ...(annual ? billOn : billOff) }}>
            {t('pricing.annual')}<span style={{ marginLeft: 7, font: `600 10px ${BRAND.sans}`, color: '#fff', background: accent, padding: '2px 7px', borderRadius: 20 }}>{t('pricing.save')}</span>
          </button>
        </div>
      </div>

      <div className="ftpc-price-hint" style={{ textAlign: 'center', margin: '-16px 0 20px', font: `500 13px ${BRAND.sans}`, color: '#8B98A2' }}>{t('pricing.swipeHint')}</div>

      <div ref={priceRef} className="ftpc-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 1080, margin: '0 auto', alignItems: 'start' }}>
        {/* FREE */}
        <div style={{ background: '#fff', border: `2px solid ${BRAND.ink}`, borderRadius: 22, padding: '32px 30px', boxShadow: '0 8px 30px rgba(10,37,64,.05)' }}>
          <div style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '.02em', color: BRAND.ink }}>{t('pricing.free.name')}</div>
          <div style={{ marginTop: 6, font: `400 14px ${BRAND.sans}`, color: '#8B98A2' }}>{t('pricing.free.desc')}</div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ font: `600 46px/1 ${BRAND.mono}`, color: BRAND.ink }}>€0</span>
            <span style={{ font: `400 14px ${BRAND.sans}`, color: '#94A3B8', paddingBottom: 8 }}>{t('pricing.forever')}</span>
          </div>
          {isUpgrade ? (
            currentPlan === 'free' && (
              <div style={{ ...currentBoxStyle, marginTop: 24, background: '#EDE9E1', color: '#7B857E' }}>{t('pricing.currentPlanCta')}</div>
            )
          ) : (
            <button type="button" onClick={onFreeCta} className="ftpc-ghost" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 24, background: '#EDE9E1', color: BRAND.ink, font: `600 14.5px ${BRAND.sans}`, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>{t('pricing.free.cta')}</button>
          )}
          <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: BRAND.ink }}>{t('pricing.free.inherits')}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {freeFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check(BRAND.blue)}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#55636F' }}>{f}</span></div>
            ))}
          </div>
        </div>

        {/* PRO */}
        <div style={{ background: BRAND.ink, border: `2px solid ${BRAND.ink}`, borderRadius: 22, padding: '32px 30px', boxShadow: '0 26px 60px rgba(10,37,64,.28)', position: 'relative', transform: 'scale(1.04)' }}>
          <div style={{ position: 'absolute', top: 18, right: 20, font: `600 10px ${BRAND.sans}`, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: accent, padding: '4px 11px', borderRadius: 20 }}>{t('pricing.recommended')}</div>
          <div style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '.02em', color: '#7ED6E7' }}>{t('pricing.pro.name')}</div>
          <div style={{ marginTop: 6, font: `400 14px ${BRAND.sans}`, color: '#8FA9B8' }}>{t('pricing.pro.desc')}</div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ font: `600 46px/1 ${BRAND.mono}`, color: '#fff' }}>€{proPrice}</span>
            <span style={{ font: `400 14px ${BRAND.sans}`, color: '#8FA9B8', paddingBottom: 8 }}>{t('pricing.unit')}</span>
            {annual && <span style={{ font: `400 15px ${BRAND.mono}`, color: '#5F7E92', textDecoration: 'line-through', paddingBottom: 9 }}>€{money(7.99)}</span>}
          </div>
          <div style={{ marginTop: 6, font: `400 12px ${BRAND.sans}`, color: '#6E8FA2', minHeight: 16 }}>{annual ? t('pricing.billNote') : ''}</div>
          {isUpgrade ? (
            currentPlan === 'pro' ? (
              <div style={{ ...currentBoxStyle, marginTop: 20, background: 'rgba(255,255,255,.08)', color: '#8FA9B8' }}>{t('pricing.currentPlanCta')}</div>
            ) : currentPlan !== 'premium' && (
              <div style={{ ...currentBoxStyle, marginTop: 20, background: 'rgba(255,255,255,.08)', color: '#8FA9B8', cursor: 'not-allowed' }}>{t('pricing.comingSoon')}</div>
            )
          ) : (
            <button type="button" onClick={onProCta} className="ftpc-primary" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 20, background: accent, color: '#fff', font: `600 14.5px ${BRAND.sans}`, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>{t('pricing.pro.cta')}</button>
          )}
          <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: '#B7CDDA' }}>{t('pricing.pro.inherits')}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {proFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check('#7ED6E7')}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#C7D6E0' }}>{f}</span></div>
            ))}
          </div>
        </div>

        {/* PREMIUM */}
        <div style={{ background: '#fff', border: `2px solid ${BRAND.ink}`, borderRadius: 22, padding: '32px 30px', boxShadow: '0 8px 30px rgba(10,37,64,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '.02em', color: BRAND.ink }}>{t('pricing.premium.name')}</span>
            <span style={{ font: `600 9.5px ${BRAND.sans}`, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8B6B2E', background: '#F6ECD6', padding: '3px 9px', borderRadius: 20 }}>{t('pricing.comingSoon')}</span>
          </div>
          <div style={{ marginTop: 6, font: `400 14px ${BRAND.sans}`, color: '#8B98A2' }}>{t('pricing.premium.desc')}</div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ font: `600 46px/1 ${BRAND.mono}`, color: BRAND.ink }}>€{premPrice}</span>
            <span style={{ font: `400 14px ${BRAND.sans}`, color: '#94A3B8', paddingBottom: 8 }}>{t('pricing.unit')}</span>
            {annual && <span style={{ font: `400 15px ${BRAND.mono}`, color: '#B4BEC9', textDecoration: 'line-through', paddingBottom: 9 }}>€{money(19.99)}</span>}
          </div>
          <div style={{ marginTop: 6, font: `400 12px ${BRAND.sans}`, color: '#94A3B8', minHeight: 16 }}>{annual ? t('pricing.billNote') : ''}</div>
          {currentPlan === 'premium' ? (
            <div style={{ ...currentBoxStyle, marginTop: 20, background: '#EDE9E1', color: '#7B857E' }}>{t('pricing.currentPlanCta')}</div>
          ) : (
            <div style={{ ...currentBoxStyle, marginTop: 20, background: '#EDE9E1', color: '#98A2AC', cursor: 'not-allowed' }}>{t('pricing.comingSoon')}</div>
          )}
          <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: BRAND.ink }}>{t('pricing.premium.inherits')}</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {premFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check(BRAND.blue)}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#55636F' }}>{f}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

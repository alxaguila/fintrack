import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { BRAND, BrandMark } from '@/components/landing/brand'
import { HeroDashboardMock } from '@/components/landing/HeroDashboardMock'
import { LoginDialog } from '@/components/auth/LoginDialog'

// Copia local de estilos de la landing (keyframes, hover y responsive). Se inyecta
// una sola vez; el diseño va con estilos inline para ser fiel al mockup aprobado.
const CSS = `
.ftl a{color:${BRAND.blue};text-decoration:none}
.ftl h1,.ftl h2,.ftl h3{text-wrap:pretty}
.ftl-nlink{transition:color .2s ease}
.ftl-nlink:hover{color:#fff}
.ftl-foot a{color:#66757F;transition:color .2s ease}
.ftl-foot a:hover{color:${BRAND.ink}}
.ftl-primary{transition:background .2s ease}
.ftl-primary:hover{background:${BRAND.accentHover}!important}
.ftl-ghost{transition:background .2s ease}
.ftl-ghost:hover{background:#EAF4FA!important}
.ftl-card{transition:transform .3s ease,box-shadow .3s ease}
.ftl-card:hover{transform:translateY(-6px);box-shadow:0 22px 48px rgba(10,37,64,.1)}
.ftl-seg{transition:all .2s ease}
@keyframes ftUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes ftMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes ftTilt{0%,100%{transform:perspective(1700px) rotateX(7deg) rotateY(-15deg) rotateZ(1.2deg) translateY(0)}50%{transform:perspective(1700px) rotateX(7deg) rotateY(-15deg) rotateZ(1.2deg) translateY(-18px)}}
@keyframes ftChev{0%,100%{opacity:.35;transform:translateX(0)}50%{opacity:1;transform:translateX(5px)}}
.ftl-heromock{animation:ftTilt 7s ease-in-out infinite}
.ftl-up{animation:ftUp .7s cubic-bezier(.2,.7,.2,1) both}
@media (max-width:1024px){
  .ftl-hero-card{min-height:auto!important}
  .ftl-hero-body{flex-direction:column!important;gap:36px!important;padding:32px 24px 40px!important}
  .ftl-hero-left{flex:1 1 auto!important;width:100%!important}
  .ftl-heromock{animation:none!important;transform:none!important}
  .ftl-h1{font-size:52px!important}
  .ftl-grid-2,.ftl-grid-3,.ftl-price-grid,.ftl-sec-grid{grid-template-columns:1fr!important}
  .ftl-price-pro{transform:none!important}
  .ftl-steps{flex-direction:column!important;align-items:center!important}
  .ftl-chev{transform:rotate(90deg)!important;padding-top:0!important}
}
@media (max-width:768px){
  .ftl-navcenter{display:none!important}
  .ftl-h1{font-size:42px!important}
  .ftl-sec-inner,.ftl-cta-inner{padding:44px 24px!important}
}
@media (max-width:520px){
  .ftl-h1{font-size:34px!important}
  .ftl-navcta{display:none!important}
}
`

const accent = BRAND.accent

export default function Landing() {
  const { t, i18n } = useTranslation('landing')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [annual, setAnnual] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)

  // Enlace "Inicia sesión" del registro (/?login=1) → abre el popup y limpia la URL.
  useEffect(() => {
    if (searchParams.get('login') === '1') {
      setLoginOpen(true)
      searchParams.delete('login')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const setLang = (next: 'es' | 'en') => {
    if (next === lang) return
    i18n.changeLanguage(next)
    localStorage.setItem('fintrack_language', next)
  }

  // Si ya hay sesión, la landing no aplica → directo a la app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/app', { replace: true })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/app', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const money = (v: number) => (lang === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ','))
  const proPrice = money(annual ? 5.99 : 7.99)
  const premPrice = money(annual ? 15.99 : 19.99)

  const goRegister = () => navigate('/register')
  const openLogin = () => setLoginOpen(true)

  const freeFeatures = t('pricing.free.features', { returnObjects: true }) as string[]
  const proFeatures = t('pricing.pro.features', { returnObjects: true }) as string[]
  const premFeatures = t('pricing.premium.features', { returnObjects: true }) as string[]

  const segBase: React.CSSProperties = {
    font: `600 12px ${BRAND.sans}`, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', border: 'none',
  }
  const langOn = { background: '#fff', color: BRAND.ink }
  const langOff = { background: 'transparent', color: '#8FA9B8' }
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
  const arrowBtn = (
    <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9 H14 M10 5 L14 9 L10 13" fill="none" stroke={BRAND.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  )

  return (
    <div className="ftl" style={{ width: '100%', background: BRAND.cream, color: BRAND.ink, overflowX: 'hidden', fontFamily: BRAND.sans, WebkitFontSmoothing: 'antialiased' }}>
      <style>{CSS}</style>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onGoRegister={() => { setLoginOpen(false); goRegister() }} />

      {/* ==================== HERO + NAV ==================== */}
      <div style={{ padding: '14px 14px 0', boxSizing: 'border-box' }}>
        <div className="ftl-hero-card" style={{ position: 'relative', maxWidth: 1780, margin: '0 auto', background: BRAND.ink, borderRadius: 26, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 150px)' }}>
          <div style={{ position: 'absolute', right: -160, top: -180, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.34),transparent 66%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -140, bottom: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,123,174,.3),transparent 70%)', pointerEvents: 'none' }} />

          {/* NAV */}
          <nav style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <BrandMark size={32} />
              <span style={{ font: `600 24px ${BRAND.display}`, letterSpacing: '-.03em', color: '#fff' }}>fintrack</span>
            </div>
            <div className="ftl-navcenter" style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
              <a className="ftl-nlink" href="#producto" style={{ font: `400 15px ${BRAND.sans}`, color: '#B7CDDA' }}>{t('nav.product')}</a>
              <a className="ftl-nlink" href="#seguridad" style={{ font: `400 15px ${BRAND.sans}`, color: '#B7CDDA' }}>{t('nav.security')}</a>
              <a className="ftl-nlink" href="#precios" style={{ font: `400 15px ${BRAND.sans}`, color: '#B7CDDA' }}>{t('nav.pricing')}</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: 3 }}>
                <button className="ftl-seg" onClick={() => setLang('es')} style={{ ...segBase, ...(lang === 'es' ? langOn : langOff) }}>ES</button>
                <button className="ftl-seg" onClick={() => setLang('en')} style={{ ...segBase, ...(lang === 'en' ? langOn : langOff) }}>EN</button>
              </div>
              <button onClick={openLogin} className="ftl-nlink" style={{ font: `500 15px ${BRAND.sans}`, color: '#B7CDDA', background: 'none', border: 'none', cursor: 'pointer' }}>{t('nav.login')}</button>
              <button onClick={goRegister} className="ftl-ghost ftl-navcta" style={{ background: '#fff', color: BRAND.ink, font: `600 15px ${BRAND.sans}`, padding: '11px 22px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>{t('nav.cta')}</button>
            </div>
          </nav>

          {/* HERO BODY */}
          <div className="ftl-hero-body" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', gap: 48, padding: '40px 48px 56px', width: '100%', maxWidth: 1780, margin: '0 auto', boxSizing: 'border-box' }}>
            <div className="ftl-hero-left" style={{ flex: '0 0 46%', minWidth: 0 }}>
              <div className="ftl-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '7px 15px 7px 11px', font: `500 12.5px ${BRAND.sans}`, color: '#9DC4D9' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7EE6C0' }} />{t('hero.badge')}
              </div>
              <h1 className="ftl-h1 ftl-up" style={{ margin: '24px 0 0', font: `500 66px/1.02 ${BRAND.display}`, letterSpacing: '-.045em', color: '#EAF4FA', animationDelay: '.12s' }}>
                {t('hero.line1')}<br />{t('hero.line2')}<br />
                <span style={{ fontFamily: BRAND.serif, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-.02em', color: accent }}>{t('hero.emph')}</span>
              </h1>
              <p className="ftl-up" style={{ margin: '26px 0 0', maxWidth: 468, font: `400 18px/1.6 ${BRAND.sans}`, color: '#9FBAC9', animationDelay: '.22s' }}>{t('hero.sub')}</p>
              <div className="ftl-up" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 34, animationDelay: '.32s' }}>
                <button onClick={goRegister} className="ftl-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 13, background: accent, color: '#fff', font: `600 17px ${BRAND.sans}`, padding: '8px 8px 8px 27px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
                  {t('hero.cta')}{arrowBtn}
                </button>
              </div>
              <div className="ftl-up" style={{ marginTop: 30, font: `400 13px ${BRAND.sans}`, color: '#6E8FA2', animationDelay: '.42s' }}>{t('hero.note')}</div>
            </div>

            <div style={{ flex: 1, minWidth: 0, perspective: 1700 }}>
              <div className="ftl-heromock"><HeroDashboardMock /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== BANK MARQUEE ==================== */}
      <div style={{ maxWidth: 1408, margin: '0 auto', padding: '44px 34px 8px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', font: `500 12px ${BRAND.sans}`, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9AA6A0' }}>{t('marquee.label')}</div>
        <div style={{ marginTop: 22, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'ftMarquee 34s linear infinite' }}>
            {[0, 1].map((k) => (
              <div key={k} aria-hidden={k === 1} style={{ display: 'flex', alignItems: 'center', gap: 56, paddingRight: 56, font: `500 22px ${BRAND.display}`, color: '#7C8A84', letterSpacing: '-.02em' }}>
                {['BBVA', 'Santander', 'CaixaBank', 'ING', 'Sabadell', 'Revolut', 'Bankinter', 'N26', 'Openbank', 'Wise'].map((b) => <span key={b}>{b}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== EXCEL PROBLEM ==================== */}
      <section style={{ maxWidth: 1408, margin: '0 auto', padding: '96px 34px 40px', boxSizing: 'border-box' }}>
        <div className="ftl-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ font: `500 12px ${BRAND.sans}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9AA6A0' }}>{t('excel.eyebrow')}</div>
            <h2 style={{ margin: '16px 0 0', font: `500 48px/1.08 ${BRAND.display}`, letterSpacing: '-.035em', color: BRAND.ink }}>{t('excel.title')}</h2>
            <p style={{ margin: '20px 0 0', maxWidth: 460, font: `400 18px/1.6 ${BRAND.sans}`, color: '#5A6B77' }}>{t('excel.sub')}</p>
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['excel.pt1', 'excel.pt2', 'excel.pt3'].map((k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, font: `400 16px ${BRAND.sans}`, color: '#46586B' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#E7F6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{check('#16A34A')}</span>
                  {t(k)}
                </div>
              ))}
            </div>
          </div>
          {/* before / after */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, transform: 'rotate(-4deg)', filter: 'grayscale(.5)', opacity: .9, background: '#fff', border: '1px solid #DDD6C8', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(10,37,64,.12)' }}>
              <div style={{ background: '#F0ECE3', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid #E2DBCC' }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#C9C1B0' }} />)}
                <span style={{ marginLeft: 6, font: `500 11px ${BRAND.mono}`, color: '#8B8674' }}>gastos_2026.xlsx</span>
              </div>
              <div style={{ padding: '2px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 74px', font: `500 10px ${BRAND.mono}`, color: '#9A9482', background: '#F7F4ED', borderBottom: '1px solid #ECE6D8' }}>
                  <span style={{ padding: '6px 8px' }}>Fecha</span><span style={{ padding: '6px 8px', borderLeft: '1px solid #ECE6D8' }}>Concepto</span><span style={{ padding: '6px 8px', borderLeft: '1px solid #ECE6D8', textAlign: 'right' }}>Importe</span>
                </div>
                {[['02/01', 'Mercadona', '−54,20'], ['05/01', 'Nómina', '+2.400'], ['08/01', 'Endesa', '−64,20']].map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 74px', font: `400 10.5px ${BRAND.mono}`, color: '#6B6357', borderBottom: '1px solid #F1ECE0' }}>
                    <span style={{ padding: '6px 8px' }}>{r[0]}</span><span style={{ padding: '6px 8px', borderLeft: '1px solid #F1ECE0' }}>{r[1]}</span><span style={{ padding: '6px 8px', borderLeft: '1px solid #F1ECE0', textAlign: 'right' }}>{r[2]}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '9px 12px', background: '#F7F4ED', borderTop: '1px solid #ECE6D8', font: `500 10px ${BRAND.sans}`, color: '#8B8674' }}>{t('excel.oldEdited')}</div>
            </div>

            <div style={{ flex: 'none', color: accent }}>
              <svg width="30" height="30" viewBox="0 0 24 24" style={{ animation: 'ftChev 1.8s ease-in-out infinite' }}><path d="M5 12 H18 M13 7 L18 12 L13 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>

            <div className="ftl-card" style={{ flex: 1, transform: 'rotate(3deg)', background: '#fff', border: '1px solid #E7E0D4', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 54px rgba(10,37,64,.16)' }}>
              <div style={{ background: BRAND.ink, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 9 }}>
                <BrandMark size={20} /><span style={{ font: `600 15px ${BRAND.display}`, color: '#fff', letterSpacing: '-.02em' }}>fintrack</span>
              </div>
              <div style={{ padding: '18px 18px 20px' }}>
                <div style={{ font: `500 11px ${BRAND.sans}`, color: '#6B7C8C' }}>{t('excel.newLabel')}</div>
                <div style={{ font: `600 30px/1 ${BRAND.mono}`, color: BRAND.ink, marginTop: 8 }}>€48.240<span style={{ fontSize: 18, color: '#94A3B8' }}>,50</span></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 44, marginTop: 14 }}>
                  {[40, 55, 46, 72, 62, 92].map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, background: i < 3 ? '#CBE4F0' : i < 5 ? '#38B0D6' : BRAND.blue, borderRadius: 3 }} />)}
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, background: '#E7F6EC', borderRadius: 9, padding: '8px 11px' }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <svg width="9" height="9" viewBox="0 0 18 18"><path d="M4 9.5 L7.5 13 L14 5.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <span style={{ font: `500 11.5px ${BRAND.sans}`, color: '#15803D' }}>{t('excel.newStatus')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="producto" style={{ maxWidth: 1408, margin: '0 auto', padding: '80px 34px 40px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 640, margin: '0 auto 46px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, font: `500 48px/1.05 ${BRAND.display}`, letterSpacing: '-.035em', color: BRAND.ink }}>{t('features.title')}</h2>
          <p style={{ margin: '16px 0 0', font: `400 18px/1.55 ${BRAND.sans}`, color: '#5A6B77' }}>{t('features.sub')}</p>
        </div>
        <div className="ftl-grid-3" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr', gap: 18 }}>
          <div className="ftl-card" style={{ background: '#EDE9E1', border: '1px solid #E1DACC', borderRadius: 20, padding: '26px 28px', minHeight: 312, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, font: `500 25px/1.15 ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>{t('features.f1title')}</h3>
              <p style={{ margin: '11px 0 0', maxWidth: 320, font: `400 15px/1.55 ${BRAND.sans}`, color: '#66757F' }}>{t('features.f1body')}</p>
            </div>
            <div style={{ marginTop: 22, background: '#fff', border: '1.5px dashed #C4CDBF', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: '#EAF4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="21" height="21" viewBox="0 0 18 18"><path d="M9 12.5 V3 M5 6.5 L9 2.5 L13 6.5" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 12 V14.5 H15 V12" fill="none" stroke={BRAND.blue} strokeWidth="1.6" strokeLinecap="round" /></svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: `500 14px ${BRAND.sans}`, color: BRAND.ink }}>{t('features.uploadHint1')}</div>
                <div style={{ font: `400 12.5px ${BRAND.sans}`, color: '#93A1AB' }}>{t('features.uploadHint2')}</div>
              </div>
              <span style={{ font: `600 13px ${BRAND.sans}`, color: accent }}>{t('features.uploadBrowse')}</span>
            </div>
          </div>
          {[{ t: 'features.f2title', b: 'features.f2body', tr: true }, { t: 'features.f3title', b: 'features.f3body', tr: false }].map((f, i) => (
            <div key={i} className="ftl-card" style={{ background: BRAND.ink, borderRadius: 20, padding: '26px 28px', minHeight: 312, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, [f.tr ? 'top' : 'bottom']: -40, width: 150, height: 150, borderRadius: '50%', background: f.tr ? 'radial-gradient(circle,rgba(56,176,214,.3),transparent 70%)' : 'radial-gradient(circle,rgba(10,123,174,.35),transparent 70%)' } as React.CSSProperties} />
              <div style={{ position: 'relative' }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(126,214,231,.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.tr
                    ? <svg width="22" height="22" viewBox="0 0 18 18"><path d="M9 1.5 L15.5 4 V9 C15.5 13 12.5 15.5 9 16.5 C5.5 15.5 2.5 13 2.5 9 V4 Z" fill="none" stroke="#7ED6E7" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6.3 9 L8.2 10.9 L11.8 6.7" fill="none" stroke="#7ED6E7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg width="22" height="22" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3.2" fill="none" stroke="#7ED6E7" strokeWidth="1.4" /><path d="M9 1.5 v2 M9 14.5 v2 M1.5 9 h2 M14.5 9 h2 M3.8 3.8 l1.4 1.4 M12.8 12.8 l1.4 1.4 M14.2 3.8 l-1.4 1.4 M5.2 12.8 l-1.4 1.4" stroke="#7ED6E7" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <h3 style={{ margin: 0, font: `500 24px/1.18 ${BRAND.display}`, letterSpacing: '-.02em', color: '#EAF4FA' }}>{t(f.t)}</h3>
                <p style={{ margin: '11px 0 0', font: `400 14.5px/1.55 ${BRAND.sans}`, color: '#8FA9B8' }}>{t(f.b)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 3 STEPS ==================== */}
      <section style={{ maxWidth: 1408, margin: '0 auto', padding: '80px 34px 40px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 60px' }}>
          <div style={{ font: `500 12px ${BRAND.sans}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9AA6A0' }}>{t('steps.eyebrow')}</div>
          <h2 style={{ margin: '14px 0 0', font: `500 44px/1.08 ${BRAND.display}`, letterSpacing: '-.035em', color: BRAND.ink }}>{t('steps.title')}</h2>
        </div>
        <div className="ftl-steps" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 14 }}>
          {[1, 2, 3].map((n, idx) => (
            <div key={n} style={{ display: 'contents' }}>
              <div style={{ flex: 1, maxWidth: 320, textAlign: 'center' }}>
                <div style={{ width: 96, height: 96, margin: '0 auto', borderRadius: '50%', background: n === 3 ? accent : BRAND.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: n === 3 ? '0 18px 40px rgba(255,107,74,.32)' : '0 18px 40px rgba(10,37,64,.24)' }}>
                  <span style={{ font: `600 40px ${BRAND.display}`, color: '#fff' }}>{n}</span>
                </div>
                <h3 style={{ margin: '26px 0 0', font: `500 22px ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>{t(`steps.s${n}title`)}</h3>
                <p style={{ margin: '10px auto 0', maxWidth: 260, font: `400 15px/1.55 ${BRAND.sans}`, color: '#66757F' }}>{t(`steps.s${n}body`)}</p>
              </div>
              {idx < 2 && (
                <div className="ftl-chev" style={{ flex: 'none', paddingTop: 32, color: accent }}>
                  <svg width="46" height="46" viewBox="0 0 24 24" style={{ animation: 'ftChev 1.8s ease-in-out infinite' }}><path d="M6 12 H17 M12 7 L17 12 L12 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== SECURITY ==================== */}
      <section id="seguridad" style={{ maxWidth: 1408, margin: '0 auto', padding: '70px 34px', boxSizing: 'border-box' }}>
        <div className="ftl-sec-inner" style={{ background: BRAND.ink, borderRadius: 26, padding: '64px 60px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: -120, top: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,123,174,.3),transparent 70%)' }} />
          <div style={{ position: 'relative', maxWidth: 760 }}>
            <div style={{ font: `500 12px ${BRAND.sans}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5F9DBE' }}>{t('security.eyebrow')}</div>
            <h2 style={{ margin: '18px 0 0', font: `500 46px/1.12 ${BRAND.display}`, letterSpacing: '-.035em', color: '#EAF4FA' }}>{t('security.title')}</h2>
            <p style={{ margin: '20px 0 0', font: `400 18px/1.6 ${BRAND.sans}`, color: '#9FBAC9' }}>{t('security.sub')}</p>
          </div>
          <div className="ftl-sec-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 48 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ borderTop: '1px solid rgba(255,255,255,.14)', paddingTop: 22 }}>
                <div style={{ font: `600 15px ${BRAND.sans}`, color: '#7ED6E7' }}>{t(`security.s${n}t`)}</div>
                <div style={{ marginTop: 9, font: `400 15px/1.55 ${BRAND.sans}`, color: '#8FA9B8' }}>{t(`security.s${n}d`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="precios" style={{ maxWidth: 1408, margin: '0 auto', padding: '80px 34px 40px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 30px' }}>
          <div style={{ font: `500 12px ${BRAND.sans}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9AA6A0' }}>{t('pricing.eyebrow')}</div>
          <h2 style={{ margin: '14px 0 0', font: `500 46px/1.06 ${BRAND.display}`, letterSpacing: '-.035em', color: BRAND.ink }}>{t('pricing.title')}</h2>
          <p style={{ margin: '16px 0 0', font: `400 17px/1.55 ${BRAND.sans}`, color: '#66757F' }}>{t('pricing.sub')}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 42 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EAE5DA', borderRadius: 12, padding: 4 }}>
            <button className="ftl-seg" onClick={() => setAnnual(false)} style={{ ...billBase, ...(annual ? billOff : billOn) }}>{t('pricing.monthly')}</button>
            <button className="ftl-seg" onClick={() => setAnnual(true)} style={{ ...billBase, ...(annual ? billOn : billOff) }}>
              {t('pricing.annual')}<span style={{ marginLeft: 7, font: `600 10px ${BRAND.sans}`, color: '#fff', background: accent, padding: '2px 7px', borderRadius: 20 }}>{t('pricing.save')}</span>
            </button>
          </div>
        </div>

        <div className="ftl-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 1080, margin: '0 auto', alignItems: 'start' }}>
          {/* FREE */}
          <div style={{ background: '#fff', border: '1px solid #E7E0D4', borderRadius: 22, padding: '32px 30px', boxShadow: '0 8px 30px rgba(10,37,64,.05)' }}>
            <div style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '.02em', color: BRAND.ink }}>{t('pricing.free.name')}</div>
            <div style={{ marginTop: 6, font: `400 14px ${BRAND.sans}`, color: '#8B98A2' }}>{t('pricing.free.desc')}</div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ font: `600 46px/1 ${BRAND.mono}`, color: BRAND.ink }}>€0</span>
              <span style={{ font: `400 14px ${BRAND.sans}`, color: '#94A3B8', paddingBottom: 8 }}>{t('pricing.forever')}</span>
            </div>
            <button onClick={goRegister} className="ftl-ghost" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 24, background: '#EDE9E1', color: BRAND.ink, font: `600 14.5px ${BRAND.sans}`, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>{t('pricing.free.cta')}</button>
            <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: BRAND.ink }}>{t('pricing.free.inherits')}</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {freeFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check(BRAND.blue)}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#55636F' }}>{f}</span></div>
              ))}
            </div>
          </div>

          {/* PRO */}
          <div className="ftl-price-pro" style={{ background: BRAND.ink, border: `1px solid ${BRAND.ink}`, borderRadius: 22, padding: '32px 30px', boxShadow: '0 26px 60px rgba(10,37,64,.28)', position: 'relative', transform: 'scale(1.04)' }}>
            <div style={{ position: 'absolute', top: 18, right: 20, font: `600 10px ${BRAND.sans}`, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: accent, padding: '4px 11px', borderRadius: 20 }}>{t('pricing.recommended')}</div>
            <div style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '.02em', color: '#7ED6E7' }}>{t('pricing.pro.name')}</div>
            <div style={{ marginTop: 6, font: `400 14px ${BRAND.sans}`, color: '#8FA9B8' }}>{t('pricing.pro.desc')}</div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ font: `600 46px/1 ${BRAND.mono}`, color: '#fff' }}>€{proPrice}</span>
              <span style={{ font: `400 14px ${BRAND.sans}`, color: '#8FA9B8', paddingBottom: 8 }}>{t('pricing.unit')}</span>
              {annual && <span style={{ font: `400 15px ${BRAND.mono}`, color: '#5F7E92', textDecoration: 'line-through', paddingBottom: 9 }}>€{money(7.99)}</span>}
            </div>
            <div style={{ marginTop: 6, font: `400 12px ${BRAND.sans}`, color: '#6E8FA2', minHeight: 16 }}>{annual ? t('pricing.billNote') : ''}</div>
            <button onClick={goRegister} className="ftl-primary" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 20, background: accent, color: '#fff', font: `600 14.5px ${BRAND.sans}`, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>{t('pricing.pro.cta')}</button>
            <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: '#B7CDDA' }}>{t('pricing.pro.inherits')}</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {proFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check('#7ED6E7')}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#C7D6E0' }}>{f}</span></div>
              ))}
            </div>
          </div>

          {/* PREMIUM */}
          <div style={{ background: '#fff', border: '1px solid #E7E0D4', borderRadius: 22, padding: '32px 30px', boxShadow: '0 8px 30px rgba(10,37,64,.05)' }}>
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
            <div style={{ textAlign: 'center', marginTop: 20, background: '#EDE9E1', color: '#98A2AC', font: `600 14.5px ${BRAND.sans}`, padding: '13px 0', borderRadius: 12, cursor: 'not-allowed' }}>{t('pricing.comingSoon')}</div>
            <div style={{ marginTop: 24, font: `500 13px ${BRAND.sans}`, color: BRAND.ink }}>{t('pricing.premium.inherits')}</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {premFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>{check(BRAND.blue)}<span style={{ font: `400 14px/1.4 ${BRAND.sans}`, color: '#55636F' }}>{f}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section style={{ maxWidth: 1408, margin: '0 auto', padding: '60px 34px 80px', boxSizing: 'border-box' }}>
        <div className="ftl-cta-inner" style={{ background: BRAND.ink, borderRadius: 26, padding: '72px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -100, top: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.28),transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, font: `500 48px/1.08 ${BRAND.display}`, letterSpacing: '-.04em', color: '#EAF4FA' }}>{t('cta.title')}</h2>
            <p style={{ margin: '18px auto 0', maxWidth: 480, font: `400 18px/1.55 ${BRAND.sans}`, color: '#9FBAC9' }}>{t('cta.sub')}</p>
            <button onClick={goRegister} className="ftl-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 13, marginTop: 34, background: accent, color: '#fff', font: `600 17px ${BRAND.sans}`, padding: '9px 9px 9px 28px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
              {t('cta.btn')}{arrowBtn}
            </button>
            <div style={{ marginTop: 20, font: `400 13px ${BRAND.sans}`, color: '#6E8FA2' }}>{t('cta.note')}</div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="ftl-foot" style={{ borderTop: '1px solid #E3DCCE' }}>
        <div style={{ maxWidth: 1408, margin: '0 auto', padding: '44px 34px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <BrandMark size={28} /><span style={{ font: `600 21px ${BRAND.display}`, letterSpacing: '-.03em', color: BRAND.ink }}>fintrack</span>
          </div>
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', font: `400 14px ${BRAND.sans}`, color: '#66757F' }}>
            <a href="#producto">{t('nav.product')}</a>
            <a href="#seguridad">{t('nav.security')}</a>
            <a href="#precios">{t('nav.pricing')}</a>
            <a href="#">{t('footer.privacy')}</a>
            <a href="#">{t('footer.help')}</a>
          </div>
          <div style={{ font: `400 13px ${BRAND.sans}`, color: '#93A1AB' }}>{t('footer.copy')}</div>
        </div>
      </footer>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { BRAND, BrandMark } from './brand'

/**
 * Maqueta puramente decorativa del dashboard para el hero de la landing.
 * HTML/CSS/SVG (no imagen externa): nítido a cualquier tamaño y traducible.
 * Se renderiza dentro de un contenedor inclinado + flotante en Landing.tsx.
 */
export function HeroDashboardMock() {
  const { t } = useTranslation('landing')
  const m = (k: string) => t(`mock.${k}`)

  const donut = [
    { color: BRAND.ink, frac: 0.36, label: m('catHousing'), val: '€780' },
    { color: BRAND.blue, frac: 0.2, label: m('catFood'), val: '€420' },
    { color: '#38B0D6', frac: 0.17, label: m('catOther'), val: '€360' },
    { color: '#7ED6E7', frac: 0.14, label: m('catLeisure'), val: '€310' },
    { color: BRAND.accent, frac: 0.13, label: m('catTransport'), val: '€180' },
  ]
  // Arcos del donut (circunferencia ~ 2πr, r=15.9155 → 100).
  let acc = 0
  const arcs = donut.map((d) => {
    const seg = { ...d, dash: `${d.frac * 100} ${100 - d.frac * 100}`, offset: 25 - acc * 100 }
    acc += d.frac
    return seg
  })

  const navItems = [
    { label: m('navSummary'), active: true },
    { label: m('navMovements') },
    { label: m('navBudgets') },
    { label: m('navGoals') },
    { label: m('navReports') },
    { label: m('navAccounts') },
  ]

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #EEF1F4', borderRadius: 14 }
  const tileLabel: React.CSSProperties = { font: `500 9px ${BRAND.sans}`, color: '#6B7C8C' }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: 'none',
        overflow: 'hidden',
        boxShadow: '0 50px 100px rgba(0,0,0,.5),0 8px 24px rgba(0,0,0,.3)',
        display: 'flex',
        fontFamily: BRAND.sans,
        color: BRAND.ink,
      }}
    >
      {/* Sidebar */}
      <div style={{ width: '19%', minWidth: 118, background: BRAND.ink, padding: '14px 12px', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
          <BrandMark size={18} />
          <span style={{ font: `600 13px ${BRAND.display}`, color: '#fff', letterSpacing: '-.02em' }}>fintrack</span>
        </div>
        <div style={{ font: `500 8px ${BRAND.sans}`, letterSpacing: '.12em', color: '#4F7691', marginBottom: 9 }}>PERSONAL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map((n, i) => (
            <div
              key={i}
              style={{
                font: `${n.active ? 600 : 400} 10.5px ${BRAND.sans}`,
                color: n.active ? '#fff' : '#8FA9B8',
                background: n.active ? BRAND.ink2 : 'transparent',
                borderRadius: 7,
                padding: '6px 8px',
              }}
            >
              {n.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, background: '#F7F9FB', padding: '14px 16px 16px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: `600 15px ${BRAND.display}`, letterSpacing: '-.02em' }}>{m('greeting')}</div>
            <div style={{ font: `400 9.5px ${BRAND.sans}`, color: '#7C8A96', marginTop: 2 }}>{m('subtitle')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
            <div style={{ font: `400 9px ${BRAND.sans}`, color: '#9AA6B0', background: '#fff', border: '1px solid #E7EBEF', borderRadius: 7, padding: '5px 9px' }}>
              {m('search')}
            </div>
            <div style={{ font: `500 9px ${BRAND.sans}`, color: BRAND.ink, background: '#fff', border: '1px solid #E7EBEF', borderRadius: 7, padding: '5px 8px' }}>
              {m('month')}
            </div>
            <div style={{ font: `600 9px ${BRAND.sans}`, color: '#fff', background: BRAND.accent, borderRadius: 7, padding: '5px 9px' }}>
              {m('upload')}
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
          <div style={{ ...card, padding: '9px 10px' }}>
            <div style={tileLabel}>{m('netWorth')}</div>
            <div style={{ font: `600 16px ${BRAND.mono}`, marginTop: 3 }}>
              €48.240<span style={{ fontSize: 10, color: '#94A3B8' }}>,50</span>
            </div>
            <div style={{ font: `500 8px ${BRAND.sans}`, color: '#16A34A', marginTop: 2 }}>▲ {m('netWorthDelta')}</div>
          </div>
          <div style={{ ...card, padding: '9px 10px' }}>
            <div style={tileLabel}>{m('income')}</div>
            <div style={{ font: `600 14px ${BRAND.mono}`, marginTop: 3 }}>€3.180</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 5, height: 10, alignItems: 'flex-end' }}>
              {[40, 60, 45, 80, 100].map((h, i) => (
                <span key={i} style={{ flex: 1, height: `${h}%`, background: '#BBEAD0', borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ ...card, padding: '9px 10px' }}>
            <div style={tileLabel}>{m('expenses')}</div>
            <div style={{ font: `600 14px ${BRAND.mono}`, marginTop: 3 }}>€2.145</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 5, height: 10, alignItems: 'flex-end' }}>
              {[70, 50, 90, 40, 65].map((h, i) => (
                <span key={i} style={{ flex: 1, height: `${h}%`, background: '#F6C3B4', borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ ...card, padding: '9px 10px' }}>
            <div style={tileLabel}>{m('monthBalance')}</div>
            <div style={{ font: `600 14px ${BRAND.mono}`, marginTop: 3 }}>€1.034</div>
            <div style={{ font: `500 8px ${BRAND.sans}`, color: '#7C8A96', marginTop: 2 }}>{m('goal')}</div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 8, marginTop: 8 }}>
          <div style={{ ...card, padding: '10px 11px' }}>
            <div style={{ font: `600 10px ${BRAND.sans}` }}>{m('evolution')}</div>
            <div style={{ font: `400 8px ${BRAND.sans}`, color: '#9AA6B0' }}>{m('evolutionSub')}</div>
            <svg viewBox="0 0 260 70" style={{ width: '100%', height: 'auto', marginTop: 4 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="ftl-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={BRAND.blue} stopOpacity="0.18" />
                  <stop offset="1" stopColor={BRAND.blue} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 58 L26 54 L52 55 L78 46 L104 48 L130 38 L156 40 L182 30 L208 26 L234 18 L260 10"
                fill="none"
                stroke={BRAND.blue}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M0 58 L26 54 L52 55 L78 46 L104 48 L130 38 L156 40 L182 30 L208 26 L234 18 L260 10 L260 70 L0 70 Z" fill="url(#ftl-area)" />
              <circle cx="260" cy="10" r="3" fill={BRAND.blue} />
            </svg>
          </div>
          <div style={{ ...card, padding: '10px 11px' }}>
            <div style={{ font: `600 10px ${BRAND.sans}`, marginBottom: 4 }}>{m('byCategory')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 36 36" style={{ width: 58, height: 58, flex: 'none' }}>
                {arcs.map((a, i) => (
                  <circle
                    key={i}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={a.color}
                    strokeWidth="4.4"
                    strokeDasharray={a.dash}
                    strokeDashoffset={a.offset}
                    transform="rotate(-90 18 18)"
                  />
                ))}
                <text x="18" y="19.5" textAnchor="middle" style={{ font: `600 5px ${BRAND.mono}`, fill: BRAND.ink }}>
                  €2.145
                </text>
              </svg>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {donut.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 8px ${BRAND.sans}`, color: '#55636F' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: d.color, flex: 'none' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                    <span style={{ font: `500 8px ${BRAND.mono}`, color: BRAND.ink }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 8, marginTop: 8 }}>
          <div style={{ ...card, padding: '10px 11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: `600 10px ${BRAND.sans}` }}>{m('recent')}</span>
              <span style={{ font: `500 8px ${BRAND.sans}`, color: BRAND.blue }}>{m('seeAll')}</span>
            </div>
            {[
              { t: m('txPayroll'), s: m('txPayrollSub'), a: '+€2.400,00', pos: true },
              { t: m('txMortgage'), s: m('txMortgageSub'), a: '−€780,00', pos: false },
              { t: m('txGrocery'), s: m('txGrocerySub'), a: '−€87,40', pos: false },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: r.pos ? '#E7F6EC' : '#F3F5F7', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: `500 9px ${BRAND.sans}`, color: BRAND.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.t}</div>
                  <div style={{ font: `400 7.5px ${BRAND.sans}`, color: '#9AA6B0' }}>{r.s}</div>
                </div>
                <span style={{ font: `600 9px ${BRAND.mono}`, color: r.pos ? '#16A34A' : BRAND.ink }}>{r.a}</span>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: '10px 11px' }}>
            <div style={{ font: `600 10px ${BRAND.sans}`, marginBottom: 6 }}>{m('budgets')}</div>
            {[
              { l: m('catFood'), v: '€420', pct: 72, c: BRAND.blue },
              { l: m('catLeisure'), v: '€310', pct: 88, c: BRAND.accent },
              { l: m('catTransport'), v: '€180', pct: 45, c: '#38B0D6' },
            ].map((b, i) => (
              <div key={i} style={{ marginTop: i ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: `400 8px ${BRAND.sans}`, color: '#55636F' }}>
                  <span>{b.l}</span>
                  <span style={{ font: `500 8px ${BRAND.mono}` }}>{b.v}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#EDF1F4', marginTop: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${b.pct}%`, height: '100%', background: b.c, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

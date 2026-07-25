import { BRAND } from '@/components/landing/brand'

interface MoneyAmountProps {
  amount: number
  color?: string
  /** Color de los decimales/€ — por defecto un gris atenuado, pensado para fondo claro. */
  decColor?: string
  size?: 'md' | 'lg'
}

/** Entero + decimales/€ pequeños y atenuados — mismo patrón que AmountSplit de src/pages/Home.tsx. */
export function MoneyAmount({ amount, color, decColor = '#9AA7B3', size = 'md' }: MoneyAmountProps) {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const intFont = size === 'lg' ? `600 clamp(30px,4.2vw,40px) ${BRAND.display}` : `600 clamp(17px,2.1vw,21px) ${BRAND.display}`
  const decFont = size === 'lg' ? `500 15px ${BRAND.sans}` : `500 11px ${BRAND.sans}`
  return (
    <span style={{ letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
      <span style={{ font: intFont, color: color ?? BRAND.ink }}>{sign}{intFmt}</span>
      <span style={{ font: decFont, color: decColor, marginLeft: 1 }}>,{dec} €</span>
    </span>
  )
}

// Etiqueta con versión larga (desktop) / corta (móvil) — el CSS de la página
// alterna cuál se muestra (mismo patrón *-full/-short* que el subtítulo de HeroStatCard).
function ResponsiveLabel({ label, shortLabel, className }: { label: string; shortLabel?: string; className?: string }) {
  if (!shortLabel) return <span className={className}>{label}</span>
  return (
    <>
      <span className={`kpi-label-full ${className ?? ''}`}>{label}</span>
      <span className={`kpi-label-short ${className ?? ''}`}>{shortLabel}</span>
    </>
  )
}

interface KpiCardProps {
  label: string
  /** Etiqueta alternativa más corta para móvil (si no cabe la larga). */
  shortLabel?: string
  /** Importe en €, formateado con MoneyAmount (decimales atenuados). */
  amount?: number
  /** Texto ya formateado para valores que no son importes (p. ej. un porcentaje). */
  value?: string
}

/** Tarjeta secundaria de un único valor, alineada a la izquierda. */
export function KpiCard({ label, shortLabel, amount, value }: KpiCardProps) {
  return (
    <div
      style={{
        minWidth: 0, background: '#fff', border: '1px solid #ECE7DD', borderRadius: 16,
        padding: '14px 16px', boxShadow: '0 4px 14px rgba(10,37,64,.04)', boxSizing: 'border-box', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}
    >
      <div style={{ font: `500 13px ${BRAND.sans}`, color: '#8A96A3' }}>
        <ResponsiveLabel label={label} shortLabel={shortLabel} />
      </div>
      <div style={{ marginTop: 4 }}>
        {amount !== undefined ? (
          <MoneyAmount amount={amount} />
        ) : (
          <span style={{ font: `600 clamp(17px,2.1vw,21px) ${BRAND.display}`, letterSpacing: '-.02em', whiteSpace: 'nowrap', color: BRAND.ink }}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

interface HeroStatCardProps {
  label: string
  amount: number
  /** Valor del badge, ya formateado con signo (p. ej. "+196,8%"). */
  badgeValue: string
  subtitle: string
  subtitleShort: string
}

/** Tarjeta destacada (fondo navy) con el patrimonio final, un badge de rentabilidad y una frase de contexto. */
export function HeroStatCard({ label, amount, badgeValue, subtitle, subtitleShort }: HeroStatCardProps) {
  return (
    <div
      style={{
        minWidth: 0, background: BRAND.ink, borderRadius: 20, padding: '24px 28px',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ font: `500 14px ${BRAND.sans}`, color: '#B7CDDA' }}>{label}</span>
        <span
          style={{
            flexShrink: 0, background: 'rgba(255,107,74,.16)', color: '#FF9478', font: `700 13px ${BRAND.sans}`,
            padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap',
          }}
        >
          {badgeValue}
        </span>
      </div>
      <MoneyAmount amount={amount} color="#fff" decColor="rgba(255,255,255,.55)" size="lg" />
      <p style={{ margin: 0, font: `400 14px/1.5 ${BRAND.sans}`, color: '#8FA9B8' }}>
        <ResponsiveLabel label={subtitle} shortLabel={subtitleShort} />
      </p>
    </div>
  )
}

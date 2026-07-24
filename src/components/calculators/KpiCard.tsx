import { BRAND } from '@/components/landing/brand'

// Altura reservada para la etiqueta (hasta 2 líneas al tamaño/estilo de "Tus
// datos") para que el valor de todas las pastillas arranque siempre en la
// misma línea, tenga la etiqueta 1 o 2 líneas de texto.
const LABEL_HEIGHT = 41

function Label({ children }: { children: string }) {
  return (
    <div style={{ minHeight: LABEL_HEIGHT, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Mismo estilo que el título "Tus datos" del panel de inputs. */}
      <span style={{ font: `600 15px ${BRAND.sans}`, lineHeight: 1.35, color: BRAND.ink }}>{children}</span>
    </div>
  )
}

const BIG_VALUE_FONT = `600 clamp(17px,2.1vw,21px) ${BRAND.display}`

interface MoneyAmountProps {
  amount: number
  color?: string
}

/** Entero + decimales/€ pequeños y atenuados — mismo patrón que AmountSplit de src/pages/Home.tsx. */
export function MoneyAmount({ amount, color }: MoneyAmountProps) {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (
    <span style={{ letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
      <span style={{ font: BIG_VALUE_FONT, color: color ?? BRAND.ink }}>{sign}{intFmt}</span>
      <span style={{ font: `500 11px ${BRAND.sans}`, color: '#9AA7B3', marginLeft: 1 }}>,{dec} €</span>
    </span>
  )
}

interface KpiCardProps {
  label: string
  /** Importe en €, formateado con MoneyAmount (decimales atenuados). */
  amount?: number
  /** Texto ya formateado para valores que no son importes (p. ej. un porcentaje). */
  value?: string
  accent?: boolean
}

/** Pastilla de resumen (un único valor) para las calculadoras de la landing. */
export function KpiCard({ label, amount, value, accent }: KpiCardProps) {
  return (
    <div
      style={{
        minWidth: 0, background: '#fff', border: '1px solid #ECE7DD', borderRadius: 16, textAlign: 'center',
        padding: '14px 12px', boxShadow: '0 4px 14px rgba(10,37,64,.04)', boxSizing: 'border-box', overflow: 'hidden',
      }}
    >
      <Label>{label}</Label>
      <div style={{ marginTop: 4 }}>
        {amount !== undefined ? (
          <MoneyAmount amount={amount} color={accent ? BRAND.accent : undefined} />
        ) : (
          <span style={{ font: BIG_VALUE_FONT, letterSpacing: '-.02em', whiteSpace: 'nowrap', color: accent ? BRAND.accent : BRAND.ink }}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

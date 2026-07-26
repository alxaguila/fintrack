import { useEffect, useState } from 'react'
import { BRAND } from '@/components/landing/brand'

const STYLE = `
.calc-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;background:#E3DCCE;outline:none;cursor:pointer}
.calc-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:${BRAND.accent};border:3px solid #fff;box-shadow:0 1px 4px rgba(10,37,64,.35);cursor:pointer}
.calc-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${BRAND.accent};border:3px solid #fff;box-shadow:0 1px 4px rgba(10,37,64,.35);cursor:pointer}
.calc-slider::-moz-range-track{height:6px;border-radius:999px;background:#E3DCCE}
.calc-numinput:focus{border-color:${BRAND.blue}!important;box-shadow:0 0 0 3px rgba(10,123,174,.15)}
`

interface SliderNumberInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
  /** Por defecto número plano; los campos de dinero pasan formatThousands. */
  formatValue?: (v: number) => string
  /** Inverso de formatValue — por defecto un parseo genérico; los campos con separador de miles pasan parseThousands. */
  parseValue?: (raw: string) => number
  className?: string
  /** Tope del slider si es más bajo que `max` (el input numérico sigue validando contra `max`) — útil cuando el rango "realista" con arrastre es menor que el máximo técnico permitido a mano. */
  sliderMax?: number
  /** Ancho del input numérico en px — por defecto un valor compacto (para edades/años/%); los campos con separador de miles pasan un valor mayor. */
  inputWidth?: number
}

/**
 * Slider + input numérico sincronizados, genérico (dinero, %, años...), pensado
 * para reutilizarse tal cual en cualquier otra calculadora de la landing.
 */
export function SliderNumberInput({ label, value, min, max, step = 1, onChange, suffix, formatValue, parseValue, className, sliderMax, inputWidth = 92 }: SliderNumberInputProps) {
  const display = (v: number) => (formatValue ? formatValue(v) : String(v))
  const [text, setText] = useState(display(value))

  useEffect(() => {
    setText(display(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (raw: string) => {
    const n = parseValue ? parseValue(raw) : Number(raw.replace(/[^\d.,-]/g, '').replace(',', '.'))
    if (!Number.isFinite(n)) {
      setText(display(value))
      return
    }
    onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{STYLE}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.ink }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            className="calc-numinput"
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            style={{
              width: inputWidth, maxWidth: '40vw', textAlign: 'right', font: `600 14px ${BRAND.mono}`, color: BRAND.ink,
              border: '1px solid #DCD5C8', borderRadius: 8, padding: '6px 8px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {suffix && <span style={{ font: `500 13px ${BRAND.sans}`, color: '#8A96A3' }}>{suffix}</span>}
        </div>
      </div>
      <input
        className="calc-slider"
        type="range"
        min={min}
        max={sliderMax ?? max}
        step={step}
        value={Math.min(value, sliderMax ?? max)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

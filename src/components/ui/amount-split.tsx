// Importe con entero grande + decimales/€ medianos grises.
// Separador de millares garantizado por regex (independiente del locale del
// navegador). Compartido entre Posición global (Home) y Análisis (Dashboard)
// para que los totales luzcan idénticos.

/** Formatea un importe con separador de millares: 7725.9 → "7.725,90 €". */
export function fmtAmount(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  return `${sign}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`
}

export function AmountSplit({ amount, intClass, decClass, color }: {
  amount: number
  intClass: string
  decClass: string
  color?: string
}) {
  const sign = amount < 0 ? '-' : ''
  const [int, dec] = Math.abs(amount).toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (
    <>
      <span className={intClass} style={color ? { color } : undefined}>{sign}{intFmt}</span>
      <span className={decClass} style={color ? { color, opacity: 0.7 } : undefined}>,{dec} €</span>
    </>
  )
}

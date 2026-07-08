/**
 * Detección del recibo/liquidación de una tarjeta de crédito.
 *
 * En una tarjeta de crédito, el pago mensual con el que se salda lo gastado
 * ("recuperación del crédito") aparece como un abono (importe positivo). No es
 * un ingreso real del patrimonio, sino la devolución de un crédito ya
 * consumido, así que debe marcarse como `no_computable`.
 *
 * Función pura para poder razonarla/probarla aislada. Solo debe aplicarse a
 * cuentas de tipo `tarjeta_credito` y a movimientos de importe positivo (el
 * emisor del cargo lo decide quien la llama, en useImport).
 */

function normalizeConcept(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/\s+/g, ' ')
    .trim()
}

// Patrones de concepto que delatan la liquidación/recibo de la tarjeta.
const SETTLEMENT_PATTERNS: RegExp[] = [
  /RECIBO\s+MES\s+ANTERIOR/,
  /LIQUIDACION/,
  /(PAGO|ADEUDO)\s+RECIBO/,
  /RECIBO\s+TARJETA/,
  /PAGO\s+TARJETA/,
]

/** ¿El concepto parece el recibo/liquidación de una tarjeta de crédito? */
export function isCardSettlementConcept(concept: string): boolean {
  const c = normalizeConcept(concept)
  return SETTLEMENT_PATTERNS.some(re => re.test(c))
}

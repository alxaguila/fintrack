/**
 * Detección del recibo/liquidación de una tarjeta de crédito.
 *
 * Es un mismo hecho con dos patas, ninguna es ingreso/gasto real:
 *   1. En la propia tarjeta: el pago mensual con el que se salda lo gastado
 *      ("recuperación del crédito") aparece como un abono (importe positivo).
 *   2. En la cuenta bancaria que la financia: el cargo (importe negativo) que
 *      sale para pagar esa liquidación.
 * Ambas deben marcarse como `no_computable`.
 *
 * Función pura para poder razonarla/probarla aislada. El concepto por sí solo
 * es una señal fiable en ambos lados (no hace falta emparejar por importe,
 * a diferencia de las transferencias entre cuentas en transferMatch.ts). Quien
 * llama (useImport) decide qué combinación de tipo de cuenta + signo aplica.
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

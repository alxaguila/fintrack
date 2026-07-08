/**
 * Cálculo del saldo corrido cuando el extracto NO trae columna de saldo.
 *
 * Partimos de un único saldo "ancla" conocido (el que introduce el usuario en el
 * primer import, o un saldo ya calculado y guardado en imports posteriores) y
 * propagamos el resto de saldos a partir de él. Sobre una lista de movimientos
 * ordenada cronológicamente (más antiguo → más reciente) con suma acumulada
 * inclusiva `S(i)`:
 *
 *     balance(i) = anclaBalance + (S(i) - S(ancla))
 *
 * Equivale a sumar hacia delante (saldo = saldo previo + importe) y restar hacia
 * atrás (saldo previo = saldo - importe). Funciona en ambos sentidos, así que sirve
 * tanto para reconstruir el histórico del primer extracto como para encadenar
 * extractos futuros (más recientes o backfill de periodos anteriores).
 */
export interface BalanceMovement {
  /** Fecha ISO (YYYY-MM-DD). Solo informativa aquí: el orden ya viene dado. */
  date: string
  /** Importe con signo: negativo = cargo, positivo = abono. */
  amount: number
}

/** Redondeo a 2 decimales evitando el ruido de coma flotante (los importes son DECIMAL(15,2)). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Devuelve un array paralelo a `movements` con el saldo DESPUÉS de cada movimiento.
 *
 * @param movements   Movimientos ya ordenados cronológicamente.
 * @param anchorIndex Índice del movimiento cuyo saldo posterior es `anchorBalance`.
 * @param anchorBalance Saldo conocido tras el movimiento `anchorIndex`.
 */
export function propagateBalances(
  movements: BalanceMovement[],
  anchorIndex: number,
  anchorBalance: number,
): number[] {
  const n = movements.length
  const result = new Array<number>(n)
  if (n === 0 || anchorIndex < 0 || anchorIndex >= n) return result

  result[anchorIndex] = round2(anchorBalance)

  // Hacia delante: saldo(i) = saldo(i-1) + importe(i)
  let running = anchorBalance
  for (let i = anchorIndex + 1; i < n; i++) {
    running += movements[i].amount
    result[i] = round2(running)
  }

  // Hacia atrás: saldo(i-1) = saldo(i) - importe(i)
  running = anchorBalance
  for (let i = anchorIndex; i > 0; i--) {
    running -= movements[i].amount
    result[i - 1] = round2(running)
  }

  return result
}

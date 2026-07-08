/**
 * Detección de transferencias entre cuentas propias del mismo perfil.
 *
 * Cuando el usuario sube extractos de varias cuentas, una transferencia interna
 * aparece como dos movimientos independientes (una salida en una cuenta y una
 * entrada en otra). Ninguno es dinero real entrando/saliendo del patrimonio, así
 * que ambas patas deben marcarse como `no_computable`.
 *
 * Dos movimientos son pareja de transferencia si, dentro del mismo perfil:
 *   1. están en cuentas distintas,
 *   2. tienen importe espejo (uno +X y otro −X, mismo valor absoluto al céntimo),
 *   3. sus fechas distan como mucho WINDOW_DAYS días,
 *   4. al menos una pata tiene un concepto de transferencia, y
 *      comparten algún token significativo (p. ej. el nombre del titular) o
 *      ambas son claramente transferencias.
 *
 * La función es pura para poder razonarla/probarla aislada del acceso a datos.
 */

import type { TransactionType } from '@/lib/database.types'

/** Margen de días entre las dos patas para considerarlas la misma transferencia. */
export const WINDOW_DAYS = 3

// Raíces que delatan una transferencia: TRANSF(ERENCIA/ER), TRASP(ASO).
const TRANSFER_ROOTS = ['TRANSF', 'TRASP']

// Palabras de relleno que no identifican la contraparte (prefijos de banco,
// conectores y ruido habitual en conceptos de transferencia).
const STOPWORDS = new Set([
  'TRANSFERENCIA', 'TRANSFER', 'TRANSF', 'TRASPASO', 'TRASP', 'TRANSFERENCIAS',
  'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'UN', 'UNA', 'AL', 'PARA', 'POR',
  'FAVOR', 'ORDENANTE', 'BENEFICIARIO', 'CONCEPTO', 'REF', 'REFERENCIA',
  'CUENTA', 'CTA', 'IBAN', 'INTERNA', 'INTERNO', 'RECIBIDA', 'EMITIDA',
  'ENVIADA', 'INMEDIATA', 'PERIODICA', 'NACIONAL',
])

function normalizeConcept(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/\s+/g, ' ')
    .trim()
}

/** ¿El concepto parece una transferencia/traspaso? */
export function isTransferConcept(concept: string): boolean {
  const c = normalizeConcept(concept)
  return TRANSFER_ROOTS.some(r => c.includes(r))
}

/**
 * Tokens significativos de un concepto de transferencia: nombre de la contraparte
 * y texto libre, sin prefijos de banco, números ni códigos de referencia.
 *
 * "TRANSF PARA ALEX DEL AGUILA ARCOS RENTA"  → ['ALEX','AGUILA','ARCOS','RENTA']
 * "TRANSFERENCIA DE ALEX DEL AGUILA, CONCEPTO" → ['ALEX','AGUILA']
 */
export function transferTokens(concept: string): string[] {
  let s = normalizeConcept(concept)
  s = s.replace(/[^A-Z0-9 ]/g, ' ')            // puntuación → espacio
  s = s.replace(/\b[A-Z]?\d[0-9A-Z]*\b/g, ' ') // códigos alfanuméricos con dígitos
  s = s.replace(/\b\d+\b/g, ' ')               // números puros
  const tokens: string[] = []
  for (const w of s.split(/\s+/)) {
    if (w.length < 3) continue
    if (STOPWORDS.has(w)) continue
    if (tokens[tokens.length - 1] === w) continue // duplicados consecutivos
    tokens.push(w)
  }
  return tokens
}

/** ¿Comparten al menos un token significativo (p. ej. el nombre del titular)? */
function haveSharedToken(a: string, b: string): boolean {
  const ta = new Set(transferTokens(a))
  if (ta.size === 0) return false
  return transferTokens(b).some(t => ta.has(t))
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime()
  const db = new Date(`${b}T00:00:00`).getTime()
  return Math.abs(da - db) / 86_400_000
}

/** Movimiento mínimo necesario para el emparejamiento. */
export interface TxLite {
  id: string
  account_id: string
  date: string // YYYY-MM-DD
  amount: number
  concept: string
  transaction_type: TransactionType | null
}

/**
 * Devuelve las parejas `[idSalida, idEntrada]` de movimientos que son las dos
 * patas de una misma transferencia entre cuentas del perfil. Cada movimiento se
 * empareja como mucho una vez. Los ya marcados `no_computable` se ignoran como
 * candidatos (evita re-emparejar sin necesidad de una columna de enlace).
 */
export function findTransferPairs(txs: TxLite[]): Array<[string, string]> {
  const candidates = txs.filter(t => t.transaction_type !== 'no_computable' && t.amount !== 0)

  // Agrupar por importe absoluto (en céntimos) para comparar solo espejos.
  const byAmount = new Map<number, TxLite[]>()
  for (const t of candidates) {
    const key = Math.round(Math.abs(t.amount) * 100)
    const bucket = byAmount.get(key)
    if (bucket) bucket.push(t)
    else byAmount.set(key, [t])
  }

  const used = new Set<string>()
  const pairs: Array<[string, string]> = []

  for (const group of byAmount.values()) {
    const negatives = group.filter(t => t.amount < 0)
    const positives = group.filter(t => t.amount > 0)
    if (negatives.length === 0 || positives.length === 0) continue

    for (const neg of negatives) {
      if (used.has(neg.id)) continue
      const negIsTransfer = isTransferConcept(neg.concept)

      // Mejor candidato: primero los que comparten token (más fiables), luego el
      // de fecha más cercana.
      let best: { pos: TxLite; days: number; shared: boolean } | null = null
      for (const pos of positives) {
        if (used.has(pos.id)) continue
        if (pos.account_id === neg.account_id) continue

        const days = daysBetween(neg.date, pos.date)
        if (days > WINDOW_DAYS) continue

        const posIsTransfer = isTransferConcept(pos.concept)
        if (!negIsTransfer && !posIsTransfer) continue

        const shared = haveSharedToken(neg.concept, pos.concept)
        if (!shared && !(negIsTransfer && posIsTransfer)) continue

        if (
          !best ||
          (shared && !best.shared) ||
          (shared === best.shared && days < best.days)
        ) {
          best = { pos, days, shared }
        }
      }

      if (best) {
        used.add(neg.id)
        used.add(best.pos.id)
        pairs.push([neg.id, best.pos.id])
      }
    }
  }

  return pairs
}

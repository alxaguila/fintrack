/**
 * Genera un hash determinista para deduplicar movimientos.
 * Basado en: fecha + hora + importe + concepto normalizado + ocurrencia.
 *
 * - La HORA (si el extracto la trae) distingue movimientos que coinciden en
 *   fecha/importe/concepto pero ocurrieron a horas distintas.
 * - La OCURRENCIA (0,1,2…) distingue movimientos genuinamente idénticos dentro
 *   del mismo extracto sin violar la restricción única, y al ser determinista
 *   permite que al reimportar el mismo extracto se detecten como duplicados.
 *
 * Usa Web Crypto API (disponible en todos los navegadores modernos).
 */
export async function generateDedupHash(
  date: string,       // 'YYYY-MM-DD'
  time: string,       // 'HH:mm' o '' si no hay hora
  amount: number,
  concept: string,
  occurrence = 0,
): Promise<string> {
  const normalized = concept.toLowerCase().trim().replace(/\s+/g, ' ')
  const raw = `${date}|${time}|${amount.toFixed(2)}|${normalized}|${occurrence}`
  const buffer = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Versión síncrona (sin crypto.subtle) para uso en contextos síncronos.
 * Suficiente para deduplicación — no es uso criptográfico.
 */
export function generateDedupHashSync(
  date: string,
  time: string,
  amount: number,
  concept: string,
  occurrence = 0,
): string {
  const normalized = concept.toLowerCase().trim().replace(/\s+/g, ' ')
  const raw = `${date}|${time}|${amount.toFixed(2)}|${normalized}|${occurrence}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  // Combinamos con longitud para reducir colisiones
  return `${Math.abs(hash).toString(36)}_${raw.length.toString(36)}_${raw.slice(0, 8).replace(/[^a-z0-9]/gi, '')}`
}

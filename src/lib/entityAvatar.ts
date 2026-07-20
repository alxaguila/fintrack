// Resolución del avatar de entidad (banco/broker) para la fila de un movimiento:
// logo real del catálogo bank_entities si existe, o inicial + color de la cuenta
// como fallback. Mismo patrón que ya usan Accounts.tsx / AccountCard.tsx.
import type { Account } from './database.types'

export interface EntityAvatar {
  logoUrl: string | null
  initial: string
  color: string
}

/**
 * `entityLogoByName`: mapa `entity.trim().toLowerCase() → logo_url` construido
 * desde useBankEntities() (mismo criterio que Accounts.tsx). `account.logo_url`
 * (override propio de la cuenta) gana sobre el logo del catálogo.
 */
export function resolveEntityAvatar(
  account: Account | undefined,
  entityLogoByName: Map<string, string | null>,
): EntityAvatar {
  const entity = account?.entity ?? ''
  const catalogLogo = entity ? entityLogoByName.get(entity.trim().toLowerCase()) ?? null : null
  return {
    logoUrl: account?.logo_url || catalogLogo || null,
    initial: (entity.trim().charAt(0) || '?').toUpperCase(),
    color: account?.color ?? '#94a3b8',
  }
}

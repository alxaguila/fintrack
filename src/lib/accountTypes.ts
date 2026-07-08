import { Landmark, PiggyBank, CreditCard, TrendingUp, type LucideIcon } from 'lucide-react'
import type { AccountType } from './database.types'

/**
 * Metadatos por tipo de cuenta: color e icono.
 * - El color tinta SOLO la pastilla de tipo (no la banda superior de la tarjeta,
 *   que sigue usando el color por cuenta que elige el usuario).
 * - Mapa extensible: añadir `valores`/`fondos` en el futuro es sumar su entrada.
 */
export const ACCOUNT_TYPE_META: Record<string, { color: string; icon: LucideIcon }> = {
  cuenta_corriente: { color: '#6366f1', icon: Landmark },   // índigo
  ahorro:           { color: '#f59e0b', icon: PiggyBank },  // ámbar
  tarjeta_credito:  { color: '#8b5cf6', icon: CreditCard }, // violeta
  tarjeta_debito:   { color: '#0ea5e9', icon: CreditCard }, // azul cielo
  valores:          { color: '#10b981', icon: TrendingUp }, // esmeralda (futuro)
  fondos:           { color: '#10b981', icon: TrendingUp },
}

export function accountTypeMeta(type: string) {
  return ACCOUNT_TYPE_META[type] ?? { color: '#64748b', icon: Landmark }
}

/** Filtros/secciones de la página de Cuentas y los tipos que agrupa cada uno. */
export type AccountFilter = 'all' | 'checking' | 'savings' | 'cards' | 'securities'

/** Clave de sección (todas menos "all", que muestra todas las secciones). */
export type AccountSection = Exclude<AccountFilter, 'all'>

export const FILTER_TYPES: Record<AccountSection, AccountType[]> = {
  checking: ['cuenta_corriente'],
  savings: ['ahorro'],
  cards: ['tarjeta_credito', 'tarjeta_debito'],
  securities: ['valores'],
}

/** Orden de las secciones y el tipo que preselecciona su tarjeta de "añadir". */
export const ACCOUNT_SECTIONS: { key: AccountSection; defaultType?: AccountType }[] = [
  { key: 'checking', defaultType: 'cuenta_corriente' },
  { key: 'savings', defaultType: 'ahorro' },
  { key: 'cards', defaultType: 'tarjeta_credito' },
  { key: 'securities', defaultType: 'valores' },
]

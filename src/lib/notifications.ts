import type { Notification, NotificationAccount } from './database.types'

/**
 * Igual criterio que AccountCard.tsx/AccountForm.tsx: una cuenta "tiene alias"
 * cuando su nombre difiere de la entidad; si no, el nombre guardado es solo
 * la entidad repetida (el usuario dejó el alias en blanco al crearla).
 * `account` viene de un join en vivo por account_id (no de un snapshot
 * guardado en el payload), así que siempre refleja el estado actual de la
 * cuenta — si falta (p. ej. cuenta borrada), se muestra tal cual `accountName`.
 */
export function accountDisplayLabel(
  accountName: string,
  account: NotificationAccount | null | undefined,
  accountTypeLabel: (type: string) => string,
): string {
  if (!account) return accountName
  const hasAlias = account.name.trim().toLowerCase() !== account.entity.trim().toLowerCase()
  if (hasAlias) return account.name
  return `${account.entity} - ${accountTypeLabel(account.type)}`
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

/**
 * Texto de una notificación tal y como se ve en la lista del popover de la
 * campana — reutilizado también por el ticker para no duplicar el formato.
 * `hasMultipleProfiles` decide entre la variante con/sin perfil entre
 * paréntesis (namespace `notifications`); `tc` es el namespace `common`,
 * necesario solo para traducir el tipo de cuenta en `account_stale`.
 */
export function notificationListItemText(
  n: Notification,
  hasMultipleProfiles: boolean,
  t: TranslateFn,
  tc: TranslateFn,
): string {
  if (!n.payload) return ''
  const key = hasMultipleProfiles ? `${n.type}.list_item` : `${n.type}.list_item_no_profile`
  if (n.type === 'account_stale') {
    const account_name = accountDisplayLabel(n.payload.account_name, n.account, (type) => tc(`account_type.${type}`))
    return t(key, { ...n.payload, account_name })
  }
  return t(key, { ...n.payload })
}

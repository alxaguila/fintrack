import type { LucideIcon } from 'lucide-react'
import { Landmark, Tags, Users, BarChart3, Vote, Store, Ticket, MessageSquare } from 'lucide-react'
import { appPath } from '@/lib/appUrl'

export type AdminNavKey = 'bancos' | 'categorias' | 'usuarios' | 'estadisticas' | 'reglas' | 'comercios' | 'codigos' | 'feedback'

/**
 * Fuente única de las secciones de /admin, compartida por el hub (Admin.tsx)
 * y el desplegable rápido del sidebar (Sidebar.tsx AdminMenu) — antes eran
 * dos listas mantenidas a mano por separado, y una se quedó desactualizada
 * al añadir Códigos. Los indicadores "dot" (pendientes/no leídos) siguen
 * calculándose en cada consumidor, ya que dependen de hooks con datos en vivo.
 */
export const ADMIN_NAV_ITEMS: { key: AdminNavKey; to: string; icon: LucideIcon; labelKey: string; descKey: string }[] = [
  { key: 'bancos', to: appPath('/admin/bancos'), icon: Landmark, labelKey: 'hub.banks', descKey: 'hub.banks_desc' },
  { key: 'categorias', to: appPath('/admin/categorias'), icon: Tags, labelKey: 'hub.categories', descKey: 'hub.categories_desc' },
  { key: 'usuarios', to: appPath('/admin/usuarios'), icon: Users, labelKey: 'hub.users', descKey: 'hub.users_desc' },
  { key: 'estadisticas', to: appPath('/admin/estadisticas'), icon: BarChart3, labelKey: 'hub.stats', descKey: 'hub.stats_desc' },
  { key: 'reglas', to: appPath('/admin/reglas'), icon: Vote, labelKey: 'hub.rules', descKey: 'hub.rules_desc' },
  { key: 'comercios', to: appPath('/admin/comercios'), icon: Store, labelKey: 'hub.merchants', descKey: 'hub.merchants_desc' },
  { key: 'codigos', to: appPath('/admin/codigos'), icon: Ticket, labelKey: 'hub.codes', descKey: 'hub.codes_desc' },
  { key: 'feedback', to: appPath('/admin/feedback'), icon: MessageSquare, labelKey: 'hub.feedback', descKey: 'hub.feedback_desc' },
]

import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Upload, Wallet, Settings, Tags, Sparkles, FileClock, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { LanguageSelector } from './LanguageSelector'

const navItems = [
  { to: '/',             icon: Home,           label: 'nav.home' },
  { to: '/analysis',     icon: BarChart3,      label: 'nav.analysis' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'nav.transactions' },
  { to: '/accounts',     icon: Wallet,         label: 'nav.accounts' },
  { to: '/history',      icon: FileClock,      label: 'nav.history' },
]

const importItem = { to: '/import', icon: Upload, label: 'nav.import' }
const settingsItem = { to: '/settings', icon: Settings, label: 'nav.settings' }

export function Sidebar() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const onTransactions = location.pathname.startsWith('/transactions')
  const { isAdmin } = useIsAdmin()
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(isAdmin)

  return (
    <aside className="hidden h-screen w-60 flex-col bg-slate-900 text-slate-100 md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold lowercase tracking-tight text-white">fintrack</span>
          <span className="text-[10px] font-medium text-slate-500">{APP_VERSION}</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <div key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(label)}
            </NavLink>

            {/* Submenú: Reglas de clasificación (visible al estar en Movimientos) */}
            {to === '/transactions' && onTransactions && (
              <NavLink
                to="/transactions/rules"
                className={({ isActive }) =>
                  cn(
                    'mt-1 ml-4 flex items-center gap-3 rounded-lg border-l border-slate-700 px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Tags className="h-4 w-4 shrink-0" />
                {t('nav.rules')}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Grupo inferior: Importar (CTA) justo encima de Ajustes */}
      <div className="px-3 pb-1 space-y-1">
        {/* CTA: Importar extractos — funcionalidad básica de la app */}
        <NavLink
          to={importItem.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg bg-teal-500 px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-teal-400',
              isActive && 'ring-2 ring-teal-300'
            )
          }
        >
          <importItem.icon className="h-5 w-5 shrink-0" />
          {t(importItem.label)}
        </NavLink>

        <NavLink
          to={settingsItem.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )
          }
        >
          <settingsItem.icon className="h-4 w-4 shrink-0" />
          {t(settingsItem.label)}
        </NavLink>

        {/* Panel de administración — solo visible para admins. */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Shield className="h-4 w-4 shrink-0" />
            {t('nav.admin')}
            {pendingEntities > 0 && (
              <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label={t('nav.admin_pending')} />
            )}
          </NavLink>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3 space-y-1">
        <LanguageSelector />
      </div>
    </aside>
  )
}

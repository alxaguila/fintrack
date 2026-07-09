import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Wallet, FileClock, Upload, Settings, Shield, Sparkles, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { LanguageSelector } from './LanguageSelector'

// Destinos principales: van en la barra inferior con scroll horizontal.
const bottomItems = [
  { to: '/',             icon: Home,           label: 'nav.short.home' },
  { to: '/analysis',     icon: BarChart3,      label: 'nav.short.analysis' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'nav.short.transactions' },
  { to: '/accounts',     icon: Wallet,         label: 'nav.short.accounts' },
  { to: '/history',      icon: FileClock,      label: 'nav.short.history' },
]

/** Barra inferior de navegación (solo móvil). Scroll horizontal: el último icono
 *  queda parcialmente cortado como señal de que se puede deslizar. */
export function MobileBottomNav() {
  const { t } = useTranslation('common')

  return (
    <nav className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-t border-slate-200 bg-white px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
      {bottomItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors',
              isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:bg-slate-100'
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate">{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

/** Barra superior con logo + hamburguesa que abre un drawer con las acciones
 *  secundarias (Importar, Ajustes, idioma, cerrar sesión). Solo móvil. */
export function MobileTopBar() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { isAdmin } = useIsAdmin()

  // Cerrar el drawer al navegar.
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Bloquear scroll del body mientras el drawer está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold lowercase tracking-tight text-slate-900">fintrack</span>
            <span className="text-[10px] font-medium text-slate-400">{APP_VERSION}</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label={t('nav.menu')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col rounded-l-2xl bg-slate-900 text-slate-100 shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-sm font-bold text-slate-300">{t('nav.menu')}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={t('actions.close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              <NavLink
                to="/import"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg bg-teal-500 px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-teal-400',
                    isActive && 'ring-2 ring-teal-300'
                  )
                }
              >
                <Upload className="h-5 w-5 shrink-0" />
                {t('nav.import')}
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Settings className="h-4 w-4 shrink-0" />
                {t('nav.settings')}
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  {t('nav.admin')}
                </NavLink>
              )}
            </div>

            <div className="border-t border-slate-700 p-3 space-y-1">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

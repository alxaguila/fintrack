import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Wallet, FileClock, Upload, Shield, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { useUserSettings } from '@/hooks/useUserSettings'
import { Logo } from '@/components/Logo'
import { LanguageSelector } from './LanguageSelector'

// Destinos principales: van en la barra inferior con scroll horizontal.
const bottomItems = [
  { to: '/app',              icon: Home,           label: 'nav.short.home' },
  { to: '/app/analysis',     icon: BarChart3,      label: 'nav.short.analysis' },
  { to: '/app/transactions', icon: ArrowLeftRight, label: 'nav.short.transactions' },
  { to: '/app/accounts',     icon: Wallet,         label: 'nav.short.accounts' },
  { to: '/app/history',      icon: FileClock,      label: 'nav.short.history' },
]

/** Barra inferior de navegación (solo móvil). Mismo lenguaje que el sidebar de
 *  escritorio: fondo navy, activo elevado con indicador coral. */
export function MobileBottomNav() {
  const { t } = useTranslation('common')

  return (
    <nav className="flex shrink-0 items-stretch gap-1 overflow-x-auto bg-[var(--brand-ink)] px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
      {bottomItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app'}
          className={({ isActive }) =>
            cn(
              'relative flex min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'bg-[var(--brand-ink-2)] text-white'
                : 'text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-[#E7F0F5]',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-3 right-3 top-0 h-[3px] rounded-b-[3px] bg-[var(--brand-accent)]" />}
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
              <span className="max-w-full truncate">{t(label)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/** Barra superior con el logo (mismo wordmark/color que el sidebar) + hamburguesa
 *  que abre un drawer con las acciones secundarias. Solo móvil. */
export function MobileTopBar() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { isAdmin } = useIsAdmin()
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(isAdmin)
  const { data: settings } = useUserSettings()
  const userName = settings?.first_name?.trim() || ''
  const userInitial = (userName.charAt(0) || 'U').toUpperCase()
  const planKey = settings?.plan ?? 'free'

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
      <header className="flex h-14 shrink-0 items-center justify-between bg-[var(--brand-ink)] px-4 text-white md:hidden">
        <Logo size={26} version={APP_VERSION} />
        <button
          onClick={() => setOpen(true)}
          aria-label={t('nav.menu')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--side-text)] transition-colors hover:bg-[var(--side-hover-bg)] hover:text-white"
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
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col rounded-l-2xl bg-[var(--brand-ink)] text-[var(--side-text)] shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-sm font-bold text-[var(--side-heading)]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{t('nav.menu')}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={t('actions.close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--side-text-muted)] transition-colors hover:bg-[var(--side-hover-bg)] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              <NavLink
                to="/app/import"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[11px] bg-[var(--brand-accent)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#F55E3E]',
                    isActive && 'ring-2 ring-[#FF9784]',
                  )
                }
                style={{ boxShadow: 'var(--shadow-cta)' }}
              >
                <Upload className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                {t('nav.import')}
              </NavLink>

              <NavLink
                to="/app/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[11px] px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--brand-ink-2)] font-medium text-white'
                      : 'text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-white',
                  )
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-3)]/15 text-[13px] font-semibold text-[var(--brand-primary-3)]">
                  {userInitial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-tight text-[#E7F0F5]">{userName || t('sidebar.user_fallback')}</span>
                  <span className="block truncate text-[11px] leading-tight text-[var(--side-text-muted)]">
                    {t('sidebar.plan_label', { plan: t(`plan.name.${planKey}`) })}
                  </span>
                </span>
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/app/admin"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-[11px] px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-[var(--brand-ink-2)] font-medium text-white'
                        : 'text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-white',
                    )
                  }
                >
                  <Shield className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t('nav.admin')}
                  {pendingEntities > 0 && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--brand-accent)]" aria-label={t('nav.admin_pending')} />
                  )}
                </NavLink>
              )}
            </div>

            <div className="border-t border-[#16344E] p-3 space-y-1">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

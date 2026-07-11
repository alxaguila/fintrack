import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Upload, Wallet, Settings, Tags, FileClock, Shield, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { Logo } from '@/components/Logo'

const navItems = [
  { to: '/',             icon: Home,           label: 'nav.home' },
  { to: '/analysis',     icon: BarChart3,      label: 'nav.analysis' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'nav.transactions' },
  { to: '/accounts',     icon: Wallet,         label: 'nav.accounts' },
  { to: '/history',      icon: FileClock,      label: 'nav.history' },
]

const settingsItem = { to: '/settings', icon: Settings, label: 'nav.settings' }

// Estilo compartido de item de nav (dolfin): activo = navy elevado + barra coral.
const itemClass = (isActive: boolean) =>
  cn(
    'relative flex items-center gap-3 rounded-[11px] px-3 py-[11px] text-sm transition-colors',
    isActive
      ? 'bg-[var(--brand-ink-2)] font-medium text-white'
      : 'font-normal text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-[#E7F0F5]',
  )

// Barra coral del item activo (indicador a la izquierda).
function ActiveBar() {
  return <span className="absolute bottom-[9px] left-0 top-[9px] w-[3px] rounded-[3px] bg-[var(--brand-accent)]" />
}

export function Sidebar() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const onTransactions = location.pathname.startsWith('/transactions')
  const { isAdmin } = useIsAdmin()
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(isAdmin)

  return (
    <aside className="hidden h-screen w-[242px] flex-col bg-[var(--brand-ink)] px-[18px] pb-[22px] pt-[26px] text-[var(--side-text)] md:flex">
      {/* Logo — la versión va en la baseline del wordmark */}
      <div className="flex items-center px-2 pb-1 text-white">
        <Logo size={30} version={APP_VERSION} />
      </div>

      {/* Navegación principal */}
      <div className="mt-[30px] px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--side-heading)]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        {t('sidebar.section_main')}
      </div>
      <nav className="mt-3 flex flex-col gap-[3px]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <div key={to}>
            <NavLink to={to} end={to === '/'} className="block">
              {({ isActive }) => (
                <span className={itemClass(isActive)}>
                  {isActive && <ActiveBar />}
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t(label)}
                </span>
              )}
            </NavLink>

            {/* Submenú: Reglas de clasificación (visible al estar en Movimientos) */}
            {to === '/transactions' && onTransactions && (
              <NavLink
                to="/transactions/rules"
                className={({ isActive }) =>
                  cn(
                    'ml-4 mt-1 flex items-center gap-3 rounded-[11px] border-l border-[var(--brand-ink-2)] px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--brand-ink-2)] font-medium text-white'
                      : 'font-normal text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-[#E7F0F5]',
                  )
                }
              >
                <Tags className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.rules')}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Parte inferior: tarjeta de confianza + Importar (CTA) / Ajustes / Admin */}
      <div className="mt-auto flex flex-col gap-[14px] pt-4">
        <div className="rounded-[14px] border border-[#1A4763] bg-[var(--brand-ink-2)] p-[15px]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--brand-primary-3)]">
            <ShieldCheck className="h-[15px] w-[15px] shrink-0" strokeWidth={1.6} />
            {t('sidebar.trust_title')}
          </div>
          <p className="mt-[7px] text-[11.5px] leading-relaxed text-[#8FA9B8]">{t('sidebar.trust_body')}</p>
        </div>

        <div className="flex flex-col gap-[3px]">
          {/* CTA: Importar extractos — acción primaria de la app */}
          <NavLink
            to="/import"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[11px] bg-[var(--brand-accent)] px-3 py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#F55E3E]',
                isActive && 'ring-2 ring-[#FF9784]',
              )
            }
            style={{ boxShadow: 'var(--shadow-cta)' }}
          >
            <Upload className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            {t('nav.import')}
          </NavLink>

          <NavLink to={settingsItem.to} className="block">
            {({ isActive }) => (
              <span className={itemClass(isActive)}>
                {isActive && <ActiveBar />}
                <settingsItem.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t(settingsItem.label)}
              </span>
            )}
          </NavLink>

          {/* Panel de administración — solo visible para admins. */}
          {isAdmin && (
            <NavLink to="/admin" className="block">
              {({ isActive }) => (
                <span className={itemClass(isActive)}>
                  {isActive && <ActiveBar />}
                  <Shield className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t('nav.admin')}
                  {pendingEntities > 0 && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--brand-accent)]" aria-label={t('nav.admin_pending')} />
                  )}
                </span>
              )}
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  )
}

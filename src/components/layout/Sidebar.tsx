import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Upload, Wallet, Tags, FileClock, Shield, ShieldCheck, Sparkles, Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { appPath } from '@/lib/appUrl'
import { APP_VERSION } from '@/lib/version'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useBudgetsGate } from '@/hooks/useBudgetsGate'
import { Logo } from '@/components/Logo'
import { UpgradePlanDialog } from '@/components/plan/UpgradePlanDialog'
import { UpgradeHintDialog } from '@/components/plan/UpgradeHintDialog'

const navItemsTop = [
  { to: appPath(),             icon: Home,           label: 'nav.home' },
  { to: appPath('/analysis'),  icon: BarChart3,      label: 'nav.analysis' },
]
const navItemsBottom = [
  { to: appPath('/transactions'), icon: ArrowLeftRight, label: 'nav.transactions' },
  { to: appPath('/accounts'),     icon: Wallet,         label: 'nav.accounts' },
  { to: appPath('/history'),      icon: FileClock,      label: 'nav.history' },
]

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

// Bloque de usuario (sustituye al botón "Ajustes"): avatar con inicial, nombre
// y plan de suscripción. Mismo destino y comportamiento que Ajustes tenía.
function UserPlanNavItem() {
  const { t } = useTranslation('common')
  const { data: settings } = useUserSettings()
  const name = settings?.first_name?.trim() || ''
  const initial = (name.charAt(0) || 'U').toUpperCase()
  const planKey = settings?.plan ?? 'free'

  return (
    <NavLink to={appPath('/settings')} className="block">
      {({ isActive }) => (
        <span className={itemClass(isActive)}>
          {isActive && <ActiveBar />}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-3)]/15 text-[13px] font-semibold text-[var(--brand-primary-3)]">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate leading-tight text-[#E7F0F5]">{name || t('sidebar.user_fallback')}</span>
            <span className="block truncate text-[11px] leading-tight text-[var(--side-text-muted)]">
              {t('sidebar.plan_label', { plan: t(`plan.name.${planKey}`) })}
            </span>
          </span>
        </span>
      )}
    </NavLink>
  )
}

// Ítem "Presupuestos": la función todavía no existe para nadie, pero PRO/PREMIUM
// ya navegan a la página "muy pronto"; FREE ve el aviso de mejora de plan.
function BudgetsNavItem() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const hasBudget = useBudgetsGate()
  const [hintOpen, setHintOpen] = useState(false)
  const isActive = location.pathname.startsWith(appPath('/budgets'))

  if (hasBudget) {
    return (
      <NavLink to={appPath('/budgets')} className="block">
        {({ isActive }) => (
          <span className={itemClass(isActive)}>
            {isActive && <ActiveBar />}
            <Calculator className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
            {t('nav.budgets')}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setHintOpen(true)} className="block w-full text-left">
        <span className={itemClass(isActive)}>
          {isActive && <ActiveBar />}
          <Calculator className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
          {t('nav.budgets')}
        </span>
      </button>
      <UpgradeHintDialog
        open={hintOpen}
        onOpenChange={setHintOpen}
        title={t('budgets.hint_title')}
        description={t('budgets.hint_body')}
      />
    </>
  )
}

// Botón "Mejorar plan": solo visible para FREE (PRO/PREMIUM ya tienen lo mejor
// disponible o aún no hay pasarela de pago para ir más allá). Abre el popup con
// las mismas tarjetas de la landing.
function UpgradePlanNavItem() {
  const { t } = useTranslation('common')
  const { data: settings } = useUserSettings()
  const [open, setOpen] = useState(false)
  const isFree = (settings?.plan ?? 'free') === 'free'

  if (!isFree) return null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <span className={cn(itemClass(false), 'text-[var(--brand-accent)] hover:text-[#FF9784]')}>
          <Sparkles className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
          {t('sidebar.upgrade_plan')}
        </span>
      </button>
      <UpgradePlanDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function Sidebar() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const onTransactions = location.pathname.startsWith(appPath('/transactions'))
  const { isAdmin } = useIsAdmin()
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(isAdmin)

  return (
    <aside className="relative hidden h-screen w-[242px] flex-col overflow-hidden bg-[var(--brand-ink)] px-[18px] pb-[22px] pt-[26px] text-[var(--side-text)] md:flex">
      {/* Foco de luz decorativo — mismo efecto que la cabecera del popup de planes */}
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-[220px] w-[220px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(56,176,214,.3),transparent 70%)' }}
      />

      <div className="relative flex flex-1 flex-col">
      {/* Logo — la versión va en la baseline del wordmark */}
      <div className="flex items-center px-2 pb-1 text-white">
        <Logo size={30} version={APP_VERSION} />
      </div>

      {/* Navegación principal */}
      <nav className="mt-7 flex flex-col gap-[3px]">
        {navItemsTop.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === appPath()} className="block">
            {({ isActive }) => (
              <span className={itemClass(isActive)}>
                {isActive && <ActiveBar />}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t(label)}
              </span>
            )}
          </NavLink>
        ))}

        <BudgetsNavItem />

        {navItemsBottom.map(({ to, icon: Icon, label }) => (
          <div key={to}>
            <NavLink to={to} end={to === appPath()} className="block">
              {({ isActive }) => (
                <span className={itemClass(isActive)}>
                  {isActive && <ActiveBar />}
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t(label)}
                </span>
              )}
            </NavLink>

            {/* Submenú: Reglas de clasificación (visible al estar en Movimientos) */}
            {to === appPath('/transactions') && onTransactions && (
              <NavLink
                to={appPath('/transactions/rules')}
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
            to={appPath('/import')}
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

          <UserPlanNavItem />
          <UpgradePlanNavItem />

          {/* Panel de administración — solo visible para admins. */}
          {isAdmin && (
            <NavLink to={appPath('/admin')} className="block">
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
      </div>
    </aside>
  )
}

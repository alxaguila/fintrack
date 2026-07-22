import { useEffect, useState } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { Home, BarChart3, ArrowLeftRight, Wallet, Tags, FileClock, Upload, Shield, Menu, X, PiggyBank, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import type { Granularity } from '@/lib/periods'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useBudgetsGate } from '@/hooks/useBudgetsGate'
import { UpgradeHintDialog } from '@/components/plan/UpgradeHintDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/Logo'

// Estilo de item del drawer — mismo lenguaje que el sidebar de escritorio
// (activo = navy elevado + texto blanco).
const drawerItemClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 rounded-[11px] px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-[var(--brand-ink-2)] font-medium text-white'
      : 'text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-white',
  )

// "Presupuestos" dentro del drawer: mismo gate que en escritorio/bottom bar.
function DrawerBudgetsItem() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const hasBudget = useBudgetsGate()
  const [hintOpen, setHintOpen] = useState(false)
  const isActive = location.pathname.startsWith('/app/budgets')

  const content = (
    <>
      <PiggyBank className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
      {t('nav.budgets')}
    </>
  )

  if (hasBudget) {
    return <NavLink to="/app/budgets" className={drawerItemClass(isActive)}>{content}</NavLink>
  }

  return (
    <>
      <button type="button" onClick={() => setHintOpen(true)} className={cn(drawerItemClass(isActive), 'w-full text-left')}>
        {content}
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

// Destinos principales: van en la barra inferior con scroll horizontal.
// "Presupuestos" se intercala aparte (BudgetsBottomNavItem) por su gate de plan.
const bottomItems = [
  { to: '/app',              icon: Home,           label: 'nav.short.home' },
  { to: '/app/analysis',     icon: BarChart3,      label: 'nav.short.analysis' },
  { to: '/app/transactions', icon: ArrowLeftRight, label: 'nav.short.transactions' },
]

const bottomItemClass = (isActive: boolean) =>
  cn(
    'relative flex min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors',
    isActive
      ? 'bg-[var(--brand-ink-2)] text-white'
      : 'text-[var(--side-text-muted)] hover:bg-[var(--side-hover-bg)] hover:text-[#E7F0F5]',
  )

function BottomNavLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  const { t } = useTranslation('common')
  return (
    <NavLink to={to} end={to === '/app'} className={({ isActive }) => bottomItemClass(isActive)}>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-3 right-3 top-0 h-[3px] rounded-b-[3px] bg-[var(--brand-accent)]" />}
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
          <span className="max-w-full truncate">{t(label)}</span>
        </>
      )}
    </NavLink>
  )
}

// "Presupuestos" en la barra inferior: PRO/PREMIUM navegan a la página "muy
// pronto"; FREE ve el aviso de mejora de plan (mismo gate que en el sidebar).
function BudgetsBottomNavItem() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const hasBudget = useBudgetsGate()
  const [hintOpen, setHintOpen] = useState(false)
  const isActive = location.pathname.startsWith('/app/budgets')

  const content = (
    <>
      {isActive && <span className="absolute left-3 right-3 top-0 h-[3px] rounded-b-[3px] bg-[var(--brand-accent)]" />}
      <PiggyBank className="h-5 w-5 shrink-0" strokeWidth={1.7} />
      <span className="max-w-full truncate">{t('nav.short.budgets')}</span>
    </>
  )

  if (hasBudget) {
    return <NavLink to="/app/budgets" className={bottomItemClass(isActive)}>{content}</NavLink>
  }

  return (
    <>
      <button type="button" onClick={() => setHintOpen(true)} className={bottomItemClass(isActive)}>
        {content}
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

/** Barra inferior de navegación (solo móvil): 4 destinos + menú (5º icono, abre
 *  el drawer con las acciones secundarias — antes vivía flotando arriba). Mismo
 *  lenguaje que el sidebar de escritorio: fondo navy, activo elevado con
 *  indicador coral. */
export function MobileBottomNav() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { isAdmin } = useIsAdmin()
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(isAdmin)
  const { data: settings } = useUserSettings()
  const userName = settings?.first_name?.trim() || ''
  const userInitial = (userName.charAt(0) || 'U').toUpperCase()
  const planKey = settings?.plan ?? 'free'
  const onTransactions = location.pathname.startsWith('/app/transactions')

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
      <nav className="flex shrink-0 items-stretch gap-1 overflow-x-auto bg-[var(--brand-ink)] px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
        {bottomItems.slice(0, 2).map(({ to, icon, label }) => <BottomNavLink key={to} to={to} icon={icon} label={label} />)}
        <BudgetsBottomNavItem />
        {bottomItems.slice(2).map(({ to, icon, label }) => <BottomNavLink key={to} to={to} icon={icon} label={label} />)}
        <button type="button" onClick={() => setOpen(true)} aria-label={t('nav.menu')} aria-expanded={open} className={bottomItemClass(open)}>
          {open && <span className="absolute left-3 right-3 top-0 h-[3px] rounded-b-[3px] bg-[var(--brand-accent)]" />}
          <Menu className="h-5 w-5 shrink-0" strokeWidth={1.7} />
          <span className="max-w-full truncate">{t('nav.short.menu')}</span>
        </button>
      </nav>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col rounded-l-2xl bg-[var(--brand-ink)] text-[var(--side-text)] shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo size={26} version={APP_VERSION} className="text-white" />
              <button
                onClick={() => setOpen(false)}
                aria-label={t('actions.close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--side-text-muted)] transition-colors hover:bg-[var(--side-hover-bg)] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              <NavLink to="/app" end className={({ isActive }) => drawerItemClass(isActive)}>
                <Home className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.home')}
              </NavLink>

              <NavLink to="/app/analysis" className={({ isActive }) => drawerItemClass(isActive)}>
                <BarChart3 className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.analysis')}
              </NavLink>

              <DrawerBudgetsItem />

              <NavLink to="/app/transactions" className={({ isActive }) => drawerItemClass(isActive)}>
                <ArrowLeftRight className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.transactions')}
              </NavLink>

              {onTransactions && (
                <NavLink to="/app/transactions/rules" className={({ isActive }) => cn(drawerItemClass(isActive), 'ml-4 border-l border-[var(--brand-ink-2)]')}>
                  <Tags className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t('nav.rules')}
                </NavLink>
              )}

              <NavLink to="/app/accounts" className={({ isActive }) => drawerItemClass(isActive)}>
                <Wallet className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.accounts')}
              </NavLink>

              <NavLink to="/app/history" className={({ isActive }) => drawerItemClass(isActive)}>
                <FileClock className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                {t('nav.history')}
              </NavLink>
            </div>

            <div className="space-y-1 border-t border-[#16344E] px-3 py-2">
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

              <NavLink to="/app/settings" className={({ isActive }) => drawerItemClass(isActive)}>
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
                <NavLink to="/app/admin" className={({ isActive }) => drawerItemClass(isActive)}>
                  <Shield className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
                  {t('nav.admin')}
                  {pendingEntities > 0 && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--brand-accent)]" aria-label={t('nav.admin_pending')} />
                  )}
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Hueco superior derecho (solo móvil): antes tenía el botón hamburguesa (ahora
 *  es el 5º icono de la barra inferior). En Análisis muestra el desplegable de
 *  granularidad (mes/trimestre/año); en el resto de pantallas no renderiza nada.
 *  El valor vive en la URL (`?granularity=`) para que Dashboard.tsx y este
 *  desplegable —dos componentes distintos, sin estado compartido— lean/escriban
 *  la misma fuente de verdad sin necesitar contexto ni prop-drilling. */
export function MobileTopBar() {
  const { t } = useTranslation('dashboard')
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  if (!location.pathname.startsWith('/app/analysis')) return null

  const granularity = (searchParams.get('granularity') as Granularity) || 'month'
  function setGranularity(g: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('granularity', g)
      return next
    }, { replace: true })
  }

  return (
    <div className="fixed right-4 z-40 md:hidden" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 rounded-full bg-[var(--brand-ink)] px-3 py-2 text-xs font-semibold text-white shadow-lg">
            {t(`granularity.${granularity}`)}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={granularity} onValueChange={setGranularity}>
            {(['month', 'quarter', 'year'] as const).map(g => (
              <DropdownMenuRadioItem key={g} value={g}>{t(`granularity.${g}`)}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Landmark, Tags, Users, BarChart3, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Hub de administración. Solo accesible para admins vía <AdminRoute>. Enlaza a
 * las pantallas disponibles; las que aún no existen aparecen deshabilitadas.
 */
export default function Admin() {
  const { t } = useTranslation('admin')

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <MenuLink to="/admin/bancos" icon={Landmark} label={t('hub.banks')} desc={t('hub.banks_desc')} />
        <MenuLink to="/admin/categorias" icon={Tags} label={t('hub.categories')} desc={t('hub.categories_desc')} />
        <MenuLink to="/admin/usuarios" icon={Users} label={t('hub.users')} desc={t('hub.users_desc')} />
        <MenuLink to="/admin/estadisticas" icon={BarChart3} label={t('hub.stats')} desc={t('hub.stats_desc')} />
      </nav>
    </div>
  )
}

function MenuLink({ to, icon: Icon, label, desc }: { to: string; icon: LucideIcon; label: string; desc: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold">{label}</p>
        <p className="truncate text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  )
}

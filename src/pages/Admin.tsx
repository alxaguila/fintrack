import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Landmark, Tags, Users, BarChart3, MessageSquare, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { useUnreadFeedbackCount } from '@/hooks/useAdminFeedback'

/**
 * Hub de administración. Solo accesible para admins vía <AdminRoute>. Enlaza a
 * las pantallas disponibles; las que aún no existen aparecen deshabilitadas.
 */
export default function Admin() {
  const { t } = useTranslation('admin')
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(true)
  const { data: unreadFeedback = 0 } = useUnreadFeedbackCount(true)

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <MenuLink to="/app/admin/bancos" icon={Landmark} label={t('hub.banks')} desc={t('hub.banks_desc')} dot={pendingEntities > 0} />
        <MenuLink to="/app/admin/categorias" icon={Tags} label={t('hub.categories')} desc={t('hub.categories_desc')} />
        <MenuLink to="/app/admin/usuarios" icon={Users} label={t('hub.users')} desc={t('hub.users_desc')} />
        <MenuLink to="/app/admin/estadisticas" icon={BarChart3} label={t('hub.stats')} desc={t('hub.stats_desc')} />
        <MenuLink to="/app/admin/feedback" icon={MessageSquare} label={t('hub.feedback')} desc={t('hub.feedback_desc')} dot={unreadFeedback > 0} />
      </nav>
    </div>
  )
}

function MenuLink({ to, icon: Icon, label, desc, dot }: { to: string; icon: LucideIcon; label: string; desc: string; dot?: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          {label}
          {dot && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
        </p>
        <p className="truncate text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  )
}

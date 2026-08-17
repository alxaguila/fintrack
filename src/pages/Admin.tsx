import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUnreviewedBankCount } from '@/hooks/useAdminBankEntities'
import { useUnreadFeedbackCount } from '@/hooks/useAdminFeedback'
import { ADMIN_NAV_ITEMS, type AdminNavKey } from '@/lib/adminNav'

/**
 * Hub de administración. Solo accesible para admins vía <AdminRoute>. Enlaza a
 * las pantallas disponibles; las que aún no existen aparecen deshabilitadas.
 */
export default function Admin() {
  const { t } = useTranslation('admin')
  const { data: pendingEntities = 0 } = useUnreviewedBankCount(true)
  const { data: unreadFeedback = 0 } = useUnreadFeedbackCount(true)
  const dots: Partial<Record<AdminNavKey, boolean>> = { bancos: pendingEntities > 0, feedback: unreadFeedback > 0 }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {ADMIN_NAV_ITEMS.map(({ key, to, icon, labelKey, descKey }) => (
          <MenuLink key={key} to={to} icon={icon} label={t(labelKey)} desc={t(descKey)} dot={dots[key]} />
        ))}
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

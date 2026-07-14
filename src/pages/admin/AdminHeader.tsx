import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Cabecera de subpantalla de /admin: flecha de vuelta al hub + título. */
export function AdminHeader({ title }: { title: string }) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/app/admin"
        aria-label={t('back')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
    </div>
  )
}

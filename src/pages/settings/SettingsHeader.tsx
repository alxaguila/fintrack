import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Cabecera de subpantalla de Ajustes: flecha de vuelta al menú + título. */
export function SettingsHeader({ title }: { title: string }) {
  const { t } = useTranslation('settings')
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/settings"
        aria-label={t('menu.back')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
    </div>
  )
}

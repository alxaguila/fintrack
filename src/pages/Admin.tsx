import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'

/**
 * Placeholder de administración (Fase 0). Solo accesible para admins vía
 * <AdminRoute>. Todavía no hay funcionalidad; las pantallas de gestión
 * (catálogos, entidades bancarias…) llegan en fases posteriores.
 */
export default function Admin() {
  const { t } = useTranslation('admin')

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-[15px] font-bold">{t('placeholder.heading')}</p>
          <p className="break-words text-sm text-slate-500">{t('placeholder.body')}</p>
        </div>
      </div>
    </div>
  )
}

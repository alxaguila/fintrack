import { useTranslation } from 'react-i18next'
import { PiggyBank } from 'lucide-react'

/** Placeholder: la función de presupuestos aún no está construida (para nadie,
 *  ni PRO ni PREMIUM). El gate de plan vive en el ítem de navegación, no aquí. */
export default function Budgets() {
  const { t } = useTranslation('common')

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('budgets.coming_soon_title')}</h1>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <PiggyBank className="h-7 w-7 text-slate-400" strokeWidth={1.6} />
        </span>
        <p className="max-w-sm text-sm text-slate-500">{t('budgets.coming_soon_body')}</p>
      </div>
    </div>
  )
}

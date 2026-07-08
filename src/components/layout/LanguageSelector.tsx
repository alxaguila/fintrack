import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useUpdateLanguage } from '@/hooks/useUserSettings'
import { cn } from '@/lib/utils'

export function LanguageSelector() {
  const { i18n, t } = useTranslation('common')
  const updateLanguage = useUpdateLanguage()
  const current = i18n.language.startsWith('es') ? 'es' : 'en'

  function toggle() {
    const next = current === 'es' ? 'en' : 'es'
    updateLanguage.mutate(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
    >
      <Languages className="h-4 w-4" />
      <span>{t(`language.${current}`)}</span>
      <span className={cn('ml-auto text-xs opacity-50')}>
        {current === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  )
}

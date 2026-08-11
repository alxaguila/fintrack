import { useTranslation } from 'react-i18next'
import { useUserSettings, useUpdateUserProfile } from '@/hooks/useUserSettings'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsHeader } from './SettingsHeader'

export default function SettingsNotifications() {
  const { t } = useTranslation('settings')
  const { data: settings } = useUserSettings()
  const updateProfile = useUpdateUserProfile()
  const enabled = settings?.notify_inactivity_email ?? true

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <SettingsHeader title={t('menu.notifications')} />

      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <span className="text-[15px] font-medium text-slate-800">{t('notifications.stale_accounts')}</span>
          <Toggle
            checked={enabled}
            disabled={!settings || updateProfile.isPending}
            onChange={() => updateProfile.mutate({ notify_inactivity_email: !enabled })}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  )
}

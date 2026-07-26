import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  useGenerateStaleAccountNotifications,
  useGenerateUnreadTransactionNotifications,
  useMarkNotificationRead,
  useNotifications,
  unreadNotificationCount,
} from '@/hooks/useNotifications'
import { useProfiles } from '@/hooks/useProfiles'
import { notificationListItemText } from '@/lib/notifications'
import { NotificationDetailDialog } from './NotificationDetailDialog'
import type { Notification } from '@/lib/database.types'

function severityDotColor(severity: Notification['severity']): string {
  return severity === 'critical' ? '#DC5B4B' : '#E0A81E'
}

export function NotificationBell() {
  const { t } = useTranslation('notifications')
  const { t: tc } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Notification | null>(null)

  useGenerateStaleAccountNotifications()
  useGenerateUnreadTransactionNotifications()
  const { data: notifications = [] } = useNotifications()
  const { data: profiles = [] } = useProfiles()
  const hasMultipleProfiles = profiles.length > 1
  const markRead = useMarkNotificationRead()
  const unreadCount = unreadNotificationCount(notifications)

  function openNotification(n: Notification) {
    setOpen(false)
    setSelected(n)
    if (n.read_at == null) markRead.mutate(n.id)
  }

  return (
    <>
      <div
        className="fixed right-4 z-40"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('bell_label')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-ink)] text-white shadow-lg"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-2">
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-slate-500">{t('empty')}</p>
            ) : (
              <div className="flex max-h-[70dvh] flex-col gap-1 overflow-y-auto">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className="flex items-start gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: n.read_at == null ? severityDotColor(n.severity) : 'transparent' }}
                    />
                    <span className={n.read_at == null ? 'font-medium text-slate-900' : 'text-slate-500'}>
                      {notificationListItemText(n, hasMultipleProfiles, t, tc)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <NotificationDetailDialog notification={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  )
}

import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { appPath } from '@/lib/appUrl'
import { useProfiles } from '@/hooks/useProfiles'
import { accountDisplayLabel } from '@/lib/notifications'
import type { Notification } from '@/lib/database.types'

interface NotificationDetailDialogProps {
  notification: Notification | null
  onOpenChange: (open: boolean) => void
}

export function NotificationDetailDialog({ notification, onOpenChange }: NotificationDetailDialogProps) {
  const { t } = useTranslation('notifications')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { data: profiles = [] } = useProfiles()
  const hasMultipleProfiles = profiles.length > 1

  return (
    <Dialog open={!!notification} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog_title')}</DialogTitle>
        </DialogHeader>

        {notification && notification.payload && notification.type === 'account_stale' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              {t(hasMultipleProfiles ? 'account_stale.body' : 'account_stale.body_no_profile', {
                ...notification.payload,
                account_name: accountDisplayLabel(notification.payload.account_name, notification.account, (type) => tc(`account_type.${type}`)),
              })}
            </p>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false)
                navigate(appPath('/import'))
              }}
            >
              {t('account_stale.cta')}
            </Button>
          </div>
        )}

        {notification && notification.payload && notification.type === 'unread_transactions' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              {t(hasMultipleProfiles ? 'unread_transactions.body' : 'unread_transactions.body_no_profile', notification.payload)}
            </p>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false)
                navigate(appPath('/transactions?unread=true'))
              }}
            >
              {t('unread_transactions.cta')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

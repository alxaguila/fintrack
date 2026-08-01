import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useIsPublicContext } from '@/lib/publicContext'
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent'
import { GTM_ID, loadGtm } from '@/lib/gtm'
import { Button } from '@/components/ui/button'

/** Banner de aceptar/rechazar cookies, solo en la landing pública y solo si
 * hay un contenedor GTM configurado y el Usuario aún no ha decidido. */
export function CookieBanner() {
  const isPublic = useIsPublicContext()
  const { t } = useTranslation('legal')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isPublic && !!GTM_ID && getCookieConsent() === null)
  }, [isPublic])

  if (!visible) return null

  const accept = () => {
    setCookieConsent('accepted')
    loadGtm()
    setVisible(false)
  }

  const reject = () => {
    setCookieConsent('rejected')
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:p-5">
        <p className="text-sm text-slate-600">
          {t('cookies.cookieBanner.message')}{' '}
          <Link to="/cookies" className="font-medium underline underline-offset-2">
            {t('cookies.cookieBanner.moreInfo')}
          </Link>
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={reject}>
            {t('cookies.cookieBanner.rejectButton')}
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={accept}>
            {t('cookies.cookieBanner.acceptButton')}
          </Button>
        </div>
      </div>
    </div>
  )
}

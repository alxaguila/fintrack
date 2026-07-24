import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileUp, Upload } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useHasStatements } from '@/hooks/useImportBatches'
import { Button } from '@/components/ui/button'
import { appPath } from '@/lib/appUrl'

/**
 * Onboarding "sube tu primer extracto".
 *
 * Mientras el perfil activo no tenga ningún extracto subido, en TODAS las
 * pantallas (salvo la de Importar) se muestra una pastilla centrada que explica
 * cómo funciona la app e invita a subir el primero. No es descartable: desaparece
 * sola en cuanto hay un extracto. La navegación (sidebar/barra) sigue disponible.
 */
// Mapa ruta -> namespace i18n de esa página, para poder mostrar su título/subtítulo
// reales incluso cuando el contenido se sustituye por la pastilla de "primer extracto".
const PAGE_TITLE_NS: [string, string][] = [
  ['/analysis', 'dashboard'],
  ['/budgets', 'budgets'],
  ['/transactions', 'transactions'],
  ['/accounts', 'accounts'],
  ['/history', 'history'],
]

function pageNamespace(pathname: string): string {
  for (const [seg, ns] of PAGE_TITLE_NS) {
    if (pathname.startsWith(appPath(seg))) return ns
  }
  return 'home'
}

export function OnboardingGate() {
  const location = useLocation()
  const { activeProfile } = useProfile()
  const { data: hasStatements } = useHasStatements(activeProfile?.id)
  // Pantallas exentas de la pastilla (rutas bajo /app):
  //  - /app/import: es donde se sube (y se puede crear la cuenta) → redundante y bloquearía.
  //  - /app/settings: el usuario necesita poder entrar (cerrar sesión, idioma, cuenta…).
  const path = location.pathname
  const exempt = path.startsWith(appPath('/import')) || path.startsWith(appPath('/settings'))

  // Solo sustituimos el contenido cuando SABEMOS que no hay extractos (===false),
  // nunca durante la carga (undefined) para no parpadear.
  if (exempt || hasStatements !== false) return <Outlet />

  return <UploadFirstStatement pageNs={pageNamespace(path)} />
}

function UploadFirstStatement({ pageNs }: { pageNs: string }) {
  const { t } = useTranslation('common')
  const { t: tp } = useTranslation(pageNs)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{tp('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{tp('subtitle')}</p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
          <FileUp className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-teal-900">{t('onboarding_upload.title')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-teal-800">{t('onboarding_upload.body')}</p>
        <Button
          className="mt-5 bg-teal-600 text-white hover:bg-teal-500"
          onClick={() => navigate(appPath('/import'))}
        >
          <Upload className="h-4 w-4" /> {t('onboarding_upload.cta')}
        </Button>
      </div>
    </div>
  )
}

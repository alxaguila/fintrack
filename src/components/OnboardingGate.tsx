import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileUp, Upload } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useHasStatements } from '@/hooks/useImportBatches'
import { Button } from '@/components/ui/button'

/**
 * Onboarding "sube tu primer extracto".
 *
 * Mientras el perfil activo no tenga ningún extracto subido, en TODAS las
 * pantallas (salvo la de Importar) se muestra una pastilla centrada que explica
 * cómo funciona la app e invita a subir el primero. No es descartable: desaparece
 * sola en cuanto hay un extracto. La navegación (sidebar/barra) sigue disponible.
 */
export function OnboardingGate() {
  const location = useLocation()
  const { activeProfile } = useProfile()
  const { data: hasStatements } = useHasStatements(activeProfile?.id)
  // Pantallas exentas de la pastilla:
  //  - /import: es donde se sube (y se puede crear la cuenta) → redundante y bloquearía.
  //  - /settings: el usuario necesita poder entrar (cerrar sesión, idioma, cuenta…).
  const path = location.pathname
  const exempt = path.startsWith('/import') || path.startsWith('/settings')

  // Solo sustituimos el contenido cuando SABEMOS que no hay extractos (===false),
  // nunca durante la carga (undefined) para no parpadear.
  if (exempt || hasStatements !== false) return <Outlet />

  return <UploadFirstStatement />
}

function UploadFirstStatement() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white">
          <FileUp className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-teal-900">{t('onboarding_upload.title')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-teal-800">{t('onboarding_upload.body')}</p>
        <Button
          className="mt-5 bg-teal-600 text-white hover:bg-teal-500"
          onClick={() => navigate('/app/import')}
        >
          <Upload className="h-4 w-4" /> {t('onboarding_upload.cta')}
        </Button>
      </div>
    </div>
  )
}

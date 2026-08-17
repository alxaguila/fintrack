import { usePlan } from './usePlan'
import { hasFeature } from '@/lib/plan'

/** true si el plan actual incluye exportación (PRO/PREMIUM). Se usa para
 *  decidir si el botón "Exportar" descarga el fichero o abre el aviso de mejora. */
export function useExportGate(): boolean {
  const { limits } = usePlan()
  return hasFeature(limits, 'has_export')
}

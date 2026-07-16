import { usePlan } from './usePlan'
import { hasFeature } from '@/lib/plan'

/** true si el plan actual incluye presupuestos (PRO/PREMIUM). Se usa para
 *  decidir si el ítem de nav "Presupuestos" navega o abre el aviso de mejora. */
export function useBudgetsGate(): boolean {
  const { limits } = usePlan()
  return hasFeature(limits, 'has_budget')
}

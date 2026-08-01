import type { Granularity } from '@/lib/periods'

// La granularidad de Análisis vive en la URL (?granularity=), compartida entre
// Dashboard.tsx y el desplegable de MobileTopBar (MobileNav.tsx). Este mirror en
// sessionStorage permite recordarla al salir de la pantalla y volver, momento en
// el que la URL ya no trae el parámetro.
const KEY = 'zafyros:dash:granularity'

export function getPersistedGranularity(): Granularity | null {
  try {
    const v = sessionStorage.getItem(KEY)
    return v === 'month' || v === 'quarter' || v === 'year' ? v : null
  } catch {
    return null
  }
}

export function persistGranularity(g: Granularity): void {
  try {
    sessionStorage.setItem(KEY, g)
  } catch {
    // sessionStorage no disponible: se ignora.
  }
}

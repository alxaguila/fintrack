import { useEffect, useState } from 'react'

// Punto de corte alineado con el breakpoint `sm` de Tailwind (640px). Se usa
// para renderizar árboles JSX distintos en móvil/escritorio (en vez de ocultar
// con CSS) cuando una pantalla es lo bastante distinta como para no compensar
// montar ambos a la vez (p. ej. gráficas SVG pesadas duplicadas).
const QUERY = '(max-width: 639px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

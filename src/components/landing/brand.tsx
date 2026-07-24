// Identidad visual de la landing / registro (diseño "zafyros Landing", distinta
// del sistema interno de la app). Se comparte entre Landing, LoginDialog y
// Register para que la puerta de entrada sea coherente.
export const BRAND = {
  ink: '#0A2540',
  ink2: '#0E3050',
  blue: '#0A7BAE',
  blueHover: '#0669A0',
  accent: '#FF6B4A',
  accentHover: '#F55E3E',
  cream: '#F5F2EC',
  sans: "'IBM Plex Sans',system-ui,sans-serif",
  display: "'Space Grotesk',system-ui,sans-serif",
  serif: "'Newsreader',Georgia,serif",
  mono: "'IBM Plex Mono',ui-monospace,monospace",
  wordmark: "'Poppins',system-ui,sans-serif",
} as const

// Isotipo zafyros (diamante de líneas, con o sin disco navy de respaldo), reutilizado
// en nav, footer y auth. Versión plana (sin degradados/sombras), pensada para aguantar
// a tamaños pequeños. `filled=false` cuando el icono ya va sobre un fondo navy propio
// (p. ej. la cabecera/hero, que tiene su propio foco de luz decorativo) — así el
// diamante se funde con ese fondo en vez de mostrar un disco plano que tapa el degradado.
export function BrandMark({ size = 32, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {filled && <circle cx="50" cy="50" r="48" fill={BRAND.ink} />}
      <path
        d="M34,28 L66,28 L80,44 L50,80 L20,44 Z M20,44 L80,44 M34,44 L50,80 M66,44 L50,80"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

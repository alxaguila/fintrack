// Identidad visual de la landing / registro (diseño "Fintrack Landing", distinta
// del sistema dolfin interno de la app). Se comparte entre Landing, LoginDialog y
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
} as const

// SVG del logotipo (círculo azul + curva), reutilizado en nav, footer y auth.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#0A7BAE" />
      <path d="M7 27 Q20 4 33 27" fill="none" stroke="#EAF4FA" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="26.5" cy="15" r="2" fill="#EAF4FA" />
    </svg>
  )
}

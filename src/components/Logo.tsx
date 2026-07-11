// Marca encapsulada en un único sitio: nombre e isotipo aún NO son definitivos
// (FinTrack / dolfin están por decidir). Cambiar aquí se propaga a toda la app.
// Wordmark en minúsculas (Space Grotesk). El isotipo es provisional.

interface LogoProps {
  /** Tamaño del isotipo en px (el wordmark escala en proporción). */
  size?: number
  /** Mostrar solo el isotipo, sin wordmark. */
  iconOnly?: boolean
  /** Versión de la app, alineada a la baseline del wordmark (opcional). */
  version?: string
  className?: string
}

export function Logo({ size = 30, iconOnly = false, version, className }: LogoProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="var(--brand-primary)" />
        <path d="M7 27 Q20 4 33 27" fill="none" stroke="#EAF4FA" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="26.5" cy="15" r="2" fill="#EAF4FA" />
      </svg>
      {!iconOnly && (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 600,
              fontSize: size * 0.73,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'currentColor',
            }}
          >
            fintrack
          </span>
          {version && (
            <span style={{ fontSize: 10, fontWeight: 500, color: 'currentColor', opacity: 0.45 }}>{version}</span>
          )}
        </span>
      )}
    </div>
  )
}

// Marca encapsulada en un único sitio: isotipo zafyros (diamante de líneas) + wordmark.
// Cambiar aquí se propaga a toda la app. Wordmark en minúsculas (Poppins). Sin disco de
// fondo: el sidebar/drawer donde vive ya es navy (con su propio foco de luz decorativo
// en el sidebar) — un disco plano encima taparía ese degradado en vez de fundirse.

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
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M30,28 L66,28 L80,44 L50,80 L20,44 Z M20,44 L80,44 M30,44 L50,80 M66,44 L50,80"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {!iconOnly && (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 600,
              fontSize: size * 0.73,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'currentColor',
            }}
          >
            zafyros
          </span>
          {version && (
            <span style={{ fontSize: 10, fontWeight: 500, color: 'currentColor', opacity: 0.45 }}>{version}</span>
          )}
        </span>
      )}
    </div>
  )
}

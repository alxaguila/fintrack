import { useState } from 'react'

/**
 * Logo de una entidad. Si hay `logoUrl` muestra la imagen; si no (o falla la
 * carga) cae a una ficha de color con la inicial de la entidad — el mismo
 * patrón provisional del diseño, encapsulado aquí para sustituir por logos
 * reales en un único sitio.
 */
export function BankLogo({
  entity,
  color,
  logoUrl,
  size = 28,
  radius = 8,
}: {
  entity: string
  color: string
  logoUrl?: string | null
  size?: number
  radius?: number
}) {
  const [broken, setBroken] = useState(false)
  const initial = (entity.trim()[0] ?? '?').toUpperCase()

  if (logoUrl && !broken) {
    return (
      <img
        src={logoUrl}
        alt={entity}
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: radius }}
        className="shrink-0 object-cover"
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: Math.round(size * 0.42),
      }}
    >
      {initial}
    </div>
  )
}

import { BRAND } from './brand'

type ScreenshotFrameProps = {
  src: string
  alt: string
  width: number
  height: number
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
  className?: string
  style?: React.CSSProperties
}

/**
 * Marco reutilizable (esquinas + sombra) para capturas reales de producto en
 * la landing (hero, tour de producto...). El `alt` es obligatorio: a diferencia
 * de las ilustraciones decorativas (FeatureArt), estas imágenes aportan
 * información real y deben ser accesibles.
 */
export function ScreenshotFrame({ src, alt, width, height, loading = 'lazy', fetchPriority = 'auto', className, style }: ScreenshotFrameProps) {
  return (
    <div className={className} style={{ borderRadius: 20, overflow: 'hidden', background: BRAND.ink, boxShadow: '0 30px 70px rgba(10,37,64,.22)', width: '100%', ...style }}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  )
}

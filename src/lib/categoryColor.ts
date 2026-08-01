// Deriva tonos distinguibles dentro de la misma familia de color de un grupo,
// para diferenciar subcategorías de un mismo grupo en gráficos sin salirse de
// su hue (evita que varias subcategorías compartan el mismo color exacto).

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hh = 0
  let s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: hh = ((g - b) / d) % 6; break
      case g: hh = (b - r) / d + 2; break
      default: hh = (r - g) / d + 4
    }
    hh *= 60
    if (hh < 0) hh += 360
  }
  return [hh, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Color de la subcategoría `index` (0-based) de `count` dentro de un mismo
 * grupo: conserva el tono (hue) del grupo y varía la luminosidad de forma
 * alterna (base, +9%, -9%, +18%, -18%...) para que sean distinguibles entre
 * sí sin salirse de su familia de color. Con `count` <= 1 devuelve el color
 * del grupo tal cual. */
export function subcategoryColor(groupColorHex: string | null | undefined, index: number, count: number): string {
  if (!groupColorHex || count <= 1) return groupColorHex ?? '#94a3b8'
  const [h, s, l] = hexToHsl(groupColorHex)
  const step = Math.ceil(index / 2)
  const sign = index % 2 === 1 ? 1 : -1
  const newL = Math.min(80, Math.max(22, l + sign * step * 9))
  return hslToHex(h, s, newL)
}

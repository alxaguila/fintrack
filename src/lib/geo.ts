/**
 * Países y sus subdivisiones (ISO 3166-2) desde `country-region-data` (MIT).
 *
 * El paquete se carga con `import()` dinámico y se cachea: no entra en el bundle
 * inicial, solo se descarga al abrir el onboarding / los ajustes personales.
 *
 * Forma del dato en v4: tuplas.
 *   allCountries: [countryName, countryCode, regions][]
 *   region:       [regionName, regionShortCode]
 */

type RegionTuple = [string, string]
type CountryTuple = [string, string, RegionTuple[]]

export type CountryOption = { code: string; name: string }
export type RegionOption = { code: string; name: string }

let cache: Promise<CountryTuple[]> | null = null

async function load(): Promise<CountryTuple[]> {
  if (!cache) {
    cache = import('country-region-data').then(
      (m) => m.allCountries as unknown as CountryTuple[],
    )
  }
  return cache
}

/**
 * Lista de países con el nombre localizado al idioma dado (`Intl.DisplayNames`),
 * ordenada alfabéticamente. El valor es el código ISO-2.
 */
export async function getCountries(lang: string): Promise<CountryOption[]> {
  const all = await load()
  let dn: Intl.DisplayNames | null = null
  try {
    dn = new Intl.DisplayNames([lang], { type: 'region' })
  } catch {
    dn = null
  }
  return all
    .map(([name, code]) => ({ code, name: (dn && dn.of(code)) || name }))
    .sort((a, b) => a.name.localeCompare(b.name, lang))
}

/** Nombre localizado de un país por su código ISO-2 (para mostrar en Ajustes). */
export function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

/** Subdivisiones (provincias/estados/regiones) de un país. Vacío si no hay. */
export async function getRegions(countryCode: string): Promise<RegionOption[]> {
  if (!countryCode) return []
  const all = await load()
  const found = all.find(([, code]) => code === countryCode)
  if (!found) return []
  return found[2].map(([name, code]) => ({ code, name }))
}

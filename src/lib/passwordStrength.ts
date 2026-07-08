/**
 * Estimación de fortaleza de contraseña con zxcvbn-ts.
 *
 * zxcvbn es pesado (diccionarios), así que lo cargamos con `import()` dinámico:
 * no entra en el bundle inicial (login/app), solo se descarga la primera vez que
 * el usuario teclea una contraseña en el registro. La instancia queda cacheada.
 */

import type { ZxcvbnFactory } from '@zxcvbn-ts/core'

let loader: Promise<InstanceType<typeof ZxcvbnFactory>> | null = null

async function getZxcvbn() {
  if (!loader) {
    loader = (async () => {
      const core = await import('@zxcvbn-ts/core')
      const common = await import('@zxcvbn-ts/language-common')
      const en = await import('@zxcvbn-ts/language-en')
      return new core.ZxcvbnFactory({
        dictionary: { ...common.dictionary, ...en.dictionary },
        graphs: common.adjacencyGraphs,
        translations: en.translations,
      })
    })()
  }
  return loader
}

/**
 * Puntúa la contraseña de 0 (muy débil) a 4 (muy fuerte).
 * Devuelve 0 para cadena vacía sin cargar la librería.
 */
export async function scorePassword(password: string): Promise<number> {
  if (!password) return 0
  const zxcvbn = await getZxcvbn()
  return zxcvbn.check(password).score
}

/** Requisitos duros de la política de contraseña (para el checklist en vivo). */
export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
}

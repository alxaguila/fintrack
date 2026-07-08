#!/usr/bin/env node
// Incrementa el sufijo de APP_VERSION en src/lib/version.ts (v1.007 -> v1.008).
// Lo invoca el hook UserPromptSubmit definido en .claude/settings.json, de modo
// que el versionado se aplica de forma determinista en cada prompt, sin depender
// de que el modelo lo recuerde (regla 5 de CLAUDE.md).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'src', 'lib', 'version.ts')

try {
  const src = readFileSync(file, 'utf8')
  // Captura: prefijo (vMAJOR.) + sufijo numérico entre comillas
  const re = /(APP_VERSION\s*=\s*['"]v)(\d+)\.(\d+)(['"])/
  const m = src.match(re)
  if (!m) {
    // No es un error fatal: si el formato cambió, no rompemos el prompt.
    process.exit(0)
  }
  const major = m[2]
  const width = m[3].length            // conserva el zero-padding (3 dígitos)
  const next = String(Number(m[3]) + 1).padStart(width, '0')
  const updated = src.replace(re, `$1${major}.${next}$4`)
  if (updated !== src) writeFileSync(file, updated)
} catch {
  // Silencioso: un fallo del bump nunca debe bloquear el prompt.
}
process.exit(0)

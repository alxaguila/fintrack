#!/usr/bin/env node
// ============================================================
// Backfill puntual: recalcula dictionary_rules.use_count y
// community_rule_usage.use_count desde TODO el histórico de `transactions`.
// ============================================================
//
// Por qué: el contador de uso (migración 033) solo suma con importaciones
// confirmadas DESPUÉS de que esa migración se desplegó — no refleja ni un solo
// movimiento del histórico ya existente. Este script lo recalcula desde cero
// (recompute completo, no aditivo) para poder priorizar qué comercio tiene
// logo primero en /admin/comercios. Idempotente: se puede re-ejecutar cuando
// se quiera.
//
// Uso:
//   PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY = "..."; node scripts/backfill-merchant-usage.mjs
//   bash:        SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-merchant-usage.mjs
//
// Requiere la Service Role Key de Supabase (dashboard > Settings > API >
// service_role) porque lee movimientos de TODOS los usuarios — los contadores
// son agregados globales, no por usuario. Nunca se commitea ni se guarda en
// el repo, solo se pasa como variable de entorno al ejecutar.
//
// Simplificación aceptada: ignora las keyword_rules propias de cada usuario
// (que en producción se comprueban antes que comunidad/diccionario, ver
// classifyConcept en src/lib/classify.ts) — son reglas privadas y poco
// frecuentes; replicarlas exigiría cargar reglas por perfil para cada
// movimiento histórico. Efecto: ligera sobreestimación en los pocos casos
// donde una regla personal habría interceptado el movimiento.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ------------------------------------------------------------
// Funciones puras copiadas de src/lib/categoryRules.ts (mantener en sync si
// ese archivo cambia — no se puede importar un .ts desde un script .mjs sin
// loader, y añadir uno para un script one-off no compensa).
// ------------------------------------------------------------
function normalize(s) {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents (Ñ → N)
    .replace(/\b(GOOGLE|APPLE|SAMSUNG)\s*PAY\s*:?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function merchantKey(concept) {
  let s = normalize(concept)
  s = s.replace(/WWW\.|\.COM|\.ES|\.IO|\.NET/g, ' ')
  s = s.replace(/\*/g, ' ')
  s = s.replace(/\b[A-Z]?\d[0-9A-Z]{3,}\b/g, ' ')
  s = s.replace(/\b\d+\b/g, ' ')
  s = s.replace(/\bC\/A\b|\bS\.?A\.?\b|\bS\.?L\.?\b|\bPENDING\b/g, ' ')
  s = s.replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = []
  for (const w of s.split(' ')) {
    if (w.length < 3) continue
    if (words[words.length - 1] === w) continue
    words.push(w)
  }
  return words.slice(0, 2).join(' ')
}

function tokenString(concept) {
  const norm = normalize(concept).replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  return norm ? ` ${norm} ` : ''
}

function matchBuiltinCategory(concept, rules) {
  const ts = tokenString(concept)
  if (!ts) return null
  for (const rule of rules) {
    if (rule.applies_to_bizum && ts.includes(` ${rule.pattern} `)) return rule
  }
  if (ts.includes(' BIZUM ')) return null
  for (const rule of rules) {
    if (!rule.applies_to_bizum && ts.includes(` ${rule.pattern} `)) return rule
  }
  return null
}

const COMMUNITY_VOTE_THRESHOLD = 3

// ------------------------------------------------------------
// Credenciales
// ------------------------------------------------------------
function readEnvLocal(key) {
  try {
    const content = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match ? match[1].trim() : undefined
  } catch {
    return undefined
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || readEnvLocal('VITE_SUPABASE_URL')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('Falta SUPABASE_URL (ni en el entorno ni como VITE_SUPABASE_URL en .env.local).')
  process.exit(1)
}
if (!SERVICE_ROLE_KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Consíguela en el dashboard de Supabase: Settings > API > Project API keys > service_role.')
  console.error('Ejemplo (PowerShell):  $env:SUPABASE_SERVICE_ROLE_KEY = "..."; node scripts/backfill-merchant-usage.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ------------------------------------------------------------
// 1. Cargar reglas
// ------------------------------------------------------------
async function loadDictionaryRules() {
  const { data, error } = await supabase
    .from('dictionary_rules')
    .select('id, pattern, applies_to_bizum, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

async function loadCommunityMerchantKeys() {
  const { data, error } = await supabase
    .from('community_rules')
    .select('merchant_key, votes')
    .gte('votes', COMMUNITY_VOTE_THRESHOLD)
  if (error) throw error
  return new Set(data.map((r) => r.merchant_key))
}

// ------------------------------------------------------------
// 2. Paginar transactions (PostgREST corta a 1000 filas por página)
// ------------------------------------------------------------
async function* iterateAllConcepts() {
  const PAGE = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('transactions')
      .select('concept')
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data.length) return
    for (const row of data) yield row.concept
    if (data.length < PAGE) return
    from += PAGE
  }
}

async function main() {
  console.log('Cargando reglas...')
  const dictionaryRules = await loadDictionaryRules()
  const communityKeys = await loadCommunityMerchantKeys()
  console.log(`  ${dictionaryRules.length} reglas de diccionario, ${communityKeys.size} comercios de comunidad (>= ${COMMUNITY_VOTE_THRESHOLD} votos).`)

  // ------------------------------------------------------------
  // 3. Tally: recorre TODO el histórico, sin filtrar por transaction_type
  // (las transferencias entre cuentas propias también suman en producción,
  // ver useConfirmImport en src/hooks/useImport.ts).
  // ------------------------------------------------------------
  const dictCounts = new Map()
  const communityCounts = new Map()
  let processed = 0
  let matched = 0

  console.log('Recorriendo el histórico de movimientos...')
  for await (const concept of iterateAllConcepts()) {
    processed++
    const key = merchantKey(concept)
    if (key && communityKeys.has(key)) {
      communityCounts.set(key, (communityCounts.get(key) ?? 0) + 1)
      matched++
    } else {
      const rule = matchBuiltinCategory(concept, dictionaryRules)
      if (rule) {
        dictCounts.set(rule.id, (dictCounts.get(rule.id) ?? 0) + 1)
        matched++
      }
    }
    if (processed % 5000 === 0) console.log(`  ...${processed} movimientos procesados`)
  }
  console.log(`Total: ${processed} movimientos, ${matched} con match (diccionario o comunidad).`)

  // ------------------------------------------------------------
  // 4. Escritura: recompute completo (reset a 0 + aplicar tally)
  // ------------------------------------------------------------
  console.log('Reseteando contadores...')
  {
    const { error } = await supabase.from('dictionary_rules').update({ use_count: 0 }).not('id', 'is', null)
    if (error) throw error
  }
  {
    const { error } = await supabase.from('community_rule_usage').update({ use_count: 0 }).not('merchant_key', 'is', null)
    if (error) throw error
  }

  console.log(`Aplicando ${dictCounts.size} contadores de diccionario...`)
  for (const [ruleId, count] of dictCounts) {
    const { error } = await supabase.from('dictionary_rules').update({ use_count: count }).eq('id', ruleId)
    if (error) throw error
  }

  console.log(`Aplicando ${communityCounts.size} contadores de comunidad...`)
  const now = new Date().toISOString()
  for (const [key, count] of communityCounts) {
    const { error } = await supabase
      .from('community_rule_usage')
      .upsert({ merchant_key: key, use_count: count, updated_at: now }, { onConflict: 'merchant_key' })
    if (error) throw error
  }

  // ------------------------------------------------------------
  // 5. Informe: top 20 combinado (para decidir qué comercio tener logo primero)
  // ------------------------------------------------------------
  const patternById = new Map(dictionaryRules.map((r) => [r.id, r.pattern]))
  const combined = [
    ...[...dictCounts].map(([id, count]) => ({ label: patternById.get(id) ?? id, count, source: 'diccionario' })),
    ...[...communityCounts].map(([key, count]) => ({ label: key, count, source: 'comunidad' })),
  ].sort((a, b) => b.count - a.count)

  console.log('\nTop 20 comercios por frecuencia histórica:')
  for (const row of combined.slice(0, 20)) {
    console.log(`  ${String(row.count).padStart(6)}  ${row.label}  (${row.source})`)
  }

  console.log('\nListo.')
}

main().catch((err) => {
  console.error('Error en el backfill:', err)
  process.exit(1)
})

import type { DictionaryRule, Merchant } from './database.types'

/**
 * Built-in categorization dictionary (Spanish market).
 *
 * The dictionary itself lives in the `dictionary_rules` table (migración 032),
 * editable from /admin/reglas — it used to be a fixed array in this file.
 * This module now only keeps the concept-normalization helpers and the
 * matcher, which takes the DB-fetched rules as a parameter (see the
 * useDictionaryRules hook and classify.ts).
 *
 * Matching is by WHOLE WORD / PHRASE (not substring): the concept is normalized
 * (uppercase, accent-free) and every non-alphanumeric character becomes a space,
 * so a pattern only matches when it appears as a full token or a run of full
 * tokens. This avoids false positives like `CONSUM` inside "CONSUMER" or `PAGA`
 * inside "PAGADOS". Order matters (dictionary_rules.sort_order): the first
 * rule that matches wins, so specific merchants are seeded before generic
 * keywords.
 */

function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents (Ñ → N)
    // strip wallet prefixes so the real merchant is matched (e.g. "Google pay: CAPRABO")
    .replace(/\b(GOOGLE|APPLE|SAMSUNG)\s*PAY\s*:?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Derives a conservative "merchant key" from a concept, used to find clearly
 * similar transactions (same shop) when reclassifying. Strips wallet prefixes,
 * web prefixes, asterisks, numbers, card masks, reference codes and legal-form
 * noise, then keeps up to the first two significant words.
 *
 * "Google pay: MERCADONA C/A 123" → "MERCADONA"
 * "WWW.AMAZON* NQ07E3PC4"        → "AMAZON"
 * Returns '' when nothing meaningful remains (caller treats '' as "no match").
 */
export function merchantKey(concept: string): string {
  let s = normalize(concept) // upper, no accents, wallet prefixes removed
  s = s.replace(/WWW\.|\.COM|\.ES|\.IO|\.NET/g, ' ')
  s = s.replace(/\*/g, ' ')
  s = s.replace(/\b[A-Z]?\d[0-9A-Z]{3,}\b/g, ' ') // alnum codes containing digits
  s = s.replace(/\b\d+\b/g, ' ')                   // pure numbers
  s = s.replace(/\bC\/A\b|\bS\.?A\.?\b|\bS\.?L\.?\b|\bPENDING\b/g, ' ')
  s = s.replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()
  const words: string[] = []
  for (const w of s.split(' ')) {
    if (w.length < 3) continue
    if (words[words.length - 1] === w) continue // drop consecutive duplicates
    words.push(w)
  }
  return words.slice(0, 2).join(' ')
}

/**
 * Normaliza un patrón escrito a mano (diccionario o variación de comercio)
 * para que case con el concepto ya normalizado: mayúsculas, sin tildes, sin
 * puntuación (todo lo que no sea letra/número/espacio se convierte en
 * espacio, igual que tokenString() hace con el concepto) y espacios
 * colapsados. El asterisco (*) es la única excepción: se conserva como
 * comodín ("cualquier secuencia de caracteres", ver matchMerchant).
 */
export function normalizePattern(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9 *]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Convierte un concepto en una cadena de tokens con espacios de guarda para
 * poder buscar patrones por palabra/frase completa: `" MERCADONA C ARIBAU "`.
 */
function tokenString(concept: string): string {
  const norm = normalize(concept).replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  return norm ? ` ${norm} ` : ''
}

/**
 * Returns the matched dictionary_rules row for a concept, or null if nothing
 * matches. Matching is by whole word/phrase. Returns the full rule (not just
 * the category id) so the caller can credit the specific rule's use_count.
 *
 * Two passes to replicate the old ALWAYS_RULES exception: a Bizum between
 * people is never classified by the dictionary (it could be anything) EXCEPT
 * for a handful of very reliable words (`applies_to_bizum`, e.g. NOMINA,
 * PARKING, COMUNIDAD) which are checked first and win even for a Bizum.
 */
export function matchBuiltinCategory(concept: string, rules: DictionaryRule[]): DictionaryRule | null {
  const ts = tokenString(concept)
  if (!ts) return null
  for (const rule of rules) {
    if (rule.applies_to_bizum && ts.includes(` ${rule.pattern} `)) return rule
  }
  // Un Bizum entre personas nunca es un comercio: no lo clasifica el diccionario.
  if (ts.includes(' BIZUM ')) return null
  for (const rule of rules) {
    if (!rule.applies_to_bizum && ts.includes(` ${rule.pattern} `)) return rule
  }
  return null
}

/**
 * Compila un patrón con comodines (*) a una regex, anclada según dónde estén
 * los asteriscos (mismo criterio que un glob): sin * al principio, el
 * concepto tiene que EMPEZAR por el patrón; sin * al final, tiene que
 * TERMINAR en él; con * en ambos lados, puede aparecer en cualquier
 * posición. Cada * en medio es "cualquier secuencia de caracteres"; el resto
 * se escapa literal. Se compara contra el concepto SIN los espacios de
 * guarda de tokenString (ver matchMerchant), para que ^/$ sean el principio
 * y el final reales del concepto, no de la cadena con padding.
 */
function wildcardToRegex(pattern: string): RegExp {
  const body = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  const anchored = (pattern.startsWith('*') ? '' : '^') + body + (pattern.endsWith('*') ? '' : '$')
  return new RegExp(anchored)
}

/**
 * Returns the merchant matched in the concept, or null. If a merchant has
 * concept variations (merchant_patterns, migración 036), those are checked
 * INSTEAD OF the name; the name is only the fallback pattern when a merchant
 * has no variations defined. A variation containing * is a wildcard, anchored
 * per wildcardToRegex(); without *, matching is by whole word/phrase as
 * usual. Independent of category classification (a transaction can have both
 * a matched category and a matched merchant, or either alone). Same Bizum
 * exclusion as the dictionary: a Bizum between people is never a merchant
 * purchase.
 */
export function matchMerchant(concept: string, merchants: Merchant[]): Merchant | null {
  const ts = tokenString(concept)
  if (!ts || ts.includes(' BIZUM ')) return null
  const trimmed = ts.trim()
  for (const m of merchants) {
    const candidates = m.patterns?.length ? m.patterns.map((p) => normalizePattern(p.pattern)) : [normalizePattern(m.name)]
    for (const p of candidates) {
      if (!p) continue
      if (p.includes('*') ? wildcardToRegex(p).test(trimmed) : ts.includes(` ${p} `)) return m
    }
  }
  return null
}

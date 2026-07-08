/**
 * Built-in categorization dictionary (Spanish market).
 *
 * Maps common merchant names / keywords found in bank statement concepts to a
 * category `slug` (see supabase/seed.sql). Used as a fallback when the user has
 * no keyword rule for a concept, so most movements get categorized with zero
 * configuration. User rules always take precedence over this dictionary.
 *
 * Matching is by WHOLE WORD / PHRASE (not substring): the concept is normalized
 * (uppercase, accent-free) and every non-alphanumeric character becomes a space,
 * so a pattern only matches when it appears as a full token or a run of full
 * tokens. This avoids false positives like `CONSUM` inside "CONSUMER" or `PAGA`
 * inside "PAGADOS". Order matters: the first rule that matches wins, so put
 * specific merchants before generic keywords.
 *
 * Patterns MUST be written normalized: uppercase, no accents (Ñ → N), words
 * separated by single spaces, no punctuation.
 */

export interface BuiltinRule {
  slug: string       // category slug from seed.sql
  patterns: string[] // whole-word / phrase patterns (normalized)
}

export const BUILTIN_RULES: BuiltinRule[] = [
  // ── Alimentación / supermercado ───────────────────────────────────────────
  { slug: 'supermarket', patterns: ['MERCADONA', 'CARREFOUR', 'LIDL', 'ALDI', 'EROSKI', 'ALCAMPO', 'MI ALCAMPO', 'CONSUM', 'CAPRABO', 'DIA', 'SUPERMERCADO', 'SUPERMERCAT', 'SUPERCOR', 'BONPREU', 'BON PREU', 'CONDIS', 'AHORRAMAS', 'GADIS', 'FROIZ', 'BONAREA', 'BON AREA', 'HIPERCOR', 'AMETLLER', 'CASA AMETLLER', 'ESCLAT', 'HIPERMERCAT', 'COALIMENT', 'WELCOME SUPERMERCADO'] },
  { slug: 'local_food', patterns: ['CARNICERIA', 'FRUTERIA', 'PANADERIA', 'PESCADERIA', 'CHARCUTERIA', 'PASTELERIA', 'HORNO DE'] },
  { slug: 'nutrition_supplements', patterns: ['MYPROTEIN', 'PROZIS', 'HERBOLARIO', 'SUPLEMENTO', 'NUTRICION DEPORTIVA'] },

  // ── Comida a domicilio ────────────────────────────────────────────────────
  { slug: 'home_delivery', patterns: ['GLOVO', 'JUST EAT', 'JUSTEAT', 'UBER EATS', 'UBEREATS', 'DELIVEROO'] },

  // ── Restauración ──────────────────────────────────────────────────────────
  { slug: 'restaurant', patterns: ['RESTAURANT', 'RESTAURANTE', 'RESTAURANTES', 'RESTAURACIO', 'BAR', 'BARES', 'MCDONALD', 'MCDONALDS', 'BURGER KING', 'TELEPIZZA', 'DOMINO', 'GOIKO', 'KFC', 'WAGAMAMA', 'PIZZERIA', 'PIZZABAR', 'PANS', 'VIPS', 'FOSTER', 'RODILLA', '100 MONTADITOS', 'MARISQUERIA', 'SUSHI', 'POKE', 'KEBAB', 'KEBAP', 'TAQUERIA', 'TAQUERIAS', 'RAMEN', 'TRATTORIA', 'RISTORANTE', 'BRASSERIE', 'GASTRONOMIC', 'DIM SUM', 'CLEAN MEAL'] },

  // ── Cafeterías / desayuno / panaderías ────────────────────────────────────
  { slug: 'cafe_breakfast', patterns: ['STARBUCKS', 'CAFETERIA', 'SANTAGLORIA', 'SANTA GLORIA', 'DUNKIN', 'CAFE', 'CAFES', 'COFFEE', 'GRANJA', 'BRUNCH', 'GELATERIA', 'HORCHATERIA', 'PASTISSERIA', 'FORN', 'CROISSANT', 'LEVADURAMADRE', 'PANINO', 'BOLDU', 'ON Y VA', 'MANOLO BAKES', 'MOLI PAN'] },

  // ── Copas / ocio nocturno ─────────────────────────────────────────────────
  { slug: 'nightlife_drinks', patterns: ['CERVECERIA', 'TABERNA', 'PUB', 'DISCOTECA', 'BREWING', 'VERMUTERIA', 'COCKTAIL', 'COCKTELERIA', 'CLUB', 'BODEGA', 'NEW FIZZ'] },

  // ── Movilidad / transporte ────────────────────────────────────────────────
  { slug: 'transport', patterns: ['UBER', 'UBR', 'CABIFY', 'BOLT', 'FREENOW', 'FREE NOW', 'RENFE', 'METRO', 'EMT', 'TMB', 'FGC', 'ALSA', 'AVANZA', 'TAXI', 'TAXIS', 'BLABLACAR', 'VUELING', 'RYANAIR', 'IBERIA', 'AIR EUROPA', 'EASYJET', 'AENA', 'BICING', 'RATP', 'BVG'] },
  { slug: 'fuel', patterns: ['REPSOL', 'CEPSA', 'CEDIPSA', 'GALP', 'SHELL', 'PETRONOR', 'PETRO', 'GASOLINERA', 'ESTACION DE SERVICIO', 'CARBURANTE'] },
  { slug: 'parking_tolls', patterns: ['PARKING', 'APARCAMIENTO', 'SABA', 'EMPARK', 'PEAJE', 'AUTOPISTA', 'AUTOPISTAS', 'AUMAR', 'PARKIA', 'TELPARK', 'TUNEL', 'TUNELS', 'TUNELSPAN', 'VALLVIDRERA'] },
  { slug: 'vehicle_rental', patterns: ['RCI MOBILITY', 'RCI', 'EUROPCAR', 'HERTZ', 'SIXT', 'GOLDCAR', 'RECORD GO', 'CENTAURO', 'RENT A CAR', 'ALQUILER DE COCHE', 'ALQUILER COCHE'] },

  // ── Servicios / suscripciones ─────────────────────────────────────────────
  { slug: 'streaming', patterns: ['NETFLIX', 'SPOTIFY', 'HBO', 'HBO MAX', 'DISNEY', 'DISNEY PLUS', 'PRIME VIDEO', 'DAZN', 'FILMIN', 'MOVISTAR PLUS', 'YOUTUBE PREMIUM', 'TWITCH'] },
  { slug: 'online_services', patterns: ['GOOGLE', 'APPLE COM', 'ITUNES', 'MICROSOFT', 'OPENAI', 'CHATGPT', 'ANTHROPIC', 'CLAUDE', 'AMAZON PRIME', 'DROPBOX', 'ADOBE', 'PAYPAL', 'NINTENDO', 'PLAYSTATION', 'STEAM', 'STEAMGAMES', 'CANVA', 'NOTION', 'GITHUB', 'LINKEDIN', 'PATREON', 'GLIDE', 'MAILSUITE', 'TASKER', 'HAPPY SCRIBE'] },
  { slug: 'mobile_internet', patterns: ['MOVISTAR', 'VODAFONE', 'ORANGE', 'YOIGO', 'JAZZTEL', 'MASMOVIL', 'MAS MOVIL', 'DIGI', 'PEPEPHONE', 'LOWI', 'SIMYO', 'FINETWORK'] },
  { slug: 'electricity', patterns: ['IBERDROLA', 'ENDESA', 'NATURGY', 'HOLALUZ', 'TOTALENERGIES', 'CURENERGIA', 'ENERGIA XXI', 'ELECTRICIDAD'] },
  { slug: 'gas', patterns: ['GAS NATURAL', 'NEDGIA', 'REDEXIS', 'GAS POWER'] },
  { slug: 'water', patterns: ['AIGUES', 'HIDROGEA', 'HIDRALIA', 'AQUALIA', 'AQUATEC', 'SOREA', 'EMASESA', 'EMASA', 'CANAL ISABEL', 'CANAL DE ISABEL', 'AGUAS DE'] },
  { slug: 'security_alarm', patterns: ['SECURITAS', 'PROSEGUR', 'ADT', 'TYCO', 'MOVISTAR PROSEGUR'] },

  // ── Salud y deporte ───────────────────────────────────────────────────────
  { slug: 'pharmacy', patterns: ['FARMACIA', 'PARAFARMACIA'] },
  { slug: 'medical', patterns: ['CLINICA', 'HOSPITAL', 'CENTRO MEDICO', 'TEKNON', 'DENTISTA'] },
  { slug: 'optical_dental', patterns: ['DENTAL', 'OPTICA', 'GENERAL OPTICA', 'MULTIOPTICAS', 'CLINICA DENTAL'] },
  { slug: 'sport', patterns: ['BASIC FIT', 'GIMNASIO', 'GYM', 'FITNESS', 'MCFIT', 'VIVAGYM', 'ALTAFIT', 'CROSSFIT', 'PLAYTOMIC', 'PADEL', 'METROPOLITAN', 'DIAGONAL DIR'] },
  { slug: 'beauty', patterns: ['PELUQUERIA', 'PERRUQUERIA', 'PERRUQUERIES', 'BARBERIA', 'PRIMOR', 'DOUGLAS', 'SEPHORA', 'ESTETICA', 'DRUNI', 'RITUALS', 'RITUALSCOSMETICS'] },

  // ── Compras ───────────────────────────────────────────────────────────────
  { slug: 'clothing', patterns: ['ZARA', 'PRIMARK', 'PULL AND BEAR', 'BERSHKA', 'STRADIVARIUS', 'MASSIMO DUTTI', 'MANGO', 'NIKE', 'ADIDAS', 'SPRINGFIELD', 'CORTEFIEL', 'LEFTIES', 'OYSHO', 'KIABI', 'UNIQLO'] },
  { slug: 'sports_equipment', patterns: ['DECATHLON', 'INTERSPORT', 'FORUM SPORT', 'JD SPORTS', 'SPRINTER'] },
  { slug: 'electronics', patterns: ['MEDIAMARKT', 'MEDIA MARKT', 'PCCOMPONENTES', 'PC COMPONENTES', 'WORTEN', 'FNAC', 'APPLE STORE'] },
  { slug: 'home_goods', patterns: ['IKEA', 'LEROY MERLIN', 'BRICOMART', 'BRICODEPOT', 'CONFORAMA', 'MAISONS DU MONDE', 'BAUHAUS', 'TEMPUR', 'VERDECORA', 'LAMPARAYLUZ'] },
  { slug: 'bookstore', patterns: ['CASA DEL LIBRO', 'LIBRERIA', 'KINDLE', 'ABACUS'] },
  { slug: 'children', patterns: ['JUGUETTOS', 'JUGUETERIA', 'JUGUETES', 'TOYSRUS'] },
  { slug: 'other_shopping', patterns: ['AMAZON', 'AMZN', 'ALIEXPRESS', 'EL CORTE INGLES', 'SHEIN', 'ZALANDO', 'EBAY', 'TEMU', 'PRIVALIA', 'WALLAPOP', 'VEEPEE', 'OPENBANK PAY'] },

  // ── Vivienda ──────────────────────────────────────────────────────────────
  { slug: 'community_fees', patterns: ['COMUNIDAD DE PROP', 'CDAD PROP', 'ADM FINCAS', 'ADMINISTRACION DE FINCAS', 'COM VECINOS', 'COMUNIDAD DE VECINOS'] },
  { slug: 'mortgage', patterns: ['HIPOTECA', 'PRESTAMO HIPOTEC', 'CUOTA HIPOTEC'] },
  { slug: 'rent_purchase', patterns: ['ALQUILER', 'ARRENDAMIENTO'] },

  // ── Seguros ───────────────────────────────────────────────────────────────
  { slug: 'vehicle_insurance', patterns: ['LINEA DIRECTA', 'VERTI', 'GENESIS SEGUROS', 'SEGURO COCHE', 'SEGURO AUTO'] },
  { slug: 'health_insurance', patterns: ['SANITAS', 'ADESLAS', 'ASISA', 'DKV', 'CASER SALUD', 'SEGURO SALUD'] },
  { slug: 'home_insurance', patterns: ['SEGURO HOGAR', 'SEGURO DEL HOGAR'] },
  { slug: 'life_insurance', patterns: ['SEGURO VIDA', 'SEGURO DE VIDA', 'MEDVIDA'] },
  { slug: 'other_insurance', patterns: ['MAPFRE', 'ALLIANZ', 'AXA', 'GENERALI', 'ZURICH', 'CASER', 'PELAYO', 'REALE', 'OCASO', 'CATALANA OCCIDENTE', 'SEGUROS', 'SEGURO'] },

  // ── Finanzas y organismos ─────────────────────────────────────────────────
  // Pensiones de la Seguridad Social (ingreso) antes que "seguridad social" (gasto).
  { slug: 'pension', patterns: ['PRESTACION SEGURIDAD SOCIAL', 'PENSION DE TESORERIA', 'CLASES PASIVAS', 'JUBILACION'] },
  { slug: 'loans', patterns: ['CETELEM', 'COFIDIS', 'PRESTAMO', 'PAGO PRESTAMO', 'FINANCIACION', 'SANTANDER CONSUMER', 'CREDITO AL CONSUMO'] },
  { slug: 'advisors_lawyers', patterns: ['NOTARIA', 'NOTARIO', 'ABOGADOS', 'ABOGADO', 'ADVOCAT', 'PROCURADOR', 'GESTORIA', 'ASESORIA', 'ASESORES'] },
  { slug: 'taxes', patterns: ['AGENCIA TRIBUTARIA', 'AGENCIA ESTATAL', 'AEAT', 'HACIENDA', 'IMPUESTO', 'IRPF', 'TRIBUTOS', 'ORGANISME TRIBUTARI', 'TRIBUTARI', 'ATIB'] },
  { slug: 'social_security', patterns: ['SEGURIDAD SOCIAL', 'TGSS', 'TESORERIA GENERAL'] },
  { slug: 'fines', patterns: ['MULTA', 'SANCION', 'DGT', 'TRAFICO'] },
  { slug: 'city_hall', patterns: ['AYUNTAMIENTO', 'AYTO', 'AJUNTAMENT', 'DIPUTACION', 'DIPUTACIO'] },
  { slug: 'bank_charges', patterns: ['COMISION', 'MANTENIMIENTO', 'CUOTA TARJETA', 'INTERESES', 'GASTOS TARJETA', 'EMISION TARJETA'] },

  // ── Otros gastos ──────────────────────────────────────────────────────────
  { slug: 'cash', patterns: ['REINTEGRO', 'CAJERO', 'DISPOSICION EFECTIVO', 'DISPOSICION DE EFECTIVO', 'RETIRADA EFECTIVO', 'ATM'] },
  { slug: 'education', patterns: ['COLEGIO', 'UNIVERSIDAD', 'ACADEMIA', 'MATRICULA', 'GUARDERIA', 'UDEMY', 'COURSERA', 'ESCUELA'] },

  // ── Ocio: juego / loterías ────────────────────────────────────────────────
  { slug: 'lottery', patterns: ['TULOTERO', 'LOTERIA', 'LOTERIAS', 'ADMINISTRACION LOTERIA', 'ONCE', 'BWIN', 'ELECTRAWORKS', 'CODERE', 'LUCKIA', 'SPORTIUM'] },

  // ── Alojamiento ───────────────────────────────────────────────────────────
  { slug: 'hotel', patterns: ['HOTEL', 'HOSTAL', 'HOSTEL', 'PARADOR', 'BOOKING', 'AIRBNB', 'MELIA', 'BARCELO', 'ONLY YOU', 'POINTAHOTEL'] },

  // ── No computable ─────────────────────────────────────────────────────────
  { slug: 'inter_account_transfer', patterns: ['TRASPASO', 'TRANSFERENCIA INTERNA'] },
  { slug: 'investments', patterns: ['BROKER', 'INDEXA', 'MYINVESTOR', 'TRADE REPUBLIC', 'DEGIRO', 'INVERSION', 'FONDO DE INVERSION', 'COINBASE', 'BINANCE', 'CRYPTO', 'BIT2ME'] },

  // ── Ingresos ──────────────────────────────────────────────────────────────
  { slug: 'salary', patterns: ['NOMINA', 'SALARIO', 'TRANSFERENCIA NOMINA'] },
  { slug: 'rental_income', patterns: ['RENTAL MANAGEMENT', 'INMHO'] },
  { slug: 'tax_refund', patterns: ['DEVOLUCION RENTA', 'DEVOLUCION AEAT', 'ABONO HACIENDA', 'DEVOLUCION IRPF'] },
  { slug: 'dividends', patterns: ['DIVIDENDO', 'DIVIDEND', 'REPARTO DE DIVIDENDOS'] },
]

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
 * Convierte un concepto en una cadena de tokens con espacios de guarda para
 * poder buscar patrones por palabra/frase completa: `" MERCADONA C ARIBAU "`.
 */
function tokenString(concept: string): string {
  const norm = normalize(concept).replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  return norm ? ` ${norm} ` : ''
}

/**
 * Palabras que clasifican con tanta certeza que se aplican SIEMPRE, incluso
 * cuando el concepto es un Bizum (que normalmente se deja sin clasificar).
 * Matching por palabra completa, igual que el resto del diccionario.
 */
const ALWAYS_RULES: BuiltinRule[] = [
  { slug: 'community_fees', patterns: ['COMUNIDAD'] }, // gasto de comunidad
  { slug: 'salary', patterns: ['NOMINA'] },            // nómina
  { slug: 'parking_tolls', patterns: ['PARKING'] },    // parking
]

/**
 * Returns the category slug for a concept using the built-in dictionary, or
 * null if nothing matches. Matching is by whole word/phrase.
 */
export function matchBuiltinCategory(concept: string): string | null {
  const ts = tokenString(concept)
  if (!ts) return null
  // Palabras que clasifican aunque el concepto sea un Bizum (van antes del filtro).
  for (const rule of ALWAYS_RULES) {
    for (const p of rule.patterns) {
      if (ts.includes(` ${p} `)) return rule.slug
    }
  }
  // Un Bizum entre personas nunca es un comercio: no lo clasifica el diccionario.
  if (ts.includes(' BIZUM ')) return null
  for (const rule of BUILTIN_RULES) {
    for (const p of rule.patterns) {
      if (ts.includes(` ${p} `)) return rule.slug
    }
  }
  return null
}

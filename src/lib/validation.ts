import { z } from 'zod'

/**
 * Validación centralizada de todos los formularios de entrada de datos.
 *
 * Recordatorio de seguridad: esta validación corre en el navegador y es solo la
 * primera capa (UX + defensa en profundidad). La barrera real frente a un bypass
 * del cliente es Postgres — RLS + los CHECK de longitud de la migración 011. Por
 * eso los límites de aquí SIEMPRE deben ser <= a los CHECK de la BD: así el
 * cliente nunca bloquea un dato que la BD sí aceptaría, y la BD es el backstop.
 *
 * Sobre SQL injection: todo el acceso va por supabase-js/PostgREST con queries
 * parametrizadas, así que no hay concatenación de SQL. Estos esquemas añaden
 * validación de formato/longitud (defensa en profundidad), no "escapan SQL".
 */

// Límites de longitud (deben coincidir con, o ser menores que, los CHECK de 011).
export const LIMITS = {
  profileName: 60,
  accountEntity: 80,
  accountAlias: 80,
  logoUrl: 1000,
  keyword: 80,
  note: 50,
  /** Nombre de una entidad sugerida por un usuario desde el formulario de cuenta. */
  bankSuggestionName: 30,
  /** Tope defensivo del valor absoluto de un importe (mil millones). */
  amountAbs: 1_000_000_000,
} as const

/**
 * Nombre de entidad sugerida por un usuario (popup "Añadir nueva entidad").
 * Defensa en profundidad: longitud acotada y sin caracteres de marcado (`<`/`>`)
 * ni de control. El almacenamiento va parametrizado por PostgREST y React escapa
 * el texto al pintarlo, así que esto valida formato, no "escapa".
 */
export const bankSuggestionSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .max(LIMITS.bankSuggestionName, 'too_long')
  .refine((v) => !/[<>]/.test(v), 'invalid')

/** Color hex (#rgb o #rrggbb). */
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'invalid_color')

/**
 * URL externa segura: cadena vacía (sin logo) o una URL http/https válida.
 * Bloquea esquemas peligrosos como `javascript:` o `data:` que podrían acabar
 * en un atributo del DOM.
 */
export const safeUrlSchema = z
  .string()
  .trim()
  .max(LIMITS.logoUrl, 'too_long')
  .refine((v) => {
    if (v === '') return true
    try {
      const u = new URL(v)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, 'invalid_url')

/**
 * Política de contraseña reforzada (registro): mínimo 8 caracteres con al menos
 * una mayúscula, una minúscula y un número. El símbolo es opcional (solo suma
 * fortaleza en la barra). El mensaje de error es la clave i18n `weak_password`.
 */
export const passwordSchema = z
  .string()
  .min(8, 'weak_password')
  .regex(/[A-Z]/, 'weak_password')
  .regex(/[a-z]/, 'weak_password')
  .regex(/[0-9]/, 'weak_password')

/** Importe numérico finito dentro del rango defensivo. */
export const amountSchema = z
  .number()
  .finite('invalid_amount')
  .min(-LIMITS.amountAbs, 'out_of_range')
  .max(LIMITS.amountAbs, 'out_of_range')

/** Importe opcional: null (vacío) o un número válido en rango. */
export const optionalAmountSchema = amountSchema.nullable()

const ACCOUNT_TYPES = [
  'cuenta_corriente',
  'ahorro',
  'tarjeta_credito',
  'tarjeta_debito',
  'valores',
] as const

/** Formulario de cuenta (crear/editar). */
export const accountFormSchema = z.object({
  type: z.enum(ACCOUNT_TYPES, { errorMap: () => ({ message: 'required' }) }),
  entity: z.string().trim().min(1, 'required').max(LIMITS.accountEntity, 'too_long'),
  alias: z.string().trim().max(LIMITS.accountAlias, 'too_long'),
  color: hexColorSchema,
  logo_url: safeUrlSchema,
  openingBalance: optionalAmountSchema,
})

/** Formulario de regla de clasificación (keyword + condición de importe). */
export const ruleFormSchema = z
  .object({
    keyword: z.string().trim().min(1, 'required').max(LIMITS.keyword, 'too_long'),
    amount_min: optionalAmountSchema,
    amount_max: optionalAmountSchema,
    category_id: z.string().uuid('required'),
  })
  .refine(
    (d) => d.amount_min == null || d.amount_max == null || d.amount_min <= d.amount_max,
    { path: ['amount_max'], message: 'range_inverted' },
  )

/** Solo la keyword de una regla (para el paso 2 del diálogo de movimientos). */
export const keywordSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .max(LIMITS.keyword, 'too_long')

/** Nombre de un perfil financiero. */
export const profileNameSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .max(LIMITS.profileName, 'too_long')

/** Nota libre de un movimiento. */
export const noteSchema = z.string().trim().max(LIMITS.note, 'too_long')

/**
 * Devuelve el primer mensaje de error de un `safeParse`, o `null` si es válido.
 * Útil para: `const err = firstError(schema.safeParse(x)); if (err) { ...toast }`.
 */
export function firstError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'invalid'
}

/**
 * Mapa campo → primer mensaje de error de un `safeParse` (para errores inline).
 * Objeto vacío si es válido.
 */
export function fieldErrors(
  result: z.SafeParseReturnType<unknown, unknown>,
): Record<string, string> {
  if (result.success) return {}
  const out: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in out)) out[key] = issue.message
  }
  return out
}

// ------------------------------------------------------------
// Datos personales del usuario (onboarding + ajustes)
// ------------------------------------------------------------

/** Valores permitidos (deben coincidir con los CHECK de la migración 012). */
export const GENDERS = ['male', 'female', 'other', 'prefer_not_say'] as const
export const EMPLOYMENT_STATUSES = [
  'employed',
  'self_employed',
  'student',
  'retired',
  'unemployed',
  'other',
] as const
export const FINANCIAL_GOALS = [
  'save',
  'pay_off_debt',
  'invest',
  'control_spending',
  'other',
] as const

const PERSONAL_LIMITS = { firstName: 80, lastName: 80, province: 100 } as const
const MIN_BIRTH_DATE = '1900-01-01'
const todayISO = () => new Date().toISOString().slice(0, 10)

/**
 * Datos demográficos del onboarding. Todos obligatorios salvo `financial_goal`.
 * Los mensajes son claves i18n (`settings:personal.errors.*`).
 */
// ------------------------------------------------------------
// Backoffice /admin (migración 016)
// ------------------------------------------------------------

/** Tope de longitudes del backoffice (<= CHECK de BD donde aplique). */
export const ADMIN_LIMITS = {
  bankName: 80,
  catSlug: 80,
  catLabel: 120,
  iconName: 60,
} as const

const CATEGORY_TYPES = ['gasto', 'ingreso', 'no_computable'] as const

/** Slug de categoría/grupo: minúsculas, dígitos y guion bajo (clave i18n). */
export const slugSchema = z
  .string()
  .trim()
  .min(1, 'required')
  .max(ADMIN_LIMITS.catSlug, 'too_long')
  .regex(/^[a-z0-9_]+$/, 'invalid_slug')

/** Nombre de icono lucide en kebab/snake-case (opcional). */
export const iconNameSchema = z
  .string()
  .trim()
  .max(ADMIN_LIMITS.iconName, 'too_long')
  .regex(/^[a-z0-9-]*$/, 'invalid_icon')

/** Formulario de entidad bancaria (admin). */
export const bankEntityFormSchema = z.object({
  name: z.string().trim().min(1, 'required').max(ADMIN_LIMITS.bankName, 'too_long'),
  logo_url: safeUrlSchema,
  sort_order: z.number().int('invalid').min(0, 'out_of_range').max(32767, 'out_of_range'),
})

const labelEsEn = {
  label_es: z.string().trim().min(1, 'required').max(ADMIN_LIMITS.catLabel, 'too_long'),
  label_en: z.string().trim().min(1, 'required').max(ADMIN_LIMITS.catLabel, 'too_long'),
}

/** Formulario de grupo de categorías (admin). */
export const categoryGroupFormSchema = z.object({
  slug: slugSchema,
  type: z.enum(CATEGORY_TYPES, { errorMap: () => ({ message: 'required' }) }),
  icon: iconNameSchema,
  color: z.union([hexColorSchema, z.literal('')]),
  sort_order: z.number().int('invalid').min(0, 'out_of_range').max(32767, 'out_of_range'),
  ...labelEsEn,
})

/** Formulario de subcategoría (admin). */
export const categoryFormSchema = z.object({
  slug: slugSchema,
  group_id: z.string().uuid('required'),
  icon: iconNameSchema,
  sort_order: z.number().int('invalid').min(0, 'out_of_range').max(32767, 'out_of_range'),
  ...labelEsEn,
})

export const personalDataSchema = z.object({
  first_name: z.string().trim().min(1, 'required').max(PERSONAL_LIMITS.firstName, 'too_long'),
  last_name: z.string().trim().min(1, 'required').max(PERSONAL_LIMITS.lastName, 'too_long'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'required' }) }),
  birth_date: z
    .string()
    .min(1, 'required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), 'invalid')
    .refine((v) => v >= MIN_BIRTH_DATE && v <= todayISO(), 'invalid'),
  country: z.string().regex(/^[A-Z]{2}$/, 'required'),
  province: z.string().trim().min(1, 'required').max(PERSONAL_LIMITS.province, 'too_long'),
  employment_status: z.enum(EMPLOYMENT_STATUSES, { errorMap: () => ({ message: 'required' }) }),
  financial_goal: z.union([z.enum(FINANCIAL_GOALS), z.literal('')]).optional(),
})

export type PersonalData = z.infer<typeof personalDataSchema>

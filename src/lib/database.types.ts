export type AccountType = 'cuenta_corriente' | 'ahorro' | 'tarjeta_credito' | 'tarjeta_debito' | 'valores'
export type TransactionType = 'gasto' | 'ingreso' | 'no_computable'
export type CategoryType = 'gasto' | 'ingreso' | 'no_computable'
export type KeywordMatchType = 'contains' | 'starts_with' | 'ends_with' | 'exact' | 'regex'
export type FileFormatType = 'csv' | 'xlsx' | 'xls'
export type SignConventionType = 'signed' | 'unsigned_type' | 'split_columns'
export type PlanType = 'free' | 'pro' | 'premium'

export type UserSettings = {
  user_id: string
  preferred_language: string
  // Datos demográficos del onboarding (migración 012). Null hasta completarlos.
  // `full_name` = `first_name + ' ' + last_name` (derivado, migración 020).
  full_name: string | null
  first_name: string | null
  last_name: string | null
  gender: string | null
  birth_date: string | null
  country: string | null
  province: string | null
  employment_status: string | null
  financial_goal: string | null
  onboarding_completed: boolean
  // Rol de administrador (migración 015). Gobierna la escritura de catálogos
  // globales vía RLS + el acceso a /admin en el frontend.
  is_admin: boolean
  // Plan de suscripción (migración 022). No auto-asignable: solo is_admin()
  // puede cambiarlo (trigger `prevent_plan_self_change`).
  plan: PlanType
  created_at: string
  updated_at: string
}

// Topes por plan (migración 022). NULL en cualquier campo numérico = ilimitado.
export type PlanLimits = {
  plan: PlanType
  max_profiles: number | null
  max_accounts: number | null
  max_imports_per_month: number | null
  max_movements_per_month: number | null
  max_rules: number | null
  has_ai_classification: boolean
  has_budget: boolean
  has_export: boolean
  has_scheduled_export: boolean
  dashboard_history_months: number | null
  has_investments: boolean
  has_networth: boolean
  updated_at: string
}

// Registro de cada cambio de plan (migración 022), alimentado por un trigger.
// Solo lectura para admin; base de la futura gráfica de evolución.
export type PlanHistory = {
  id: string
  user_id: string
  old_plan: PlanType
  new_plan: PlanType
  changed_by: string | null
  changed_at: string
}

// Consumo del mes en curso del usuario autenticado (RPC get_plan_usage).
export type PlanUsage = {
  movements_this_month: number
  imports_this_month: number
  profiles_count: number
  accounts_count: number
  rules_count: number
}

export type FinancialProfile = {
  id: string
  user_id: string
  name: string
  avatar_color: string
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Account = {
  id: string
  profile_id: string
  name: string
  entity: string
  type: AccountType
  currency: string
  iban: string | null
  last_four: string | null
  color: string
  logo_url: string | null
  is_active: boolean
  sort_order: number
  /** Saldo inicial de la cuenta (antes de su primer movimiento). El saldo actual
   *  se calcula como opening_balance + suma de los importes de sus movimientos.
   *  NULL = sin referencia todavía → la cuenta aparece "sin saldo". */
  opening_balance: number | null
  created_at: string
  updated_at: string
}

export type BankEntity = {
  id: string
  name: string
  logo_url: string | null
  sort_order: number
  /** false = entidad creada por un usuario, pendiente de revisión del admin. */
  reviewed: boolean
  created_by: string | null
  created_at: string
}

// Catálogo de comercios reconocidos (migración 034), con logo. Enlazado desde
// dictionary_rules/community_rule_usage vía merchant_id.
export type Merchant = {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  // joined (migración 036) — variaciones de concepto; si hay alguna, sustituyen
  // al nombre para efectos de matching (ver matchMerchant en categoryRules.ts)
  patterns?: { pattern: string }[]
}

// Variación de concepto asociada a un comercio (migración 036).
export type MerchantPattern = {
  id: string
  merchant_id: string
  pattern: string
  created_at: string
}

export type CategoryGroup = {
  id: string
  slug: string
  type: CategoryType
  icon: string | null
  color: string | null
  sort_order: number
}

export type Category = {
  id: string
  group_id: string
  slug: string
  icon: string | null
  sort_order: number
  // joined
  group?: CategoryGroup
}

// Importe recurrente mensual presupuestado para UNA subcategoría de un perfil
// (migración 026). El total del "sobre" (category_groups) es la suma de las
// budget_rules de sus subcategorías — no se guarda a nivel de grupo.
export type BudgetRule = {
  id: string
  profile_id: string
  category_id: string
  amount: number
  created_at: string
  updated_at: string
}

// Orden manual (arrastrar) de las subcategorías dentro de un sobre, por perfil
// (migración 027). Solo existe fila cuando el usuario reordena; el resto usa
// el `sort_order` por defecto de `categories`.
export type BudgetCategoryOrder = {
  id: string
  profile_id: string
  category_id: string
  sort_order: number
  updated_at: string
}

// Traducción (ES/EN) de un grupo o subcategoría, editable por admin en runtime
// (migración 016). Se fusiona sobre el bundle categories.json en el cliente.
export type CategoryTranslation = {
  key_type: 'group' | 'category'
  slug: string
  lang: string
  label: string
  updated_at: string
}

// ------------------------------------------------------------
// Filas devueltas por las RPC de administración (migración 017)
// ------------------------------------------------------------
export type AdminUserRow = {
  user_id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  country: string | null
  province: string | null
  gender: string | null
  birth_date: string | null
  employment_status: string | null
  financial_goal: string | null
  onboarding_completed: boolean
  // Plan de suscripción (migración 024, extiende admin_list_users de la 017).
  plan: PlanType
  is_admin: boolean
  profiles_count: number
  accounts_count: number
  transactions_count: number
  first_tx: string | null
  last_tx: string | null
  last_import: string | null
}

export type AdminCategoryBreakdownRow = {
  category_id: string | null
  category_slug: string | null
  group_slug: string | null
  transaction_type: TransactionType | null
  total_abs: number
  cnt: number
}

export type AdminMonthlyRow = {
  month: string
  transaction_type: TransactionType | null
  total_abs: number
  cnt: number
}

export type AdminStatsOverview = {
  total_users: number
  onboarded_users: number
  admin_users: number
  total_profiles: number
  total_accounts: number
  total_transactions: number
  imported_transactions: number
  manual_transactions: number
}

export type AdminSignupRow = { month: string; cnt: number }
export type AdminDemographicRow = { dimension: string; bucket: string; cnt: number }
// Evolución de usuarios por plan a lo largo del tiempo (migración 024, RPC admin_plan_evolution).
export type AdminPlanEvolutionRow = { bucket: string; plan: PlanType; cnt: number }

export type BankFormat = {
  id: string
  user_id: string
  name: string
  entity: string
  file_format: FileFormatType
  delimiter: string
  encoding: string
  skip_rows: number
  date_column: string
  date_format: string
  time_column: string | null
  concept_column: string
  amount_column: string | null
  balance_column: string | null
  sign_convention: SignConventionType
  type_column: string | null
  debit_marker: string | null
  debit_column: string | null
  credit_column: string | null
  /** Columna de estado de la transacción (p.ej. Revolut: COMPLETED/REVERTED/PENDING). Migración 025. */
  state_column: string | null
  /** Columna de retención/impuesto a restar del importe bruto (p.ej. Trade Republic). Migración 030. */
  tax_column: string | null
  /** Columna de comisión a restar del importe bruto. Migración 030. */
  fee_column: string | null
  created_at: string
  updated_at: string
}

export type ImportBatch = {
  id: string
  profile_id: string
  account_id: string
  bank_format_id: string | null
  filename: string
  file_hash: string | null
  rows_total: number
  rows_imported: number
  rows_skipped: number
  rows_failed: number
  date_from: string | null
  date_to: string | null
  imported_at: string
}

export type Transaction = {
  id: string
  profile_id: string
  account_id: string
  import_batch_id: string | null
  date: string
  concept: string
  amount: number
  balance: number | null
  transaction_type: TransactionType | null
  category_id: string | null
  notes: string | null
  is_manual: boolean
  is_reviewed: boolean
  dedup_hash: string
  merchant_id: string | null // migración 035
  created_at: string
  updated_at: string
  // joined
  account?: Account
  category?: Category
}

export type KeywordRule = {
  id: string
  user_id: string
  profile_id: string | null  // null = todos los perfiles
  keyword: string
  match_type: KeywordMatchType
  category_id: string
  priority: number
  is_active: boolean
  amount_min: number | null  // |importe| ≥ amount_min (null = sin mínimo)
  amount_max: number | null  // |importe| ≤ amount_max (null = sin máximo)
  created_at: string
  // joined
  category?: Category
}

// Agregado público de reglas de la comunidad (merchant_key → categoría + votos)
export type CommunityRule = {
  merchant_key: string
  category_id: string
  votes: number
  updated_at: string
}

// Contribución individual (privada) de un usuario a la comunidad
export type CommunityRuleContribution = {
  user_id: string
  merchant_key: string
  category_id: string
  updated_at: string
}

// Contador de uso de una regla de comunidad (migración 033), aparte de
// community_rules porque esa tabla se borra/reinserta en cada voto
// (recompute_community_rule) y perdería cualquier columna extra.
export type CommunityRuleUsage = {
  merchant_key: string
  use_count: number
  updated_at: string
  merchant_id: string | null // migración 034
}

// Diccionario de clasificación integrado (migración 032), editable desde
// /admin/reglas. Sustituye al array fijo BUILTIN_RULES/ALWAYS_RULES que antes
// vivía en categoryRules.ts.
export type DictionaryRule = {
  id: string
  category_id: string
  pattern: string           // normalizado en mayúsculas
  applies_to_bizum: boolean // ver ALWAYS_RULES en categoryRules.ts
  sort_order: number
  use_count: number         // migración 033
  merchant_id: string | null // migración 034
  created_at: string
  // joined
  category?: Category
}

// Feedback / soporte enviado por el usuario (migración 014).
// Solo-inserción para el usuario; lo lee el admin desde /admin/feedback (migración 021).
export type FeedbackType = 'suggestion' | 'complaint' | 'bug' | 'other'
export type Feedback = {
  id: string
  user_id: string | null
  email: string | null
  type: FeedbackType
  message: string
  app_version: string | null
  created_at: string
  // NULL = no leído. Solo el admin lo escribe (GRANT a nivel de columna, migración 021).
  read_at: string | null
}

// Tipo genérico para la DB (compatible con supabase-js)
export type Database = {
  public: {
    Tables: {
      user_settings: { Row: UserSettings; Insert: Partial<UserSettings>; Update: Partial<UserSettings>; Relationships: [] }
      financial_profiles: { Row: FinancialProfile; Insert: Omit<FinancialProfile, 'id' | 'created_at' | 'updated_at' | 'sort_order'> & { sort_order?: number }; Update: Partial<FinancialProfile>; Relationships: [] }
      accounts: { Row: Account; Insert: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'logo_url' | 'opening_balance'> & { logo_url?: string | null; opening_balance?: number | null }; Update: Partial<Account>; Relationships: [] }
      bank_entities: { Row: BankEntity; Insert: Omit<BankEntity, 'id' | 'created_at' | 'sort_order' | 'reviewed' | 'created_by'> & { sort_order?: number; reviewed?: boolean; created_by?: string | null }; Update: Partial<BankEntity>; Relationships: [] }
      merchants: { Row: Merchant; Insert: Omit<Merchant, 'id' | 'created_at' | 'patterns'>; Update: Partial<Omit<Merchant, 'patterns'>>; Relationships: [] }
      merchant_patterns: { Row: MerchantPattern; Insert: Omit<MerchantPattern, 'id' | 'created_at'>; Update: Partial<MerchantPattern>; Relationships: [] }
      category_groups: { Row: CategoryGroup; Insert: Omit<CategoryGroup, 'id'>; Update: Partial<CategoryGroup>; Relationships: [] }
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'group'>; Update: Partial<Omit<Category, 'group'>>; Relationships: [] }
      category_translations: { Row: CategoryTranslation; Insert: Omit<CategoryTranslation, 'updated_at'> & { updated_at?: string }; Update: Partial<CategoryTranslation>; Relationships: [] }
      bank_formats: { Row: BankFormat; Insert: Omit<BankFormat, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BankFormat>; Relationships: [] }
      import_batches: { Row: ImportBatch; Insert: Omit<ImportBatch, 'id' | 'imported_at' | 'file_hash'> & { file_hash?: string | null }; Update: Partial<ImportBatch>; Relationships: [] }
      transactions: { Row: Transaction; Insert: Omit<Transaction, 'id' | 'updated_at' | 'merchant_id'> & { created_at?: string; merchant_id?: string | null }; Update: Partial<Transaction>; Relationships: [] }
      keyword_rules: { Row: KeywordRule; Insert: Omit<KeywordRule, 'id' | 'created_at' | 'amount_min' | 'amount_max'> & { amount_min?: number | null; amount_max?: number | null }; Update: Partial<KeywordRule>; Relationships: [] }
      community_rules: { Row: CommunityRule; Insert: CommunityRule; Update: Partial<CommunityRule>; Relationships: [] }
      community_rule_contributions: { Row: CommunityRuleContribution; Insert: CommunityRuleContribution; Update: Partial<CommunityRuleContribution>; Relationships: [] }
      dictionary_rules: { Row: DictionaryRule; Insert: Omit<DictionaryRule, 'id' | 'created_at' | 'use_count' | 'category' | 'merchant_id'> & { use_count?: number; merchant_id?: string | null }; Update: Partial<Omit<DictionaryRule, 'category'>>; Relationships: [] }
      community_rule_usage: { Row: CommunityRuleUsage; Insert: Omit<CommunityRuleUsage, 'updated_at' | 'merchant_id'> & { updated_at?: string; merchant_id?: string | null }; Update: Partial<CommunityRuleUsage>; Relationships: [] }
      feedback: { Row: Feedback; Insert: Omit<Feedback, 'id' | 'created_at' | 'read_at'>; Update: Partial<Feedback>; Relationships: [] }
      plan_limits: { Row: PlanLimits; Insert: PlanLimits; Update: Partial<PlanLimits>; Relationships: [] }
      plan_history: { Row: PlanHistory; Insert: Omit<PlanHistory, 'id' | 'changed_at'>; Update: never; Relationships: [] }
      budget_rules: { Row: BudgetRule; Insert: Omit<BudgetRule, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BudgetRule>; Relationships: [] }
      budget_category_order: { Row: BudgetCategoryOrder; Insert: Omit<BudgetCategoryOrder, 'id' | 'updated_at'>; Update: Partial<BudgetCategoryOrder>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      upsert_community_vote: { Args: { p_merchant_key: string; p_category_id: string }; Returns: undefined }
      increment_dictionary_usage: { Args: { p_rule_ids: string[] }; Returns: undefined }
      increment_community_usage: { Args: { p_merchant_keys: string[] }; Returns: undefined }
      admin_link_merchant_transactions: { Args: { p_merchant_id: string }; Returns: number }
      admin_merchant_usage_counts: { Args: Record<string, never>; Returns: { merchant_id: string; use_count: number }[] }
      delete_community_vote: { Args: { p_merchant_key: string }; Returns: undefined }
      recompute_community_rule: { Args: { p_merchant_key: string }; Returns: undefined }
      admin_list_users: { Args: Record<string, never>; Returns: AdminUserRow[] }
      admin_user_category_breakdown: { Args: { p_user_id: string }; Returns: AdminCategoryBreakdownRow[] }
      admin_user_monthly: { Args: { p_user_id: string }; Returns: AdminMonthlyRow[] }
      admin_stats_overview: { Args: Record<string, never>; Returns: AdminStatsOverview[] }
      admin_signups_by_month: { Args: Record<string, never>; Returns: AdminSignupRow[] }
      admin_demographics: { Args: Record<string, never>; Returns: AdminDemographicRow[] }
      admin_plan_evolution: { Args: { p_granularity: string }; Returns: AdminPlanEvolutionRow[] }
      get_plan_usage: { Args: Record<string, never>; Returns: PlanUsage[] }
    }
    Enums: Record<string, never>
  }
}

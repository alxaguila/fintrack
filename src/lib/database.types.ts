export type AccountType = 'cuenta_corriente' | 'ahorro' | 'tarjeta_credito' | 'tarjeta_debito' | 'valores'
export type TransactionType = 'gasto' | 'ingreso' | 'no_computable'
export type CategoryType = 'gasto' | 'ingreso' | 'no_computable'
export type KeywordMatchType = 'contains' | 'starts_with' | 'ends_with' | 'exact' | 'regex'
export type FileFormatType = 'csv' | 'xlsx' | 'xls'
export type SignConventionType = 'signed' | 'unsigned_type' | 'split_columns'

export type UserSettings = {
  user_id: string
  preferred_language: string
  // Datos demográficos del onboarding (migración 012). Null hasta completarlos.
  full_name: string | null
  gender: string | null
  birth_date: string | null
  country: string | null
  province: string | null
  employment_status: string | null
  financial_goal: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
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

// Tipo genérico para la DB (compatible con supabase-js)
export type Database = {
  public: {
    Tables: {
      user_settings: { Row: UserSettings; Insert: Partial<UserSettings>; Update: Partial<UserSettings>; Relationships: [] }
      financial_profiles: { Row: FinancialProfile; Insert: Omit<FinancialProfile, 'id' | 'created_at' | 'updated_at' | 'sort_order'> & { sort_order?: number }; Update: Partial<FinancialProfile>; Relationships: [] }
      accounts: { Row: Account; Insert: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'logo_url' | 'opening_balance'> & { logo_url?: string | null; opening_balance?: number | null }; Update: Partial<Account>; Relationships: [] }
      bank_entities: { Row: BankEntity; Insert: Omit<BankEntity, 'id' | 'created_at'>; Update: Partial<BankEntity>; Relationships: [] }
      category_groups: { Row: CategoryGroup; Insert: Omit<CategoryGroup, 'id'>; Update: Partial<CategoryGroup>; Relationships: [] }
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Category>; Relationships: [] }
      bank_formats: { Row: BankFormat; Insert: Omit<BankFormat, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BankFormat>; Relationships: [] }
      import_batches: { Row: ImportBatch; Insert: Omit<ImportBatch, 'id' | 'imported_at' | 'file_hash'> & { file_hash?: string | null }; Update: Partial<ImportBatch>; Relationships: [] }
      transactions: { Row: Transaction; Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Transaction>; Relationships: [] }
      keyword_rules: { Row: KeywordRule; Insert: Omit<KeywordRule, 'id' | 'created_at' | 'amount_min' | 'amount_max'> & { amount_min?: number | null; amount_max?: number | null }; Update: Partial<KeywordRule>; Relationships: [] }
      community_rules: { Row: CommunityRule; Insert: CommunityRule; Update: Partial<CommunityRule>; Relationships: [] }
      community_rule_contributions: { Row: CommunityRuleContribution; Insert: CommunityRuleContribution; Update: Partial<CommunityRuleContribution>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      upsert_community_vote: { Args: { p_merchant_key: string; p_category_id: string }; Returns: undefined }
      delete_community_vote: { Args: { p_merchant_key: string }; Returns: undefined }
      recompute_community_rule: { Args: { p_merchant_key: string }; Returns: undefined }
    }
    Enums: Record<string, never>
  }
}

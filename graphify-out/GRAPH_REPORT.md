# Graph Report - alx_FinTrack  (2026-07-24)

## Corpus Check
- 278 files · ~186,207 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1100 nodes · 1549 edges · 100 communities (82 shown, 18 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 314 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7364104`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Transactions|Transactions]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_database.types.ts|database.types.ts]]
- [[_COMMUNITY_Sidebar.tsx|Sidebar.tsx]]
- [[_COMMUNITY_Home.tsx|Home.tsx]]
- [[_COMMUNITY_Dashboard|Dashboard]]
- [[_COMMUNITY_useImport.ts|useImport.ts]]
- [[_COMMUNITY_validation.ts|validation.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_useTransactions.ts|useTransactions.ts]]
- [[_COMMUNITY_AccountForm.tsx|AccountForm.tsx]]
- [[_COMMUNITY_History|History]]
- [[_COMMUNITY_xlsx.ts|xlsx.ts]]
- [[_COMMUNITY_cn|cn]]
- [[_COMMUNITY_Transactions|Transactions]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_dropdown-menu.tsx|dropdown-menu.tsx]]
- [[_COMMUNITY_FinTrack|FinTrack]]
- [[_COMMUNITY_useToast.ts|useToast.ts]]
- [[_COMMUNITY_PasswordStrengthBar|PasswordStrengthBar]]
- [[_COMMUNITY_card.tsx|card.tsx]]
- [[_COMMUNITY_use-toast.ts|use-toast.ts]]
- [[_COMMUNITY_useCommunityRules.ts|useCommunityRules.ts]]
- [[_COMMUNITY_Auth.tsx|Auth.tsx]]
- [[_COMMUNITY_settings.json|settings.json]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_button.tsx|button.tsx]]
- [[_COMMUNITY_badge.tsx|badge.tsx]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_input.tsx|input.tsx]]
- [[_COMMUNITY_exportSafe.ts|exportSafe.ts]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_vercel.json|vercel.json]]
- [[_COMMUNITY_label.tsx|label.tsx]]
- [[_COMMUNITY_date-picker-field.tsx|date-picker-field.tsx]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_textarea.tsx|textarea.tsx]]
- [[_COMMUNITY_Separator|Separator]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_Landing.tsx|Landing.tsx]]
- [[_COMMUNITY_EnvelopeDetailDialog.tsx|EnvelopeDetailDialog.tsx]]
- [[_COMMUNITY_toast.tsx|toast.tsx]]
- [[_COMMUNITY_plan.ts|plan.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_toast.tsx|toast.tsx]]
- [[_COMMUNITY_Informe de auditoría RLS — Fase 0 (Arquitectura de administración)|Informe de auditoría RLS — Fase 0 (Arquitectura de administración)]]
- [[_COMMUNITY_backfill-merchant-usage.mjs|backfill-merchant-usage.mjs]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_zafyros|zafyros]]
- [[_COMMUNITY_Security.tsx|Security.tsx]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_categoryRules.ts|categoryRules.ts]]
- [[_COMMUNITY_useIsAdmin|useIsAdmin]]
- [[_COMMUNITY_useUserSettings|useUserSettings]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_lucideCatalog.ts|lucideCatalog.ts]]
- [[_COMMUNITY_TooltipContent|TooltipContent]]
- [[_COMMUNITY_entityAvatar.ts|entityAvatar.ts]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_usePlan.ts|usePlan.ts]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_Sidebar.tsx|Sidebar.tsx]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_Separator|Separator]]
- [[_COMMUNITY_DatePickerField|DatePickerField]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_ClassificationRules.tsx|ClassificationRules.tsx]]
- [[_COMMUNITY_ImportErrorBoundary|ImportErrorBoundary]]
- [[_COMMUNITY_isCardSettlementConcept|isCardSettlementConcept]]
- [[_COMMUNITY_computeBalances.ts|computeBalances.ts]]
- [[_COMMUNITY_dedup.ts|dedup.ts]]
- [[_COMMUNITY_Product|Product]]

## God Nodes (most connected - your core abstractions)
1. `Changelog` - 70 edges
2. `cn()` - 53 edges
3. `Budgets()` - 26 edges
4. `Dashboard()` - 22 edges
5. `ImportInner()` - 19 edges
6. `Transactions()` - 19 edges
7. `compilerOptions` - 19 edges
8. `appPath()` - 18 edges
9. `DictionaryPanel()` - 18 edges
10. `Home()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileSwitcher.tsx → src/lib/utils.ts
- `TransactionRow()` --calls--> `resolveEntityAvatar()`  [INFERRED]
  src/components/transactions/TransactionRow.tsx → src/lib/entityAvatar.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `PopoverContent()` --calls--> `cn()`  [INFERRED]
  src/components/ui/popover.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (100 total, 18 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (33): 10. Cookies, 10. Cookies, 11. Availability and modification of the service, 11. Disponibilidad y modificación del servicio, 12. Amendments to this Legal Notice, 12. Modificaciones del presente Aviso Legal, 13. Nulidad e ineficacia parcial, 13. Severability (+25 more)

### Community 1 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, class-variance-authority, clsx, country-region-data, date-fns, @hookform/resolvers, i18next, i18next-browser-languagedetector (+28 more)

### Community 2 - "database.types.ts"
Cohesion: 0.07
Nodes (26): AdminCategoryBreakdownRow, AdminDemographicRow, AdminMonthlyRow, AdminPlanEvolutionRow, AdminSignupRow, AdminStatsOverview, AdminUserRow, BankEntity (+18 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): RequestData, requestSchema, ResetData, resetSchema

### Community 4 - "Home.tsx"
Cohesion: 0.05
Nodes (43): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+35 more)

### Community 5 - "Dashboard"
Cohesion: 0.05
Nodes (48): useAdminFeedback(), useMarkFeedbackRead(), useUnreadFeedbackCount(), addMerchantPatterns(), defaultPatterns(), linkMerchantTransactions(), MerchantInput, useCreateMerchant() (+40 more)

### Community 6 - "useImport.ts"
Cohesion: 0.21
Nodes (13): DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), parseDate(), ParsedRow, reconcileProfileTransfers() (+5 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (30): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.20
Nodes (8): useBankFormats(), useUpsertBankFormat(), useParseFile(), DATE_FORMATS, ImportInner(), SIGN_CONVENTIONS, Step, todayISO()

### Community 10 - "AccountForm.tsx"
Cohesion: 0.26
Nodes (9): Toast(), ToastAction(), ToastActionElement, ToastClose(), ToastDescription(), ToastProps, ToastTitle(), toastVariants (+1 more)

### Community 11 - "History"
Cohesion: 0.06
Nodes (35): AccountCard(), AccountCardProps, freshColor(), PlanEvolutionGranularity, useAdminPlanEvolution(), useAdminSetPlan(), useAdminStats(), useAdminUserActivity() (+27 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.24
Nodes (12): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), SelectContent(), SelectItem() (+4 more)

### Community 15 - "Transactions"
Cohesion: 0.07
Nodes (40): BudgetSummaryCard(), BudgetSummaryCardProps, EnvelopeRow(), fmtAmount(), applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow (+32 more)

### Community 16 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+5 more)

### Community 17 - "transferMatch.ts"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubTrigger

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom (+3 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.11
Nodes (20): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, COMPLETED_DATE_PAT, CONCEPT_PAT, CREDIT_PAT, CURRENCY_PAT (+12 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.47
Nodes (8): matchBuiltinCategory(), matchMerchant(), merchantKey(), normalize(), normalizePattern(), tokenString(), wildcardToRegex(), classifyConcept()

### Community 21 - "FinTrack"
Cohesion: 0.03
Nodes (70): Changelog, v1.422, v1.429, v1.437, v1.439, v1.442, v1.446, v1.448 (+62 more)

### Community 22 - "useToast.ts"
Cohesion: 0.32
Nodes (7): listeners, notify(), toast(), ToastItem, toastQueue, ToastVariant, useToast()

### Community 23 - "PasswordStrengthBar"
Cohesion: 0.38
Nodes (5): LEVEL_COLOR, PasswordStrengthBar(), getZxcvbn(), passwordChecks(), scorePassword()

### Community 24 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 25 - "use-toast.ts"
Cohesion: 0.43
Nodes (6): dispatch(), listeners, memToasts, toast(), ToastMessage, useToast()

### Community 27 - "Auth.tsx"
Cohesion: 0.29
Nodes (10): SubcategoryBudget, applyKeywordRules(), matches(), ClassificationSource, ClassifyContext, ClassifyResult, Category, DictionaryRule (+2 more)

### Community 28 - "settings.json"
Cohesion: 0.50
Nodes (3): hooks, UserPromptSubmit, $schema

### Community 29 - "Settings.tsx"
Cohesion: 0.10
Nodes (18): splitAmount(), TransactionRow(), TransactionRowProps, TYPE_BADGE, groupNet(), TransactionsList(), TransactionsListProps, useIsMobile() (+10 more)

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.40
Nodes (3): LoginData, loginSchema, Props

### Community 32 - "tabs.tsx"
Cohesion: 0.14
Nodes (13): BRAND, BrandMark(), HeroDashboardMock(), useCountUp(), Block, LegalDocument(), Props, renderInline() (+5 more)

### Community 36 - "vercel.json"
Cohesion: 0.50
Nodes (3): headers, rewrites, $schema

### Community 38 - "date-picker-field.tsx"
Cohesion: 0.40
Nodes (4): Database, supabase, supabaseAnonKey, supabaseUrl

### Community 41 - "Separator"
Cohesion: 0.25
Nodes (5): getAppUrl(), Landing(), Register(), SignupData, signupSchema

### Community 61 - "Landing.tsx"
Cohesion: 0.15
Nodes (12): ComboSelect(), emptyPersonalForm, PersonalDataFields(), PersonalFormValue, Props, CountryOption, CountryTuple, getCountries() (+4 more)

### Community 62 - "EnvelopeDetailDialog.tsx"
Cohesion: 0.33
Nodes (4): App(), appChildren(), queryClient, invalidatePlanUsage()

### Community 63 - "toast.tsx"
Cohesion: 0.29
Nodes (6): ACCOUNT_SECTIONS, ACCOUNT_TYPE_META, AccountFilter, AccountSection, FILTER_TYPES, AccountType

### Community 64 - "plan.ts"
Cohesion: 0.15
Nodes (13): LimitReachedDialog(), PlanLimits, PlanType, PlanUsage, daysUntilReset(), DIMENSION_KEYS, FeatureFlag, hasFeature() (+5 more)

### Community 67 - "Settings.tsx"
Cohesion: 0.32
Nodes (4): LimitReachedDialogProps, UpgradeHintDialogProps, UpgradePlanDialog(), UpgradePlanDialogProps

### Community 68 - "toast.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 69 - "Informe de auditoría RLS — Fase 0 (Arquitectura de administración)"
Cohesion: 0.25
Nodes (7): Agujeros cerrados, Auditoría tabla por tabla, Clasificación de tablas, Criterio de aceptación (prueba de fuego), Informe de auditoría RLS — Fase 0 (Arquitectura de administración), Modelo de roles, Pasos manuales pendientes (owner)

### Community 70 - "backfill-merchant-usage.mjs"
Cohesion: 0.33
Nodes (9): iterateAllConcepts(), loadCommunityMerchantKeys(), loadDictionaryRules(), main(), matchBuiltinCategory(), merchantKey(), normalize(), supabase (+1 more)

### Community 71 - "transferMatch.ts"
Cohesion: 0.08
Nodes (39): BudgetAmountSlider(), BudgetAmountSliderProps, niceScale(), stepFor(), EnvelopeDetailDialog(), EnvelopeDetailDialogProps, fmtCompact(), MonthAmountStrip() (+31 more)

### Community 72 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 73 - "zafyros"
Cohesion: 0.22
Nodes (7): Arquitectura clave, Comandos / setup, Gotchas ya resueltos (no reintroducir), Reglas de trabajo obligatorias (aunque no se pidan explícitamente), Sistema de diseño (obligatorio converger en pantallas nuevas), Stack, zafyros

### Community 74 - "Security.tsx"
Cohesion: 0.23
Nodes (5): TYPES, USAGE_DIMENSIONS, ChangePasswordData, changePasswordSchema, SettingsHeader()

### Community 75 - "Settings.tsx"
Cohesion: 0.22
Nodes (5): LanguageSelector(), useUpdateLanguage(), DeleteAccountRow(), LanguageRow(), Settings()

### Community 76 - "categoryRules.ts"
Cohesion: 0.50
Nodes (3): Account, EntityAvatar, resolveEntityAvatar()

### Community 79 - "PopoverContent"
Cohesion: 0.07
Nodes (39): IconPicker(), SubcategoryEditor(), CategoryCombobox(), CategoryComboboxProps, normalize(), CategoryInput, deleteTranslations(), GroupInput (+31 more)

### Community 86 - "tabs.tsx"
Cohesion: 0.27
Nodes (11): bottomItemClass(), bottomItems, BottomNavLink(), BudgetsBottomNavItem(), DrawerBudgetsItem(), drawerItemClass(), MobileBottomNav(), MobileTopBar() (+3 more)

### Community 87 - "usePlan.ts"
Cohesion: 0.20
Nodes (11): useBudgetsGate(), useLimitGate(), usePlan(), usePlanLimits(), usePlanUsage(), useUpdateUserProfile(), useUserSettings(), checkLimit() (+3 more)

### Community 88 - "transferMatch.ts"
Cohesion: 0.13
Nodes (11): AppShell(), ProfileAvatar(), ProfileSwitcher(), ProfileContext, ProfileContextValue, useProfile(), KEY, useCategoryTranslations() (+3 more)

### Community 89 - "Sidebar.tsx"
Cohesion: 0.21
Nodes (9): BudgetsNavItem(), itemClass(), navItemsBottom, navItemsTop, Sidebar(), UpgradePlanNavItem(), UserPlanNavItem(), useUnreviewedBankCount() (+1 more)

### Community 90 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent(), TabsList(), TabsTrigger()

### Community 94 - "transferMatch.ts"
Cohesion: 0.38
Nodes (9): daysBetween(), findTransferPairs(), haveSharedToken(), isTransferConcept(), normalizeConcept(), STOPWORDS, TRANSFER_ROOTS, transferTokens() (+1 more)

### Community 96 - "ClassificationRules.tsx"
Cohesion: 0.40
Nodes (4): EMPTY_FORM, parseAmount(), RuleForm, RuleType

### Community 99 - "isCardSettlementConcept"
Cohesion: 0.83
Nodes (3): isCardSettlementConcept(), normalizeConcept(), SETTLEMENT_PATTERNS

### Community 100 - "computeBalances.ts"
Cohesion: 0.67
Nodes (3): BalanceMovement, propagateBalances(), round2()

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

## Knowledge Gaps
- **439 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+434 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Home.tsx`, `Dashboard`, `AccountForm.tsx`, `History`, `Transactions`, `transferMatch.ts`, `PasswordStrengthBar`, `Settings.tsx`, `Landing.tsx`, `toast.tsx`, `transferMatch.ts`, `Settings.tsx`, `useUserSettings`, `PopoverContent`, `TooltipContent`, `entityAvatar.ts`, `tabs.tsx`, `usePlan.ts`, `transferMatch.ts`, `Sidebar.tsx`, `tabs.tsx`, `Separator`, `DatePickerField`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `ImportInner()` connect `useTransactions.ts` to `ClassificationRules.tsx`, `Home.tsx`, `Dashboard`, `useImport.ts`, `History`, `PopoverContent`, `transferMatch.ts`, `Settings.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `appPath()` connect `tabs.tsx` to `Home.tsx`, `Dashboard`, `Separator`, `Security.tsx`, `Settings.tsx`, `useIsAdmin`, `Transactions`, `Sidebar.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 52 inferred relationships involving `cn()` (e.g. with `BudgetAmountSlider()` and `SubcategoryEditor()`) actually correct?**
  _`cn()` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `Budgets()` (e.g. with `useProfile()` and `useBudgetCategoryOrder()`) actually correct?**
  _`Budgets()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `Dashboard()` (e.g. with `fmtAmount()` and `useProfile()`) actually correct?**
  _`Dashboard()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _439 weakly-connected nodes found - possible documentation gaps or missing edges._
# Graph Report - alx_FinTrack  (2026-07-21)

## Corpus Check
- 243 files · ~156,171 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 949 nodes · 1293 edges · 81 communities (68 shown, 13 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 248 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `79485670`
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
- [[_COMMUNITY_toast.tsx|toast.tsx]]
- [[_COMMUNITY_plan.ts|plan.ts]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_toast.tsx|toast.tsx]]
- [[_COMMUNITY_Informe de auditoría RLS — Fase 0 (Arquitectura de administración)|Informe de auditoría RLS — Fase 0 (Arquitectura de administración)]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_badge.tsx|badge.tsx]]
- [[_COMMUNITY_ClassificationRules.tsx|ClassificationRules.tsx]]
- [[_COMMUNITY_ImportErrorBoundary|ImportErrorBoundary]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_lucideCatalog.ts|lucideCatalog.ts]]
- [[_COMMUNITY_useCategoryTranslations.ts|useCategoryTranslations.ts]]
- [[_COMMUNITY_entityAvatar.ts|entityAvatar.ts]]
- [[_COMMUNITY_Product|Product]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 48 edges
2. `Budgets()` - 26 edges
3. `Dashboard()` - 19 edges
4. `compilerOptions` - 19 edges
5. `ImportInner()` - 17 edges
6. `Transactions()` - 17 edges
7. `AVISO LEGAL (ES)` - 16 edges
8. `LEGAL NOTICE (EN)` - 16 edges
9. `Home()` - 15 edges
10. `categoryIcon()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `SubcategoryEditor()` --calls--> `useUpsertBudgetRule()`  [INFERRED]
  src/components/budgets/EnvelopeDetailDialog.tsx → src/hooks/useBudgets.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileSwitcher.tsx → src/lib/utils.ts
- `TransactionRow()` --calls--> `resolveEntityAvatar()`  [INFERRED]
  src/components/transactions/TransactionRow.tsx → src/lib/entityAvatar.ts
- `useBudgetsGate()` --calls--> `hasFeature()`  [INFERRED]
  src/hooks/useBudgetsGate.ts → src/lib/plan.ts

## Import Cycles
- None detected.

## Communities (81 total, 13 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (33): 10. Cookies, 10. Cookies, 11. Availability and modification of the service, 11. Disponibilidad y modificación del servicio, 12. Amendments to this Legal Notice, 12. Modificaciones del presente Aviso Legal, 13. Nulidad e ineficacia parcial, 13. Severability (+25 more)

### Community 1 - "dependencies"
Cohesion: 0.06
Nodes (35): dependencies, class-variance-authority, clsx, country-region-data, date-fns, @hookform/resolvers, i18next, i18next-browser-languagedetector (+27 more)

### Community 2 - "database.types.ts"
Cohesion: 0.08
Nodes (24): AdminCategoryBreakdownRow, AdminDemographicRow, AdminMonthlyRow, AdminPlanEvolutionRow, AdminSignupRow, AdminStatsOverview, AdminUserRow, BankEntity (+16 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): RequestData, requestSchema, ResetData, resetSchema

### Community 4 - "Home.tsx"
Cohesion: 0.06
Nodes (38): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+30 more)

### Community 5 - "Dashboard"
Cohesion: 0.13
Nodes (12): splitAmount(), TransactionRow(), TransactionRowProps, TYPE_BADGE, groupNet(), TransactionsList(), TransactionsListProps, groupByRelativeDate() (+4 more)

### Community 6 - "useImport.ts"
Cohesion: 0.08
Nodes (30): DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), parseDate(), ParsedRow, reconcileProfileTransfers() (+22 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (27): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.09
Nodes (22): AccountCard(), AccountCardProps, freshColor(), OnboardingGate(), ProfileContext, ProfileContextValue, useProfile(), ImportBatchRow (+14 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.40
Nodes (4): useUpdateUserProfile(), useUserSettings(), Onboarding(), SettingsProfile()

### Community 11 - "History"
Cohesion: 0.06
Nodes (31): PlanEvolutionGranularity, useAdminPlanEvolution(), useAdminSetPlan(), useAdminStats(), useAdminUserActivity(), useAdminUsers(), BankEntityInput, useCreateBankEntity() (+23 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.06
Nodes (39): Badge(), BadgeProps, badgeVariants, DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+31 more)

### Community 15 - "Transactions"
Cohesion: 0.11
Nodes (22): App(), queryClient, invalidatePlanUsage(), applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow, escapePgRegex() (+14 more)

### Community 16 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+5 more)

### Community 17 - "transferMatch.ts"
Cohesion: 0.23
Nodes (5): TYPES, USAGE_DIMENSIONS, ChangePasswordData, changePasswordSchema, SettingsHeader()

### Community 18 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom (+12 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.11
Nodes (20): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, COMPLETED_DATE_PAT, CONCEPT_PAT, CREDIT_PAT, CURRENCY_PAT (+12 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.15
Nodes (18): CategoryInput, deleteTranslations(), GroupInput, invalidateAll(), Labels, upsertTranslations(), useDeleteCategory(), useDeleteCategoryGroup() (+10 more)

### Community 21 - "FinTrack"
Cohesion: 0.12
Nodes (15): Changelog, v1.437, v1.439, v1.442, v1.446, v1.448, v1.453, v1.456 (+7 more)

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
Cohesion: 0.13
Nodes (22): deleteCommunityVote(), ruleCommunityKey(), RuleLike, syncCommunityVoteOnEdit(), upsertCommunityVote(), useCommunityRuleMap(), SubcategoryBudget, applyKeywordRules() (+14 more)

### Community 28 - "settings.json"
Cohesion: 0.50
Nodes (3): hooks, UserPromptSubmit, $schema

### Community 29 - "Settings.tsx"
Cohesion: 0.06
Nodes (41): IconPicker(), BudgetAmountSlider(), BudgetAmountSliderProps, niceScale(), stepFor(), BudgetSummaryCard(), BudgetSummaryCardProps, EnvelopeDetailDialog() (+33 more)

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.40
Nodes (3): LoginData, loginSchema, Props

### Community 32 - "tabs.tsx"
Cohesion: 0.17
Nodes (6): BRAND, BrandMark(), HeroDashboardMock(), useCountUp(), PricingCardsProps, Props

### Community 38 - "date-picker-field.tsx"
Cohesion: 0.40
Nodes (4): Database, supabase, supabaseAnonKey, supabaseUrl

### Community 61 - "Landing.tsx"
Cohesion: 0.15
Nodes (12): ComboSelect(), emptyPersonalForm, PersonalDataFields(), PersonalFormValue, Props, CountryOption, CountryTuple, getCountries() (+4 more)

### Community 63 - "toast.tsx"
Cohesion: 0.29
Nodes (6): ACCOUNT_SECTIONS, ACCOUNT_TYPE_META, AccountFilter, AccountSection, FILTER_TYPES, AccountType

### Community 64 - "plan.ts"
Cohesion: 0.15
Nodes (13): LimitReachedDialog(), PlanLimits, PlanType, PlanUsage, daysUntilReset(), DIMENSION_KEYS, FeatureFlag, hasFeature() (+5 more)

### Community 65 - "Settings.tsx"
Cohesion: 0.50
Nodes (4): AvisoLegal(), Block, renderInline(), Section

### Community 67 - "Settings.tsx"
Cohesion: 0.32
Nodes (4): LimitReachedDialogProps, UpgradeHintDialogProps, UpgradePlanDialog(), UpgradePlanDialogProps

### Community 68 - "toast.tsx"
Cohesion: 0.08
Nodes (21): useBankFormats(), useUpsertBankFormat(), useCategories(), useCategoryGroups(), useCreateKeywordRule(), useDeleteKeywordRule(), useKeywordRules(), useUpdateKeywordRule() (+13 more)

### Community 69 - "Informe de auditoría RLS — Fase 0 (Arquitectura de administración)"
Cohesion: 0.25
Nodes (7): Agujeros cerrados, Auditoría tabla por tabla, Clasificación de tablas, Criterio de aceptación (prueba de fuego), Informe de auditoría RLS — Fase 0 (Arquitectura de administración), Modelo de roles, Pasos manuales pendientes (owner)

### Community 71 - "transferMatch.ts"
Cohesion: 0.10
Nodes (31): DatePickerField(), DatePickerFieldProps, useBudgetCategoryOrder(), useBudgetRules(), useReorderBudgetCategories(), useUpsertBudgetRule(), addMonths(), BUDGET_STATUS_COLOR (+23 more)

### Community 74 - "tabs.tsx"
Cohesion: 0.33
Nodes (7): useBudgetsGate(), useLimitGate(), usePlan(), usePlanLimits(), usePlanUsage(), checkLimit(), SettingsPlan()

### Community 75 - "Settings.tsx"
Cohesion: 0.29
Nodes (3): useUpdateLanguage(), DeleteAccountRow(), LanguageRow()

### Community 77 - "ClassificationRules.tsx"
Cohesion: 0.31
Nodes (7): LanguageSelector(), bottomItemClass(), bottomItems, BottomNavLink(), BudgetsBottomNavItem(), MobileBottomNav(), MobileTopBar()

### Community 78 - "ImportErrorBoundary"
Cohesion: 0.28
Nodes (5): AppShell(), ProfileAvatar(), ProfileSwitcher(), useCreateProfile(), useProfiles()

### Community 79 - "PopoverContent"
Cohesion: 0.21
Nodes (9): BudgetsNavItem(), itemClass(), navItemsBottom, navItemsTop, Sidebar(), UpgradePlanNavItem(), UserPlanNavItem(), useUnreviewedBankCount() (+1 more)

### Community 82 - "useCategoryTranslations.ts"
Cohesion: 0.67
Nodes (3): KEY, useCategoryTranslations(), useMergeCategoryTranslations()

### Community 83 - "entityAvatar.ts"
Cohesion: 0.50
Nodes (3): Account, EntityAvatar, resolveEntityAvatar()

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

## Knowledge Gaps
- **363 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Home.tsx`, `Dashboard`, `transferMatch.ts`, `tabs.tsx`, `History`, `Settings.tsx`, `ClassificationRules.tsx`, `ImportErrorBoundary`, `PopoverContent`, `Landing.tsx`, `PasswordStrengthBar`, `Settings.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `ImportInner()` connect `toast.tsx` to `Home.tsx`, `Dashboard`, `useImport.ts`, `useTransactions.ts`, `Auth.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `useProfile()` connect `useTransactions.ts` to `Home.tsx`, `toast.tsx`, `transferMatch.ts`, `ImportErrorBoundary`, `Transactions`, `Settings.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `cn()` (e.g. with `BudgetAmountSlider()` and `SubcategoryEditor()`) actually correct?**
  _`cn()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `Budgets()` (e.g. with `useProfile()` and `useBudgetCategoryOrder()`) actually correct?**
  _`Budgets()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `Dashboard()` (e.g. with `fmtAmount()` and `useProfile()`) actually correct?**
  _`Dashboard()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
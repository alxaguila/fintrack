# Graph Report - alx_FinTrack  (2026-07-23)

## Corpus Check
- 276 files · ~342,468 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1076 nodes · 1501 edges · 96 communities (80 shown, 16 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 288 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05b0adb8`
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
- [[_COMMUNITY_ClassificationRules.tsx|ClassificationRules.tsx]]
- [[_COMMUNITY_ImportErrorBoundary|ImportErrorBoundary]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_lucideCatalog.ts|lucideCatalog.ts]]
- [[_COMMUNITY_TooltipContent|TooltipContent]]
- [[_COMMUNITY_entityAvatar.ts|entityAvatar.ts]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_usePlan.ts|usePlan.ts]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_Sidebar.tsx|Sidebar.tsx]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_useUnreviewedBankCount|useUnreviewedBankCount]]
- [[_COMMUNITY_useCategoryTranslations.ts|useCategoryTranslations.ts]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_Separator|Separator]]
- [[_COMMUNITY_Product|Product]]

## God Nodes (most connected - your core abstractions)
1. `Changelog` - 58 edges
2. `cn()` - 53 edges
3. `Budgets()` - 26 edges
4. `Dashboard()` - 21 edges
5. `ImportInner()` - 19 edges
6. `compilerOptions` - 19 edges
7. `Transactions()` - 18 edges
8. `DictionaryPanel()` - 18 edges
9. `AVISO LEGAL (ES)` - 16 edges
10. `LEGAL NOTICE (EN)` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `SubcategoryEditor()` --calls--> `useUpsertBudgetRule()`  [INFERRED]
  src/components/budgets/EnvelopeDetailDialog.tsx → src/hooks/useBudgets.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileSwitcher.tsx → src/lib/utils.ts
- `TransactionRow()` --calls--> `resolveEntityAvatar()`  [INFERRED]
  src/components/transactions/TransactionRow.tsx → src/lib/entityAvatar.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (96 total, 16 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (33): 10. Cookies, 10. Cookies, 11. Availability and modification of the service, 11. Disponibilidad y modificación del servicio, 12. Amendments to this Legal Notice, 12. Modificaciones del presente Aviso Legal, 13. Nulidad e ineficacia parcial, 13. Severability (+25 more)

### Community 1 - "dependencies"
Cohesion: 0.06
Nodes (35): dependencies, class-variance-authority, clsx, country-region-data, date-fns, @hookform/resolvers, i18next, i18next-browser-languagedetector (+27 more)

### Community 2 - "database.types.ts"
Cohesion: 0.07
Nodes (26): AdminCategoryBreakdownRow, AdminDemographicRow, AdminMonthlyRow, AdminPlanEvolutionRow, AdminSignupRow, AdminStatsOverview, AdminUserRow, BankEntity (+18 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): RequestData, requestSchema, ResetData, resetSchema

### Community 4 - "Home.tsx"
Cohesion: 0.06
Nodes (38): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+30 more)

### Community 5 - "Dashboard"
Cohesion: 0.05
Nodes (48): useAdminFeedback(), useMarkFeedbackRead(), useUnreadFeedbackCount(), addMerchantPatterns(), defaultPatterns(), linkMerchantTransactions(), MerchantInput, useCreateMerchant() (+40 more)

### Community 6 - "useImport.ts"
Cohesion: 0.08
Nodes (30): DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), parseDate(), ParsedRow, reconcileProfileTransfers() (+22 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (30): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.06
Nodes (34): AccountCard(), AccountCardProps, freshColor(), OnboardingGate(), splitAmount(), TransactionRow(), TransactionRowProps, TYPE_BADGE (+26 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.26
Nodes (9): Toast(), ToastAction(), ToastActionElement, ToastClose(), ToastDescription(), ToastProps, ToastTitle(), toastVariants (+1 more)

### Community 11 - "History"
Cohesion: 0.11
Nodes (17): PlanEvolutionGranularity, useAdminPlanEvolution(), useAdminSetPlan(), useAdminStats(), useAdminUserActivity(), useAdminUsers(), Estadisticas(), EVOLUTION_GRANULARITIES (+9 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.20
Nodes (13): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), SelectContent(), SelectItem() (+5 more)

### Community 15 - "Transactions"
Cohesion: 0.06
Nodes (43): App(), queryClient, BudgetSummaryCard(), BudgetSummaryCardProps, fmtAmount(), useIsMobile(), invalidatePlanUsage(), applyConceptSearch() (+35 more)

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
Cohesion: 0.09
Nodes (29): IconPicker(), SubcategoryEditor(), CategoryCombobox(), CategoryComboboxProps, normalize(), CategoryInput, deleteTranslations(), GroupInput (+21 more)

### Community 21 - "FinTrack"
Cohesion: 0.03
Nodes (58): Changelog, v1.422, v1.429, v1.437, v1.439, v1.442, v1.446, v1.448 (+50 more)

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
Cohesion: 0.17
Nodes (13): BudgetAmountSlider(), BudgetAmountSliderProps, niceScale(), stepFor(), EnvelopeDetailDialog(), EnvelopeDetailDialogProps, fmtCompact(), MonthAmountStrip() (+5 more)

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.40
Nodes (3): LoginData, loginSchema, Props

### Community 32 - "tabs.tsx"
Cohesion: 0.14
Nodes (13): BRAND, BrandMark(), HeroDashboardMock(), useCountUp(), Block, LegalDocument(), Props, renderInline() (+5 more)

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
Cohesion: 0.10
Nodes (30): DatePickerField(), DatePickerFieldProps, useBudgetCategoryOrder(), useBudgetRules(), useUpsertBudgetRule(), addMonths(), BUDGET_STATUS_COLOR, BuildContext (+22 more)

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
Nodes (4): LanguageSelector(), useUpdateLanguage(), DeleteAccountRow(), LanguageRow()

### Community 76 - "categoryRules.ts"
Cohesion: 0.47
Nodes (8): matchBuiltinCategory(), matchMerchant(), merchantKey(), normalize(), normalizePattern(), tokenString(), wildcardToRegex(), classifyConcept()

### Community 77 - "ClassificationRules.tsx"
Cohesion: 0.38
Nodes (5): BankEntityInput, useCreateBankEntity(), useDeleteBankEntity(), useUpdateBankEntity(), Bancos()

### Community 78 - "ImportErrorBoundary"
Cohesion: 0.22
Nodes (6): AdminRoute(), useIsAdmin(), useUpdateUserProfile(), useUserSettings(), Onboarding(), SettingsProfile()

### Community 79 - "PopoverContent"
Cohesion: 0.08
Nodes (21): useBankFormats(), useUpsertBankFormat(), useCategories(), useCategoryGroups(), useCreateKeywordRule(), useDeleteKeywordRule(), useKeywordRules(), useUpdateKeywordRule() (+13 more)

### Community 83 - "entityAvatar.ts"
Cohesion: 0.50
Nodes (3): Account, EntityAvatar, resolveEntityAvatar()

### Community 86 - "tabs.tsx"
Cohesion: 0.36
Nodes (8): bottomItemClass(), bottomItems, BottomNavLink(), BudgetsBottomNavItem(), DrawerBudgetsItem(), drawerItemClass(), MobileBottomNav(), MobileTopBar()

### Community 87 - "usePlan.ts"
Cohesion: 0.33
Nodes (7): useBudgetsGate(), useLimitGate(), usePlan(), usePlanLimits(), usePlanUsage(), checkLimit(), SettingsPlan()

### Community 88 - "transferMatch.ts"
Cohesion: 0.28
Nodes (5): AppShell(), ProfileAvatar(), ProfileSwitcher(), useCreateProfile(), useProfiles()

### Community 89 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (7): BudgetsNavItem(), itemClass(), navItemsBottom, navItemsTop, Sidebar(), UpgradePlanNavItem(), UserPlanNavItem()

### Community 90 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent(), TabsList(), TabsTrigger()

### Community 92 - "useCategoryTranslations.ts"
Cohesion: 0.67
Nodes (3): KEY, useCategoryTranslations(), useMergeCategoryTranslations()

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

## Knowledge Gaps
- **424 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+419 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Home.tsx`, `Dashboard`, `useTransactions.ts`, `AccountForm.tsx`, `History`, `transferMatch.ts`, `dropdown-menu.tsx`, `PasswordStrengthBar`, `Settings.tsx`, `Landing.tsx`, `toast.tsx`, `transferMatch.ts`, `Settings.tsx`, `TooltipContent`, `tabs.tsx`, `usePlan.ts`, `transferMatch.ts`, `Sidebar.tsx`, `tabs.tsx`, `PopoverContent`, `Separator`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `DictionaryPanel()` connect `Dashboard` to `dropdown-menu.tsx`, `categoryRules.ts`, `cn`, `PopoverContent`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `ImportInner()` connect `PopoverContent` to `useTransactions.ts`, `Home.tsx`, `Dashboard`, `useImport.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 52 inferred relationships involving `cn()` (e.g. with `BudgetAmountSlider()` and `SubcategoryEditor()`) actually correct?**
  _`cn()` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `Budgets()` (e.g. with `useProfile()` and `useBudgetCategoryOrder()`) actually correct?**
  _`Budgets()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Dashboard()` (e.g. with `fmtAmount()` and `useProfile()`) actually correct?**
  _`Dashboard()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _424 weakly-connected nodes found - possible documentation gaps or missing edges._
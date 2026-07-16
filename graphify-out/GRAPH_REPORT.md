# Graph Report - alx_FinTrack  (2026-07-16)

## Corpus Check
- 209 files · ~137,670 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 841 nodes · 1096 edges · 83 communities (66 shown, 17 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 200 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2131366`
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
- [[_COMMUNITY_automap.ts|automap.ts]]
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
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_toast.tsx|toast.tsx]]
- [[_COMMUNITY_Informe de auditoría RLS — Fase 0 (Arquitectura de administración)|Informe de auditoría RLS — Fase 0 (Arquitectura de administración)]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_dropdown-menu.tsx|dropdown-menu.tsx]]
- [[_COMMUNITY_badge.tsx|badge.tsx]]
- [[_COMMUNITY_tabs.tsx|tabs.tsx]]
- [[_COMMUNITY_date-picker-field.tsx|date-picker-field.tsx]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_Separator|Separator]]
- [[_COMMUNITY_Skeleton|Skeleton]]
- [[_COMMUNITY_TooltipContent|TooltipContent]]
- [[_COMMUNITY_lucideCatalog.ts|lucideCatalog.ts]]
- [[_COMMUNITY_useUnreviewedBankCount|useUnreviewedBankCount]]
- [[_COMMUNITY_Product|Product]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `Dashboard()` - 19 edges
3. `Transactions()` - 19 edges
4. `compilerOptions` - 19 edges
5. `ImportInner()` - 16 edges
6. `🇪🇸 AVISO LEGAL` - 16 edges
7. `🇬🇧 LEGAL NOTICE` - 16 edges
8. `Home()` - 15 edges
9. `compilerOptions` - 12 edges
10. `ClassificationRules()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileSwitcher.tsx → src/lib/utils.ts
- `DatePickerField()` --calls--> `cn()`  [INFERRED]
  src/components/ui/date-picker-field.tsx → src/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `PopoverContent()` --calls--> `cn()`  [INFERRED]
  src/components/ui/popover.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (83 total, 17 thin omitted)

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
Cohesion: 0.11
Nodes (24): AccountBalanceInfo, BalanceHistoryPoint, calendarDaysSince(), round2(), SpendingHistoryPoint, useAccountBalanceHistory(), useAccountBalances(), useCardSpending30Days() (+16 more)

### Community 5 - "Dashboard"
Cohesion: 0.09
Nodes (21): AccountCard(), AccountCardProps, OnboardingGate(), ProfileContext, ProfileContextValue, useProfile(), ImportBatchRow, invalidateAfterBatchChange() (+13 more)

### Community 6 - "useImport.ts"
Cohesion: 0.07
Nodes (27): useBankFormats(), useUpsertBankFormat(), DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), ParsedRow (+19 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (27): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.08
Nodes (36): fmtAmount(), applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow, escapePgRegex(), invalidateTransactionData(), num() (+28 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.08
Nodes (21): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+13 more)

### Community 11 - "History"
Cohesion: 0.06
Nodes (26): PlanEvolutionGranularity, useAdminPlanEvolution(), useAdminSetPlan(), useAdminStats(), useAdminUserActivity(), useAdminUsers(), useAdminFeedback(), useMarkFeedbackRead() (+18 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.16
Nodes (16): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), SelectContent(), SelectItem() (+8 more)

### Community 15 - "automap.ts"
Cohesion: 0.06
Nodes (40): IconPicker(), CategoryCombobox(), CategoryComboboxProps, normalize(), CategoryInput, deleteTranslations(), GroupInput, invalidateAll() (+32 more)

### Community 16 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+5 more)

### Community 17 - "transferMatch.ts"
Cohesion: 0.15
Nodes (9): TYPES, Cell(), numOrUnlimited(), PLAN_ORDER, PlanCompareRows(), USAGE_DIMENSIONS, ChangePasswordData, changePasswordSchema (+1 more)

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom (+3 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.16
Nodes (13): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, CONCEPT_PAT, CREDIT_PAT, DATE_PAT, DEBIT_PAT (+5 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.09
Nodes (22): App(), queryClient, AppShell(), ProfileAvatar(), ProfileSwitcher(), KEY, useCategoryTranslations(), useMergeCategoryTranslations() (+14 more)

### Community 21 - "FinTrack"
Cohesion: 0.25
Nodes (7): Arquitectura clave, Comandos / setup, FinTrack, Gotchas ya resueltos (no reintroducir), Reglas de trabajo obligatorias (aunque no se pidan explícitamente), Sistema de diseño (obligatorio converger en pantallas nuevas), Stack

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
Cohesion: 0.14
Nodes (21): deleteCommunityVote(), ruleCommunityKey(), RuleLike, syncCommunityVoteOnEdit(), upsertCommunityVote(), useCommunityRuleMap(), applyKeywordRules(), matches() (+13 more)

### Community 28 - "settings.json"
Cohesion: 0.50
Nodes (3): hooks, UserPromptSubmit, $schema

### Community 29 - "Settings.tsx"
Cohesion: 0.29
Nodes (6): ACCOUNT_SECTIONS, ACCOUNT_TYPE_META, AccountFilter, AccountSection, FILTER_TYPES, AccountType

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.40
Nodes (3): LoginData, loginSchema, Props

### Community 32 - "tabs.tsx"
Cohesion: 0.29
Nodes (4): BRAND, BrandMark(), HeroDashboardMock(), useCountUp()

### Community 38 - "date-picker-field.tsx"
Cohesion: 0.40
Nodes (4): Database, supabase, supabaseAnonKey, supabaseUrl

### Community 61 - "Landing.tsx"
Cohesion: 0.15
Nodes (12): ComboSelect(), emptyPersonalForm, PersonalDataFields(), PersonalFormValue, Props, CountryOption, CountryTuple, getCountries() (+4 more)

### Community 63 - "toast.tsx"
Cohesion: 0.24
Nodes (6): AdminRoute(), itemClass(), navItems, Sidebar(), UserPlanNavItem(), useIsAdmin()

### Community 64 - "plan.ts"
Cohesion: 0.18
Nodes (9): PlanLimits, PlanType, PlanUsage, DIMENSION_KEYS, FeatureFlag, LimitCheck, LimitDimension, PLAN_COLORS (+1 more)

### Community 65 - "package.json"
Cohesion: 0.43
Nodes (4): LanguageSelector(), bottomItems, MobileBottomNav(), MobileTopBar()

### Community 68 - "toast.tsx"
Cohesion: 0.26
Nodes (9): Toast(), ToastAction(), ToastActionElement, ToastClose(), ToastDescription(), ToastProps, ToastTitle(), toastVariants (+1 more)

### Community 69 - "Informe de auditoría RLS — Fase 0 (Arquitectura de administración)"
Cohesion: 0.25
Nodes (7): Agujeros cerrados, Auditoría tabla por tabla, Clasificación de tablas, Criterio de aceptación (prueba de fuego), Informe de auditoría RLS — Fase 0 (Arquitectura de administración), Modelo de roles, Pasos manuales pendientes (owner)

### Community 70 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 71 - "transferMatch.ts"
Cohesion: 0.38
Nodes (9): daysBetween(), findTransferPairs(), haveSharedToken(), isTransferConcept(), normalizeConcept(), STOPWORDS, TRANSFER_ROOTS, transferTokens() (+1 more)

### Community 72 - "dropdown-menu.tsx"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubTrigger

### Community 73 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 74 - "tabs.tsx"
Cohesion: 0.29
Nodes (3): useUpdateLanguage(), DeleteAccountRow(), LanguageRow()

### Community 78 - "Skeleton"
Cohesion: 0.40
Nodes (4): LimitReachedDialog(), LimitReachedDialogProps, daysUntilReset(), MONTHLY_DIMENSIONS

### Community 81 - "useUnreviewedBankCount"
Cohesion: 0.40
Nodes (3): useUnreviewedBankCount(), useUnreadFeedbackCount(), Admin()

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

## Knowledge Gaps
- **334 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+329 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `package.json`, `toast.tsx`, `dropdown-menu.tsx`, `badge.tsx`, `AccountForm.tsx`, `date-picker-field.tsx`, `PopoverContent`, `Separator`, `History`, `automap.ts`, `TooltipContent`, `tabs.tsx`, `transferMatch.ts`, `dropdown-menu.tsx`, `PasswordStrengthBar`, `Landing.tsx`, `toast.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `ImportInner()` connect `useImport.ts` to `Dashboard`, `AccountForm.tsx`, `History`, `automap.ts`, `Auth.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useProfile()` connect `Dashboard` to `Home.tsx`, `useImport.ts`, `useTransactions.ts`, `AccountForm.tsx`, `automap.ts`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 42 inferred relationships involving `cn()` (e.g. with `LanguageSelector()` and `MobileBottomNav()`) actually correct?**
  _`cn()` has 42 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `Dashboard()` (e.g. with `fmtAmount()` and `useProfile()`) actually correct?**
  _`Dashboard()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `Transactions()` (e.g. with `useProfile()` and `useAccounts()`) actually correct?**
  _`Transactions()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _334 weakly-connected nodes found - possible documentation gaps or missing edges._
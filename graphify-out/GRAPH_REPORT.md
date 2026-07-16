# Graph Report - alx_FinTrack  (2026-07-16)

## Corpus Check
- 196 files · ~129,903 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 789 nodes · 1013 edges · 69 communities (58 shown, 11 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 183 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9d9fd68`
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
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Informe de auditoría RLS — Fase 0 (Arquitectura de administración)|Informe de auditoría RLS — Fase 0 (Arquitectura de administración)]]
- [[_COMMUNITY_ImportInner|ImportInner]]
- [[_COMMUNITY_Product|Product]]
- [[_COMMUNITY_Security.tsx|Security.tsx]]
- [[_COMMUNITY_dropdown-menu.tsx|dropdown-menu.tsx]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 40 edges
2. `compilerOptions` - 19 edges
3. `Dashboard()` - 18 edges
4. `Transactions()` - 18 edges
5. `ImportInner()` - 16 edges
6. `🇪🇸 AVISO LEGAL` - 16 edges
7. `🇬🇧 LEGAL NOTICE` - 16 edges
8. `Home()` - 15 edges
9. `compilerOptions` - 12 edges
10. `useProfile()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileSwitcher.tsx → src/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `ImportInner()` --calls--> `useCommunityRuleMap()`  [INFERRED]
  src/pages/Import.tsx → src/hooks/useCommunityRules.ts
- `ImportInner()` --calls--> `useParseFile()`  [INFERRED]
  src/pages/Import.tsx → src/hooks/useImport.ts

## Import Cycles
- None detected.

## Communities (69 total, 11 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (33): 10. Cookies, 10. Cookies, 11. Availability and modification of the service, 11. Disponibilidad y modificación del servicio, 12. Amendments to this Legal Notice, 12. Modificaciones del presente Aviso Legal, 13. Nulidad e ineficacia parcial, 13. Severability (+25 more)

### Community 1 - "dependencies"
Cohesion: 0.06
Nodes (35): dependencies, class-variance-authority, clsx, country-region-data, date-fns, @hookform/resolvers, i18next, i18next-browser-languagedetector (+27 more)

### Community 2 - "database.types.ts"
Cohesion: 0.09
Nodes (22): AdminCategoryBreakdownRow, AdminDemographicRow, AdminMonthlyRow, AdminSignupRow, AdminStatsOverview, AdminUserRow, BankEntity, BankFormat (+14 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): RequestData, requestSchema, ResetData, resetSchema

### Community 4 - "Home.tsx"
Cohesion: 0.11
Nodes (24): AccountBalanceInfo, BalanceHistoryPoint, calendarDaysSince(), round2(), SpendingHistoryPoint, useAccountBalanceHistory(), useAccountBalances(), useCardSpending30Days() (+16 more)

### Community 5 - "Dashboard"
Cohesion: 0.08
Nodes (25): AccountCard(), AccountCardProps, useAdminStats(), useAdminUserActivity(), useAdminUsers(), ImportBatchRow, invalidateAfterBatchChange(), useDeleteBatch() (+17 more)

### Community 6 - "useImport.ts"
Cohesion: 0.11
Nodes (19): DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), ParsedRow, reconcileProfileTransfers(), resolveComputedBalances() (+11 more)

### Community 7 - "validation.ts"
Cohesion: 0.06
Nodes (27): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.07
Nodes (38): App(), queryClient, fmtAmount(), applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow, escapePgRegex() (+30 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.11
Nodes (16): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+8 more)

### Community 11 - "History"
Cohesion: 0.11
Nodes (15): BankEntityInput, useCreateBankEntity(), useDeleteBankEntity(), useUpdateBankEntity(), useAdminFeedback(), useMarkFeedbackRead(), AdminHeader(), Bancos() (+7 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.07
Nodes (33): Badge(), BadgeProps, badgeVariants, DatePickerField(), DatePickerFieldProps, DialogContent(), DialogDescription(), DialogFooter() (+25 more)

### Community 15 - "automap.ts"
Cohesion: 0.10
Nodes (26): CategoryCombobox(), CategoryComboboxProps, normalize(), CategoryInput, deleteTranslations(), GroupInput, invalidateAll(), Labels (+18 more)

### Community 16 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+5 more)

### Community 17 - "transferMatch.ts"
Cohesion: 0.38
Nodes (9): daysBetween(), findTransferPairs(), haveSharedToken(), isTransferConcept(), normalizeConcept(), STOPWORDS, TRANSFER_ROOTS, transferTokens() (+1 more)

### Community 18 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom (+12 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.16
Nodes (13): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, CONCEPT_PAT, CREDIT_PAT, DATE_PAT, DEBIT_PAT (+5 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.05
Nodes (28): AdminRoute(), AppShell(), LanguageSelector(), bottomItems, MobileBottomNav(), MobileTopBar(), ProfileAvatar(), ProfileSwitcher() (+20 more)

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

### Community 69 - "Informe de auditoría RLS — Fase 0 (Arquitectura de administración)"
Cohesion: 0.25
Nodes (7): Agujeros cerrados, Auditoría tabla por tabla, Clasificación de tablas, Criterio de aceptación (prueba de fuego), Informe de auditoría RLS — Fase 0 (Arquitectura de administración), Modelo de roles, Pasos manuales pendientes (owner)

### Community 109 - "ImportInner"
Cohesion: 0.07
Nodes (24): OnboardingGate(), ProfileContext, ProfileContextValue, useProfile(), useBankFormats(), useUpsertBankFormat(), useCategories(), useCategoryGroups() (+16 more)

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

### Community 160 - "Security.tsx"
Cohesion: 0.27
Nodes (4): TYPES, ChangePasswordData, changePasswordSchema, SettingsHeader()

### Community 164 - "dropdown-menu.tsx"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubTrigger

## Knowledge Gaps
- **319 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+314 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `dropdown-menu.tsx`, `Dashboard`, `AccountForm.tsx`, `automap.ts`, `dropdown-menu.tsx`, `PasswordStrengthBar`, `Landing.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `useProfile()` connect `ImportInner` to `Home.tsx`, `Dashboard`, `useTransactions.ts`, `AccountForm.tsx`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Home()` connect `Home.tsx` to `AccountForm.tsx`, `dropdown-menu.tsx`, `ImportInner`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 39 inferred relationships involving `cn()` (e.g. with `LanguageSelector()` and `MobileBottomNav()`) actually correct?**
  _`cn()` has 39 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `Dashboard()` (e.g. with `fmtAmount()` and `useProfile()`) actually correct?**
  _`Dashboard()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Transactions()` (e.g. with `useProfile()` and `useAccounts()`) actually correct?**
  _`Transactions()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _319 weakly-connected nodes found - possible documentation gaps or missing edges._
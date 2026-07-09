# Graph Report - alx_FinTrack  (2026-07-09)

## Corpus Check
- 171 files · ~71,443 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 686 nodes · 892 edges · 64 communities (51 shown, 13 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ea6fe3f`
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
- [[_COMMUNITY_geo.ts|geo.ts]]
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
- [[_COMMUNITY_Skeleton|Skeleton]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_Informe de auditoría RLS — Fase 0 (Arquitectura de administración)|Informe de auditoría RLS — Fase 0 (Arquitectura de administración)]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 40 edges
2. `compilerOptions` - 19 edges
3. `Transactions()` - 18 edges
4. `ImportInner()` - 16 edges
5. `Dashboard()` - 15 edges
6. `compilerOptions` - 12 edges
7. `ClassificationRules()` - 10 edges
8. `History()` - 10 edges
9. `Home()` - 10 edges
10. `useProfile()` - 9 edges

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

## Communities (64 total, 13 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (29): ProfileContext, ProfileContextValue, useProfile(), useBankFormats(), useUpsertBankFormat(), useCategories(), useCategoryGroups(), useCreateKeywordRule() (+21 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (44): dependencies, class-variance-authority, clsx, country-region-data, date-fns, @hookform/resolvers, i18next, i18next-browser-languagedetector (+36 more)

### Community 2 - "database.types.ts"
Cohesion: 0.05
Nodes (47): ACCOUNT_SECTIONS, ACCOUNT_TYPE_META, AccountFilter, AccountSection, FILTER_TYPES, applyKeywordRules(), matches(), ALWAYS_RULES (+39 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.06
Nodes (27): AdminRoute(), AppShell(), LanguageSelector(), bottomItems, MobileBottomNav(), MobileTopBar(), ProfileAvatar(), ProfileSwitcher() (+19 more)

### Community 4 - "Home.tsx"
Cohesion: 0.10
Nodes (23): AccountBalanceInfo, BalanceHistoryPoint, calendarDaysSince(), round2(), SpendingHistoryPoint, useAccountBalanceHistory(), useAccountBalances(), useCardSpending30Days() (+15 more)

### Community 5 - "Dashboard"
Cohesion: 0.26
Nodes (9): Toast(), ToastAction(), ToastActionElement, ToastClose(), ToastDescription(), ToastProps, ToastTitle(), toastVariants (+1 more)

### Community 6 - "useImport.ts"
Cohesion: 0.11
Nodes (20): DATE_PARSE_FORMATS, ensureOpeningBalance(), fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), ParsedRow, reconcileProfileTransfers() (+12 more)

### Community 7 - "validation.ts"
Cohesion: 0.07
Nodes (26): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, CATEGORY_TYPES, categoryFormSchema, categoryGroupFormSchema (+18 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.08
Nodes (24): queryClient, fmtAmount(), applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow, escapePgRegex(), invalidateTransactionData() (+16 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.09
Nodes (19): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, FormState, isBankType(), useAccounts() (+11 more)

### Community 11 - "History"
Cohesion: 0.07
Nodes (29): AccountCard(), AccountCardProps, useAdminStats(), useAdminUserActivity(), useAdminUsers(), deriveOpeningIfMissing(), fetchAccountMovementsChrono(), ImportBatchRow (+21 more)

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 13 - "geo.ts"
Cohesion: 0.15
Nodes (12): ComboSelect(), emptyPersonalForm, PersonalDataFields(), PersonalFormValue, Props, CountryOption, CountryTuple, getCountries() (+4 more)

### Community 14 - "cn"
Cohesion: 0.20
Nodes (13): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), SelectContent(), SelectItem() (+5 more)

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
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/papaparse, @types/react, @types/react-dom (+3 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.16
Nodes (13): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, CONCEPT_PAT, CREDIT_PAT, DATE_PAT, DEBIT_PAT (+5 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubTrigger

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

### Community 26 - "useCommunityRules.ts"
Cohesion: 0.43
Nodes (6): deleteCommunityVote(), ruleCommunityKey(), RuleLike, syncCommunityVoteOnEdit(), upsertCommunityVote(), useCommunityRuleMap()

### Community 27 - "Auth.tsx"
Cohesion: 0.29
Nodes (6): Auth(), LoginData, loginSchema, Mode, SignupData, signupSchema

### Community 28 - "settings.json"
Cohesion: 0.50
Nodes (3): hooks, UserPromptSubmit, $schema

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 32 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent(), TabsList(), TabsTrigger()

### Community 69 - "Informe de auditoría RLS — Fase 0 (Arquitectura de administración)"
Cohesion: 0.25
Nodes (7): Agujeros cerrados, Auditoría tabla por tabla, Clasificación de tablas, Criterio de aceptación (prueba de fuego), Informe de auditoría RLS — Fase 0 (Arquitectura de administración), Modelo de roles, Pasos manuales pendientes (owner)

## Knowledge Gaps
- **271 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+266 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `tabs.tsx`, `Transactions`, `Sidebar.tsx`, `Dashboard`, `date-picker-field.tsx`, `PopoverContent`, `Separator`, `AccountForm.tsx`, `geo.ts`, `automap.ts`, `dropdown-menu.tsx`, `PasswordStrengthBar`, `Auth.tsx`, `Skeleton`, `Settings.tsx`, `badge.tsx`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Why does `useProfile()` connect `Transactions` to `Sidebar.tsx`, `Home.tsx`, `useTransactions.ts`, `AccountForm.tsx`, `History`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `Transactions()` connect `Transactions` to `database.types.ts`, `Home.tsx`, `useTransactions.ts`, `AccountForm.tsx`, `History`, `automap.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 39 inferred relationships involving `cn()` (e.g. with `LanguageSelector()` and `MobileBottomNav()`) actually correct?**
  _`cn()` has 39 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Transactions()` (e.g. with `useProfile()` and `useAccounts()`) actually correct?**
  _`Transactions()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `ImportInner()` (e.g. with `useProfile()` and `useAccounts()`) actually correct?**
  _`ImportInner()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _271 weakly-connected nodes found - possible documentation gaps or missing edges._
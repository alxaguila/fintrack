# Graph Report - alx_FinTrack  (2026-08-14)

## Corpus Check
- 364 files · ~373,537 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1531 nodes · 2141 edges · 117 communities (97 shown, 20 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 420 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d36edb3`
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
- [[_COMMUNITY_Sidebar|Sidebar]]
- [[_COMMUNITY_Settings.tsx|Settings.tsx]]
- [[_COMMUNITY_categoryRules.ts|categoryRules.ts]]
- [[_COMMUNITY_useIsAdmin|useIsAdmin]]
- [[_COMMUNITY_useUserSettings|useUserSettings]]
- [[_COMMUNITY_PopoverContent|PopoverContent]]
- [[_COMMUNITY_lucideCatalog.ts|lucideCatalog.ts]]
- [[_COMMUNITY_TooltipContent|TooltipContent]]
- [[_COMMUNITY_entityAvatar.ts|entityAvatar.ts]]
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_usePlan.ts|usePlan.ts]]
- [[_COMMUNITY_transferMatch.ts|transferMatch.ts]]
- [[_COMMUNITY_useTransactions.ts|useTransactions.ts]]
- [[_COMMUNITY_EnvelopeDetailDialog.tsx|EnvelopeDetailDialog.tsx]]
- [[_COMMUNITY_invalidateTransactionData|invalidateTransactionData]]
- [[_COMMUNITY_BudgetAmountSlider.tsx|BudgetAmountSlider.tsx]]
- [[_COMMUNITY_Transactions|Transactions]]
- [[_COMMUNITY_periods.ts|periods.ts]]
- [[_COMMUNITY_useProfile|useProfile]]
- [[_COMMUNITY_ClassificationRules.tsx|ClassificationRules.tsx]]
- [[_COMMUNITY_ImportErrorBoundary|ImportErrorBoundary]]
- [[_COMMUNITY_DatePickerField|DatePickerField]]
- [[_COMMUNITY_NotificationDetailDialog|NotificationDetailDialog]]
- [[_COMMUNITY_MerchantDialog|MerchantDialog]]
- [[_COMMUNITY_useCategoryTranslations.ts|useCategoryTranslations.ts]]
- [[_COMMUNITY_CompoundInterest|CompoundInterest]]
- [[_COMMUNITY_select.tsx|select.tsx]]
- [[_COMMUNITY_useHomeOverview.ts|useHomeOverview.ts]]
- [[_COMMUNITY_subcategoryColor|subcategoryColor]]
- [[_COMMUNITY_useIsAdmin|useIsAdmin]]
- [[_COMMUNITY_Feedback.tsx|Feedback.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_DEMO_TRANSACTIONS|DEMO_TRANSACTIONS]]
- [[_COMMUNITY_Codigos|Codigos]]
- [[_COMMUNITY_ProfileContext.tsx|ProfileContext.tsx]]
- [[_COMMUNITY_AdminMenu|AdminMenu]]
- [[_COMMUNITY_Product|Product]]

## God Nodes (most connected - your core abstractions)
1. `Changelog` - 197 edges
2. `cn()` - 58 edges
3. `Budgets()` - 27 edges
4. `Dashboard()` - 25 edges
5. `Transactions()` - 24 edges
6. `appPath()` - 21 edges
7. `ImportInner()` - 19 edges
8. `Comercios()` - 19 edges
9. `compilerOptions` - 19 edges
10. `DictionaryPanel()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ComboSelect()` --calls--> `cn()`  [INFERRED]
  src/components/PersonalDataFields.tsx → src/lib/utils.ts
- `AppShell()` --calls--> `consumeSessionHandoff()`  [INFERRED]
  src/components/layout/AppShell.tsx → src/lib/sessionHandoff.ts
- `ProfileAvatar()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileDialog.tsx → src/lib/utils.ts
- `TypePill()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileDialog.tsx → src/lib/utils.ts
- `TypeSelector()` --calls--> `cn()`  [INFERRED]
  src/components/layout/ProfileDialog.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (117 total, 20 thin omitted)

### Community 0 - "Transactions"
Cohesion: 0.06
Nodes (33): 10. Cookies, 10. Cookies, 11. Availability and modification of the service, 11. Disponibilidad y modificación del servicio, 12. Amendments to this Legal Notice, 12. Modificaciones del presente Aviso Legal, 13. Nulidad e ineficacia parcial, 13. Severability (+25 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (46): dependencies, class-variance-authority, clsx, country-region-data, date-fns, exceljs, @hookform/resolvers, i18next (+38 more)

### Community 2 - "database.types.ts"
Cohesion: 0.06
Nodes (32): AdminBucketRow, AdminCategoryBreakdownRow, AdminDemographicRow, AdminMonthlyRow, AdminPlanEvolutionRow, AdminStatsOverview, AdminUserRow, BankEntity (+24 more)

### Community 3 - "Sidebar.tsx"
Cohesion: 0.33
Nodes (4): RequestData, requestSchema, ResetData, resetSchema

### Community 4 - "Home.tsx"
Cohesion: 0.05
Nodes (43): ACCOUNT_TYPES, AccountFormDialog(), AccountFormDialogProps, COLORS, emptyForm, EntityOption, FormState, isBankType() (+35 more)

### Community 5 - "Dashboard"
Cohesion: 0.25
Nodes (7): AVATAR_COLORS, PROFILE_TYPES, ProfileAvatar(), ProfileDialogProps, TYPE_PILL_CLASS, TypePill(), TypeSelector()

### Community 6 - "useImport.ts"
Cohesion: 0.08
Nodes (30): DATE_PARSE_FORMATS, fetchAllAccountMovements(), ManualBalance, normalizeTime(), parseAmount(), parseDate(), ParsedRow, reconcileProfileTransfers() (+22 more)

### Community 7 - "validation.ts"
Cohesion: 0.05
Nodes (35): ACCOUNT_TYPES, accountFormSchema, ADMIN_LIMITS, amountSchema, bankEntityFormSchema, bankSuggestionSchema, CATEGORY_TYPES, categoryFormSchema (+27 more)

### Community 8 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 9 - "useTransactions.ts"
Cohesion: 0.05
Nodes (41): breakdownMap, CAT_CLOTHING, CAT_COMMUNITY, CAT_ELECTRICITY, CAT_ELECTRONICS, CAT_FUEL, CAT_MOBILE_INTERNET, CAT_OTHER_INCOME (+33 more)

### Community 10 - "AccountForm.tsx"
Cohesion: 0.26
Nodes (9): Toast(), ToastAction(), ToastActionElement, ToastClose(), ToastDescription(), ToastProps, ToastTitle(), toastVariants (+1 more)

### Community 11 - "History"
Cohesion: 0.50
Nodes (3): TabsContent(), TabsList(), TabsTrigger()

### Community 12 - "xlsx.ts"
Cohesion: 0.20
Nodes (14): file, root, xlsx, parseCSV(), ParsedFile, detectHeaderRowIndex(), HEADER_KEYWORDS, buildRows() (+6 more)

### Community 14 - "cn"
Cohesion: 0.20
Nodes (13): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), SelectContent(), SelectItem() (+5 more)

### Community 15 - "Transactions"
Cohesion: 0.17
Nodes (17): applyConceptSearch(), applyTransactionFilters(), DashboardBreakdownRow, DashboardTotalRow, escapePgRegex(), fetchAllMatchingIds(), fetchAllTransactionsForExport(), invalidateTransactionData() (+9 more)

### Community 16 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+5 more)

### Community 17 - "transferMatch.ts"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubTrigger

### Community 18 - "devDependencies"
Cohesion: 0.05
Nodes (38): devDependencies, autoprefixer, postcss, supabase, tailwindcss, @types/node, @types/papaparse, @types/react (+30 more)

### Community 19 - "transferMatch.ts"
Cohesion: 0.11
Nodes (20): AMOUNT_PAT, autoDetectColumns(), AutoMapResult, BALANCE_PAT, COMPLETED_DATE_PAT, CONCEPT_PAT, CREDIT_PAT, CURRENCY_PAT (+12 more)

### Community 20 - "dropdown-menu.tsx"
Cohesion: 0.47
Nodes (8): matchBuiltinCategory(), matchMerchant(), merchantKey(), normalize(), normalizePattern(), tokenString(), wildcardToRegex(), classifyConcept()

### Community 21 - "FinTrack"
Cohesion: 0.01
Nodes (197): Changelog, v1.1003, v1.1005, v1.1007, v1.1010, v1.1012, v1.1014, v1.1016 (+189 more)

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
Cohesion: 0.07
Nodes (37): AccountCard(), AccountCardProps, freshColor(), splitAmount(), TransactionRow(), TransactionRowProps, TYPE_BADGE, groupNet() (+29 more)

### Community 30 - "button.tsx"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 31 - "badge.tsx"
Cohesion: 0.40
Nodes (3): LoginData, loginSchema, Props

### Community 32 - "tabs.tsx"
Cohesion: 0.09
Nodes (23): AgeBracket, Block, BlogDocument(), formatPublishedAt(), Props, renderDisclaimer(), renderInline(), Section (+15 more)

### Community 34 - "exportSafe.ts"
Cohesion: 0.50
Nodes (3): Notification, NotificationAccount, TranslateFn

### Community 36 - "vercel.json"
Cohesion: 0.50
Nodes (3): headers, rewrites, $schema

### Community 41 - "Separator"
Cohesion: 0.28
Nodes (6): COPY, escapeHtml(), HookPayload, Lang, layout(), renderEmail()

### Community 61 - "Landing.tsx"
Cohesion: 0.21
Nodes (6): TYPES, Toggle(), USAGE_DIMENSIONS, ChangePasswordData, changePasswordSchema, SettingsHeader()

### Community 62 - "EnvelopeDetailDialog.tsx"
Cohesion: 0.25
Nodes (3): HeroStatCardProps, KpiCardProps, MoneyAmountProps

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
Cohesion: 0.06
Nodes (45): BudgetAmountSlider(), BudgetAmountSliderProps, niceScale(), stepFor(), EnvelopeDetailDialog(), EnvelopeDetailDialogProps, fmtCompact(), MonthAmountStrip() (+37 more)

### Community 72 - "package.json"
Cohesion: 0.15
Nodes (13): EvolutionGranularity, useAdminDeleteUser(), useAdminSetPlan(), useAdminUserActivity(), useAdminUsers(), nextSort(), aggregateMonths(), PLAN_ORDER (+5 more)

### Community 73 - "zafyros"
Cohesion: 0.22
Nodes (7): Arquitectura clave, Comandos / setup, Gotchas ya resueltos (no reintroducir), Reglas de trabajo obligatorias (aunque no se pidan explícitamente), Sistema de diseño (obligatorio converger en pantallas nuevas), Stack, zafyros

### Community 74 - "Sidebar"
Cohesion: 0.33
Nodes (4): bucketKey(), bucketRange(), Granularity, nextPeriodKey()

### Community 75 - "Settings.tsx"
Cohesion: 0.22
Nodes (5): LanguageSelector(), useUpdateLanguage(), DeleteAccountRow(), LanguageRow(), Settings()

### Community 76 - "categoryRules.ts"
Cohesion: 0.19
Nodes (15): Attach, bandPath(), buildSide(), CashFlow(), CashFlowLink(), FlowNode, foldSmall(), GRANULARITIES (+7 more)

### Community 79 - "PopoverContent"
Cohesion: 0.06
Nodes (46): IconPicker(), CategoryCombobox(), CategoryComboboxProps, normalize(), CategoryInput, deleteTranslations(), GroupInput, invalidateAll() (+38 more)

### Community 81 - "TooltipContent"
Cohesion: 0.06
Nodes (34): addMerchantPatterns(), defaultPatterns(), linkMerchantTransactions(), MerchantInput, useCreateMerchant(), useDeleteMerchant(), useMerchantUsageCounts(), useUpdateMerchant() (+26 more)

### Community 83 - "entityAvatar.ts"
Cohesion: 0.21
Nodes (9): useAdminPlanEvolution(), useAdminStats(), BucketEvolutionSection(), Estadisticas(), EVOLUTION_GRANULARITIES, groupDemographics(), PLAN_ORDER, PlanEvolutionSection() (+1 more)

### Community 86 - "App.tsx"
Cohesion: 0.20
Nodes (11): getDemoCategorySeries(), getPersistedGranularity(), bucketLabel(), CashTooltip(), computeDonutIcons(), Dashboard(), makeBarShape(), pastel() (+3 more)

### Community 88 - "transferMatch.ts"
Cohesion: 0.18
Nodes (14): NotificationBell(), severityDotColor(), NotificationDetailDialog(), NotificationDetailDialogProps, NotificationTicker(), pendingAnnouncements(), unreadNotificationCount(), useGenerateStaleAccountNotifications() (+6 more)

### Community 89 - "useTransactions.ts"
Cohesion: 0.21
Nodes (10): empty, FormState, MerchantSortKey, normalize(), CommunitySortKey, DictSortKey, titleCase(), WordDialog() (+2 more)

### Community 92 - "EnvelopeDetailDialog.tsx"
Cohesion: 0.25
Nodes (10): deleteCommunityVote(), ruleCommunityKey(), RuleLike, syncCommunityVoteOnEdit(), upsertCommunityVote(), useAdminCommunityRules(), useCommunityRuleMap(), useCommunityUsageMap() (+2 more)

### Community 94 - "invalidateTransactionData"
Cohesion: 0.33
Nodes (4): App(), appChildren(), queryClient, invalidatePlanUsage()

### Community 95 - "BudgetAmountSlider.tsx"
Cohesion: 0.21
Nodes (8): DemoModeContext, useDemoMode(), useSessionState(), filterDemoTransactions(), applyRuleFilters(), normalizeText(), parseAmountInput(), Transactions()

### Community 97 - "Transactions"
Cohesion: 0.29
Nodes (8): useBudgetsGate(), useExportGate(), useLimitGate(), usePlan(), usePlanLimits(), usePlanUsage(), checkLimit(), SettingsPlan()

### Community 98 - "periods.ts"
Cohesion: 0.20
Nodes (7): BudgetSummaryCard(), BudgetSummaryCardProps, BarSpark(), DeltaPill(), trendColor(), fmtAmount(), CashFlowNode()

### Community 99 - "useProfile"
Cohesion: 0.21
Nodes (7): CookieBanner(), GtmLoader(), CookieConsent, getCookieConsent(), setCookieConsent(), loadGtm(), useIsPublicContext()

### Community 100 - "ClassificationRules.tsx"
Cohesion: 0.16
Nodes (18): AdminRoute(), bottomItemClass(), bottomItems, BottomNavLink(), BudgetsBottomNavItem(), DrawerBudgetsItem(), drawerItemClass(), MobileBottomNav() (+10 more)

### Community 101 - "ImportErrorBoundary"
Cohesion: 0.27
Nodes (6): useUpdateUserProfile(), useUserSettings(), Onboarding(), SettingsNotifications(), loadForm(), SettingsProfile()

### Community 103 - "DatePickerField"
Cohesion: 0.19
Nodes (11): ACCOUNT_TYPE_LABELS, accountDisplayLabel(), AccountInfo, COPY, escapeHtml(), Lang, layout(), renderEmail() (+3 more)

### Community 104 - "NotificationDetailDialog"
Cohesion: 0.25
Nodes (8): AppShell(), ProfileDialog(), KEY, useCategoryTranslations(), useMergeCategoryTranslations(), useCreateProfile(), useProfiles(), useUpdateProfile()

### Community 105 - "MerchantDialog"
Cohesion: 0.60
Nodes (4): useAddMerchantPattern(), useDeleteMerchantPattern(), useMerchantPatterns(), MerchantDialog()

### Community 106 - "useCategoryTranslations.ts"
Cohesion: 0.07
Nodes (25): calculateCompoundInterest(), clampCompoundInterestInput(), clampNumber(), COMPOUND_INTEREST_DEFAULTS, COMPOUND_INTEREST_LIMITS, CompoundInterestInput, CompoundInterestResult, YearBreakdown (+17 more)

### Community 109 - "select.tsx"
Cohesion: 0.15
Nodes (12): ComboSelect(), emptyPersonalForm, PersonalDataFields(), PersonalFormValue, Props, CountryOption, CountryTuple, getCountries() (+4 more)

### Community 112 - "subcategoryColor"
Cohesion: 0.60
Nodes (4): hexToHsl(), hslToHex(), subcategoryColor(), aggregateBySubcategory()

### Community 115 - "Feedback.tsx"
Cohesion: 0.21
Nodes (8): useAdminFeedback(), useMarkFeedbackRead(), AdminHeader(), empty, FormState, AdminFeedback(), stamp(), TYPE_STYLE

### Community 119 - "Codigos"
Cohesion: 0.16
Nodes (13): PromoCodeInput, useCreatePromoCode(), useDeletePromoCode(), usePromoCodes(), useUpdatePromoCode(), CodeSortKey, Codigos(), emptyForm (+5 more)

### Community 127 - "AdminMenu"
Cohesion: 0.19
Nodes (11): AdminMenu(), BudgetsNavItem(), itemClass(), navItemsBottom, navItemsTop, PlanNavItem(), ProfileNavItem(), SettingsNavItem() (+3 more)

### Community 154 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

## Knowledge Gaps
- **682 isolated node(s):** `root`, `$schema`, `UserPromptSubmit`, `name`, `private` (+677 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Home.tsx`, `Dashboard`, `AccountForm.tsx`, `History`, `transferMatch.ts`, `PasswordStrengthBar`, `Settings.tsx`, `date-picker-field.tsx`, `Landing.tsx`, `toast.tsx`, `transferMatch.ts`, `package.json`, `Settings.tsx`, `PopoverContent`, `TooltipContent`, `usePlan.ts`, `useTransactions.ts`, `EnvelopeDetailDialog.tsx`, `Transactions`, `ClassificationRules.tsx`, `NotificationDetailDialog`, `useCategoryTranslations.ts`, `select.tsx`, `useIsAdmin`, `AdminMenu`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 57 inferred relationships involving `cn()` (e.g. with `BudgetAmountSlider()` and `EnvelopeDetailDialog()`) actually correct?**
  _`cn()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `Budgets()` (e.g. with `useProfile()` and `useBudgetCategoryOrder()`) actually correct?**
  _`Budgets()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `Dashboard()` (e.g. with `trendColor()` and `fmtAmount()`) actually correct?**
  _`Dashboard()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `root`, `$schema`, `UserPromptSubmit` to the rest of the system?**
  _682 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Transactions` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
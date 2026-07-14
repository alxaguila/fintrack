import { useState, useRef, useMemo, Component, type ReactNode, type ErrorInfo } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react'
import { useProfile } from '@/contexts/ProfileContext'
import { useAccounts } from '@/hooks/useAccounts'
import { useBankFormats, useUpsertBankFormat } from '@/hooks/useBankFormats'
import { useKeywordRules } from '@/hooks/useKeywordRules'
import { useCommunityRuleMap } from '@/hooks/useCommunityRules'
import { useCategories, useCategoryGroups } from '@/hooks/useCategories'
import { AccountFormDialog } from '@/components/accounts/AccountForm'
import { useParseFile, useProcessRows, useConfirmImport, parseAmount, type ParsedRow } from '@/hooks/useImport'
import { supabase } from '@/lib/supabase'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { autoDetectColumns } from '@/lib/automap'
import type { BankFormat, SignConventionType } from '@/lib/database.types'
import { useNavigate } from 'react-router-dom'
import { parse, isValid } from 'date-fns'

// ── Error boundary so a render crash shows a useful message ──────────────────
class ImportErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[Import render error]', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 max-w-xl mx-auto space-y-4">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-2">
            <p className="font-semibold text-destructive">Error al renderizar la pantalla de importación</p>
            <p className="text-sm text-destructive/80 font-mono">{this.state.error.message}</p>
            <p className="text-xs text-muted-foreground">Revisa la consola del navegador (F12) para más detalles.</p>
          </div>
          <Button variant="outline" onClick={() => this.setState({ error: null })}>Reintentar</Button>
        </div>
      )
    }
    return this.props.children
  }
}

type Step = 1 | 2 | 3 | 4

/** Fecha de hoy en formato YYYY-MM-DD (hora local, no UTC). */
function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DATE_FORMATS = ['dd/MM/yyyy','d/M/yyyy','yyyy-MM-dd','MM/dd/yyyy','dd-MM-yyyy','dd.MM.yyyy','yyyyMMdd']
const SIGN_CONVENTIONS: SignConventionType[] = ['signed', 'unsigned_type', 'split_columns']

export default function Import() {
  return <ImportErrorBoundary><ImportInner /></ImportErrorBoundary>
}

function ImportInner() {
  const { t } = useTranslation('import')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { activeProfile } = useProfile()
  const { data: accounts = [] } = useAccounts(activeProfile?.id)
  const { data: bankFormats = [] } = useBankFormats()
  const { data: rules = [] } = useKeywordRules()
  const { data: communityMap = new Map<string, string>() } = useCommunityRuleMap()
  const { data: categories = [], refetch: refetchCategories } = useCategories()
  const { data: groups = [], refetch: refetchGroups } = useCategoryGroups()
  const upsertFormat = useUpsertBankFormat()
  const confirmImport = useConfirmImport()

  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState('')
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([])
  const [processedRows, setProcessedRows] = useState<ParsedRow[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)

  const { headers, previewRows, parseFile } = useParseFile()
  const processRows = useProcessRows()
  const fileRef = useRef<HTMLInputElement>(null)

  // Column mapping state
  const [dateCol, setDateCol] = useState('')
  const [dateFmt, setDateFmt] = useState('dd/MM/yyyy')
  const [timeCol, setTimeCol] = useState('')
  const [conceptCol, setConceptCol] = useState('')
  const [signConv, setSignConv] = useState<SignConventionType>('signed')
  const [amountCol, setAmountCol] = useState('')
  const [typeCol, setTypeCol] = useState('')
  const [debitMarker, setDebitMarker] = useState('D')
  const [debitCol, setDebitCol] = useState('')
  const [creditCol, setCreditCol] = useState('')
  const [balanceCol, setBalanceCol] = useState('')
  const [skipRows, setSkipRows] = useState(0)
  // Step 2 starts as a read-only confirmation; manual mapping is revealed on demand.
  const [editingMap, setEditingMap] = useState(false)
  // Per-collision-group choice when identical rows exist within the file
  const [dupChoices, setDupChoices] = useState<Record<string, 'distinct' | 'duplicate'>>({})
  // Wizard index for stepping through collision groups one at a time
  const [dupIndex, setDupIndex] = useState(0)
  // Saldo inicial (cuentas bancarias sin columna de saldo, primer import)
  const [existingTxCount, setExistingTxCount] = useState<number | null>(null)
  const [manualBalanceInput, setManualBalanceInput] = useState('')
  const [manualBalanceDate, setManualBalanceDate] = useState(todayISO())

  const selectedAccount = accounts.find(a => a.id === accountId)
  const entity = selectedAccount?.entity ?? ''

  // true only when a file is loaded and parsing produced at least one header
  const fileParsedOk = file !== null && headers.length > 0

  // Radix UI Select forbids value="". Filter blanks and build safe SelectItems.
  const safeHeaders = headers.filter(h => h.trim() !== '')

  // How many columns were auto-detected
  const autoDetectedCount = [dateCol, conceptCol, amountCol || debitCol].filter(Boolean).length

  function applyFormat(fmt: BankFormat) {
    setDateCol(fmt.date_column)
    setDateFmt(fmt.date_format)
    // No pisar la hora autodetectada si el formato guardado no la trae
    if (fmt.time_column) setTimeCol(fmt.time_column)
    setConceptCol(fmt.concept_column)
    setSignConv(fmt.sign_convention)
    setAmountCol(fmt.amount_column ?? '')
    setTypeCol(fmt.type_column ?? '')
    setDebitMarker(fmt.debit_marker ?? 'D')
    setDebitCol(fmt.debit_column ?? '')
    setCreditCol(fmt.credit_column ?? '')
    setBalanceCol(fmt.balance_column ?? '')
    setSkipRows(fmt.skip_rows)
  }

  async function handleFileDrop(f: File) {
    setFile(f)
    try {
      const result = await parseFile(f, ',', skipRows)
      setParsedRows(result.rows)

      // ── Apply auto-detected skip rows (HTML files with metadata header rows) ─
      if (result.detectedSkipRows !== undefined && result.detectedSkipRows > 0) {
        setSkipRows(result.detectedSkipRows)
      }

      // ── Auto-detect columns by header name ──────────────────────────────
      const auto = autoDetectColumns(result.headers, result.rows.slice(0, 5))
      if (auto.dateCol)        setDateCol(auto.dateCol)
      if (auto.dateFormat)     setDateFmt(auto.dateFormat)
      if (auto.timeCol)        setTimeCol(auto.timeCol)
      if (auto.conceptCol)     setConceptCol(auto.conceptCol)
      if (auto.signConvention) setSignConv(auto.signConvention)
      if (auto.amountCol)      setAmountCol(auto.amountCol)
      if (auto.typeCol)        setTypeCol(auto.typeCol)
      if (auto.debitCol)       setDebitCol(auto.debitCol)
      if (auto.creditCol)      setCreditCol(auto.creditCol)
      if (auto.balanceCol)     setBalanceCol(auto.balanceCol)
    } catch (err: any) {
      console.error('[Import] file drop failed:', err)
      toast({ title: t(`errors.${err.message}`, { defaultValue: t('errors.parse_error') }), description: err?.message, variant: 'destructive' })
    }
  }

  // Un formato guardado solo encaja si sus columnas existen en este fichero y su
  // formato de fecha parsea una muestra. Evita aplicar, p.ej., el formato de la
  // tarjeta (con "Hora" y fecha dd-MM-yyyy) a un extracto de cuenta (dd/MM/yyyy).
  function formatFitsFile(f: BankFormat): boolean {
    const hs = new Set(headers)
    const has = (c?: string | null) => !c || hs.has(c)
    if (!hs.has(f.date_column) || !hs.has(f.concept_column)) return false
    if (f.time_column && !hs.has(f.time_column)) return false
    if (f.sign_convention === 'signed' && !has(f.amount_column)) return false
    if (f.sign_convention === 'unsigned_type' && (!has(f.amount_column) || !has(f.type_column))) return false
    if (f.sign_convention === 'split_columns' && (!has(f.debit_column) || !has(f.credit_column))) return false
    const sample = parsedRows.find(r => r[f.date_column]?.trim())?.[f.date_column]
    if (sample && !isValid(parse(sample.trim(), f.date_format, new Date()))) return false
    return true
  }

  async function handleStep2() {
    if (!file || !accountId || !activeProfile) return

    // Aplicar el formato guardado de la entidad solo si encaja con este fichero;
    // si no, conservar la autodetección hecha en handleFileDrop.
    const saved = bankFormats.find(f => f.entity.toLowerCase() === entity.toLowerCase())
    if (saved && formatFitsFile(saved)) applyFormat(saved)

    setStep(2)
  }

  async function handleStep3() {
    if (!file || !accountId || !activeProfile) return

    const fmt: BankFormat = {
      id: '', user_id: '', created_at: '', updated_at: '',
      name: entity,
      entity,
      file_format: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
      delimiter: ',',
      encoding: 'UTF-8',
      skip_rows: skipRows,
      date_column: dateCol,
      date_format: dateFmt,
      time_column: timeCol || null,
      concept_column: conceptCol,
      sign_convention: signConv,
      amount_column: amountCol || null,
      balance_column: balanceCol || null,
      type_column: typeCol || null,
      debit_marker: debitMarker || null,
      debit_column: debitCol || null,
      credit_column: creditCol || null,
    }

    try {
      const result = await parseFile(file, ',', skipRows)
      // Refrescar la taxonomía por si el admin añadió (sub)categorías nuevas en BD:
      // useCategories usa staleTime: Infinity y, sin esto, un import con la app ya
      // abierta clasificaría con la lista antigua (categoría nueva → category_id null).
      const [catsRes, groupsRes] = await Promise.all([refetchCategories(), refetchGroups()])
      const processed = await processRows(result.rows, {
        accountId,
        profileId: activeProfile.id,
        bankFormat: fmt,
        rules,
        categories: catsRes.data ?? categories,
        groups: groupsRes.data ?? groups,
        communityMap,
        accountType: selectedAccount?.type,
      })
      setProcessedRows(processed)
      setDupChoices({})
      setDupIndex(0)

      // ¿Es la primera importación de esta cuenta? (para el paso de saldo inicial)
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
      setExistingTxCount(count ?? 0)

      setStep(3)
    } catch (err: any) {
      console.error('[Import] step3 failed:', err)
      const detail = err?.message || err?.error_description || err?.hint || JSON.stringify(err)
      toast({ title: t('errors.parse_error'), description: detail, variant: 'destructive' })
    }
  }

  async function handleConfirm() {
    if (!file || !accountId || !activeProfile) return

    const existing = bankFormats.find(f => f.entity.toLowerCase() === entity.toLowerCase())
    let bankFormatId = existing?.id ?? null

    try {
      // Auto-save/update the column-mapping template per entity. Non-blocking:
      // a failure here must never prevent the import itself.
      if (entity) {
        try {
          const upserted = await upsertFormat.mutateAsync({
            id: existing?.id,
            user_id: '',
            name: entity,
            entity,
            file_format: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
            delimiter: ',',
            encoding: 'UTF-8',
            skip_rows: skipRows,
            date_column: dateCol,
            date_format: dateFmt,
            time_column: timeCol || null,
            concept_column: conceptCol,
            sign_convention: signConv,
            amount_column: amountCol || null,
            balance_column: balanceCol || null,
            type_column: typeCol || null,
            debit_marker: debitMarker || null,
            debit_column: debitCol || null,
            credit_column: creditCol || null,
          })
          bankFormatId = (upserted as { id: string }).id
        } catch (e) {
          console.warn('[Import] format auto-save failed (continuing):', e)
        }
      }

      const result = await confirmImport.mutateAsync({
        rows: rowsToImport,
        accountId,
        accountType: selectedAccount!.type,
        profileId: activeProfile.id,
        bankFormatId,
        filename: file.name,
        hasBalanceColumn: !!balanceCol,
        manualBalance: needsBalanceStep && parsedManualBalance !== null
          ? { balance: parsedManualBalance, date: manualBalanceDate }
          : null,
      })
      toast({ title: t('step3.success', { count: result.imported }), variant: 'success' })
      navigate('/app/transactions')
    } catch (err: any) {
      console.error('[Import] confirm failed:', err)
      const detail = err?.message || err?.error_description || err?.hint || JSON.stringify(err)
      toast({ title: tc('errors.save_failed'), description: detail, variant: 'destructive' })
    }
  }

  const newRows = processedRows.filter(r => !r.isDuplicate)
  const dupRows = processedRows.filter(r => r.isDuplicate)

  // Groups of exact-identical new rows (same dupKey appearing more than once in
  // the file). These are surfaced to the user to confirm distinct vs duplicate.
  const collisionGroups: ParsedRow[][] = Object.values(
    newRows.reduce((acc, r) => {
      (acc[r.dupKey] ||= []).push(r)
      return acc
    }, {} as Record<string, ParsedRow[]>),
  ).filter(g => g.length > 1)

  // Final rows to import after applying per-group choices (default: distinct)
  const rowsToImport = newRows.filter(r =>
    (dupChoices[r.dupKey] ?? 'distinct') === 'distinct' ? true : r.occurrence === 0,
  )

  // ── Paso de saldo inicial ──────────────────────────────────────────────────
  // Solo cuentas bancarias (corriente/ahorro), cuando el extracto no trae columna
  // de saldo y es la primera importación de la cuenta (0 movimientos previos).
  const isBankAccount = selectedAccount?.type === 'cuenta_corriente' || selectedAccount?.type === 'ahorro'
  const needsBalanceStep = !!isBankAccount && !balanceCol && existingTxCount === 0
  // Movimiento más reciente del extracto (ancla del saldo que pedimos).
  const lastMovement = useMemo(
    () => rowsToImport.reduce<ParsedRow | null>((acc, r) => (acc && acc.date > r.date ? acc : r), null),
    [rowsToImport],
  )
  const parsedManualBalance = parseAmount(manualBalanceInput)
  const manualBalanceValid = parsedManualBalance !== null
  const balanceDateBeforeLast = lastMovement != null && manualBalanceDate < lastMovement.date

  // Collision-review wizard: user must explicitly decide every group before import.
  const reviewedCount = collisionGroups.filter(g => g[0].dupKey in dupChoices).length
  const allReviewed = reviewedCount === collisionGroups.length
  // Keep the wizard index within bounds (groups recompute when re-entering step 3).
  const safeDupIndex = Math.min(dupIndex, Math.max(0, collisionGroups.length - 1))

  // Record a choice and jump to the next pending/next group automatically.
  function decideDup(dupKey: string, choice: 'distinct' | 'duplicate') {
    setDupChoices(c => ({ ...c, [dupKey]: choice }))
    if (safeDupIndex < collisionGroups.length - 1) setDupIndex(safeDupIndex + 1)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Steps indicator */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(needsBalanceStep ? ['upload','map','preview','balance'] : ['upload','map','preview']).map((s, i, arr) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === i+1 ? 'bg-primary text-primary-foreground' : step > i+1 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              {step > i+1 ? '✓' : i+1}
            </span>
            <span className={step === i+1 ? 'font-medium' : 'text-muted-foreground'}>{t(`steps.${s}`)}</span>
            {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('step1.title')}</h2>

          {/* Drop zone */}
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 py-12 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f) }}
          >
            <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">{file ? file.name : t('step1.drop_zone')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('step1.drop_zone_sub')}</p>
            <p className="text-xs text-muted-foreground">{t('step1.supported')}</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFileDrop(e.target.files[0])} />
          </div>

          {/* No-profile guard */}
          {!activeProfile && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Crea un perfil financiero en <strong>Ajustes → Perfiles</strong> antes de importar.</span>
            </div>
          )}

          {file && (
            <>
              {/* Parse failed warning */}
              {headers.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>No se pudieron leer las columnas del fichero. Comprueba que el archivo no esté vacío o protegido.</span>
                </div>
              )}

              {/* File parsed OK: show column count + auto-map summary */}
              {headers.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 space-y-0.5">
                  <p className="text-xs font-medium text-green-700">
                    ✓ {headers.length} columnas detectadas
                    {autoDetectedCount >= 2 && ` · ${autoDetectedCount} campos auto-configurados`}
                  </p>
                  <p className="text-xs text-green-600">{headers.join(' · ')}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  {t('step1.account_label')}
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" aria-label={t('step1.account_help')}>
                    <title>{t('step1.account_help')}</title>
                  </HelpCircle>
                </Label>
                <Select
                  value={accountId}
                  onValueChange={v => { if (v === '__new__') setAccountDialogOpen(true); else setAccountId(v) }}
                >
                  <SelectTrigger><SelectValue placeholder={t('step1.account_placeholder')} /></SelectTrigger>
                  <SelectContent>
                    {accounts
                      .map(a => {
                        // Entidad - Tipo de cuenta - Alias (el alias solo si difiere de la entidad).
                        const alias = a.name.trim().toLowerCase() !== a.entity.trim().toLowerCase() ? a.name : ''
                        return { id: a.id, label: [a.entity, tc(`account_type.${a.type}`), alias].filter(Boolean).join(' - ') }
                      })
                      // Orden alfabético (insensible a mayúsculas/acentos); "Crear cuenta" va aparte, al final.
                      .sort((x, y) => x.label.localeCompare(y.label, 'es', { sensitivity: 'base' }))
                      .map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                    <SelectItem value="__new__">+ {t('step1.create_account')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStep2}
                disabled={!accountId || !fileParsedOk || !activeProfile}
                className="w-full"
              >
                {t('steps.map')} <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('step2.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {editingMap ? t('step2.subtitle') : t('step2.detected_help')}
          </p>

          {/* Preview table (solo lectura) */}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>{headers.map(h => <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {previewRows.slice(0,5).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 bg-white even:bg-slate-50/70">
                      {headers.map(h => <td key={h} className="whitespace-nowrap px-3 py-2 text-slate-700">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtle toggle to reveal the manual mapping controls as a fallback */}
          <button
            type="button"
            onClick={() => setEditingMap(e => !e)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          >
            {editingMap ? t('step2.adjust_done') : t('step2.adjust')}
          </button>

          {editingMap && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('step2.date_column')}</Label>
              <Select value={dateCol} onValueChange={setDateCol}>
                <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('step2.date_format')}</Label>
              <Select value={dateFmt} onValueChange={setDateFmt}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DATE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('step2.time_column')}</Label>
              <Select
                value={timeCol || '__none__'}
                onValueChange={v => setTimeCol(v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder={t('step2.no_column')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('step2.no_column')}</SelectItem>
                  {safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('step2.concept_column')}</Label>
              <Select value={conceptCol} onValueChange={setConceptCol}>
                <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('step2.sign_convention')}</Label>
              <Select value={signConv} onValueChange={v => setSignConv(v as SignConventionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIGN_CONVENTIONS.map(c => <SelectItem key={c} value={c}>{t(`step2.sign_${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {signConv === 'signed' && (
              <div className="space-y-1.5">
                <Label>{t('step2.amount_column')}</Label>
                <Select value={amountCol} onValueChange={setAmountCol}>
                  <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                  <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {signConv === 'unsigned_type' && (<>
              <div className="space-y-1.5">
                <Label>{t('step2.amount_column')}</Label>
                <Select value={amountCol} onValueChange={setAmountCol}>
                  <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                  <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('step2.type_column')}</Label>
                <Select value={typeCol} onValueChange={setTypeCol}>
                  <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                  <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('step2.debit_marker')}</Label>
                <Input value={debitMarker} onChange={e => setDebitMarker(e.target.value)} />
              </div>
            </>)}
            {signConv === 'split_columns' && (<>
              <div className="space-y-1.5">
                <Label>{t('step2.debit_column')}</Label>
                <Select value={debitCol} onValueChange={setDebitCol}>
                  <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                  <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('step2.credit_column')}</Label>
                <Select value={creditCol} onValueChange={setCreditCol}>
                  <SelectTrigger><SelectValue placeholder={t('step2.select_column')} /></SelectTrigger>
                  <SelectContent>{safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>)}

            <div className="space-y-1.5">
              <Label>{t('step2.balance_column')}</Label>
              <Select
                value={balanceCol || '__none__'}
                onValueChange={v => setBalanceCol(v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder={t('step2.no_column')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('step2.no_column')}</SelectItem>
                  {safeHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /></Button>
            <Button className="flex-1" onClick={handleStep3} disabled={!dateCol || !conceptCol}>
              {t('steps.preview')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('step3.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('step3.subtitle')}</p>

          <div className="flex gap-3">
            <Badge variant="income">{t('step3.new_count', { count: rowsToImport.length })}</Badge>
            {dupRows.length > 0 && <Badge variant="neutral">{t('step3.duplicate_count', { count: dupRows.length })}</Badge>}
          </div>

          {/* Identical-rows review wizard: step through each group, one at a time */}
          {collisionGroups.length > 0 && (() => {
            const g = collisionGroups[safeDupIndex]
            const r = g[0]
            const choice = dupChoices[r.dupKey]
            return (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-amber-800">{t('step3.dup_review_title')}</p>
                  <p className="text-xs text-amber-700">{t('step3.dup_review_help')}</p>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between text-xs text-amber-700">
                  <span>{t('step3.dup_progress', { current: safeDupIndex + 1, total: collisionGroups.length })}</span>
                  {allReviewed
                    ? <span className="flex items-center gap-1 text-green-700"><CheckCircle className="h-3.5 w-3.5" />{t('step3.dup_all_reviewed')}</span>
                    : <span>{t('step3.dup_reviewed', { count: reviewedCount })}</span>}
                </div>

                {/* Current group */}
                <div className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm">
                  {formatDate(r.date)} · {r.concept} · {formatCurrency(r.amount)} · ×{g.length}
                </div>

                {/* Choice */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" variant={choice === 'distinct' ? 'default' : 'outline'}
                    onClick={() => decideDup(r.dupKey, 'distinct')}>
                    {choice === 'distinct' && <CheckCircle className="h-3.5 w-3.5" />}{t('step3.dup_distinct')}
                  </Button>
                  <Button size="sm" className="flex-1" variant={choice === 'duplicate' ? 'default' : 'outline'}
                    onClick={() => decideDup(r.dupKey, 'duplicate')}>
                    {choice === 'duplicate' && <CheckCircle className="h-3.5 w-3.5" />}{t('step3.dup_duplicate')}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="ghost" disabled={safeDupIndex === 0}
                    onClick={() => setDupIndex(safeDupIndex - 1)}>
                    <ArrowLeft className="h-4 w-4" /> {t('step3.dup_prev')}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={safeDupIndex >= collisionGroups.length - 1}
                    onClick={() => setDupIndex(safeDupIndex + 1)}>
                    {t('step3.dup_next')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })()}

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">{tc('nav.transactions') }</th>
                  <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Concepto</th>
                  <th className="px-4 py-2 text-right font-medium">Importe</th>
                  <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[...newRows.slice(0, 10), ...(showDuplicates ? dupRows : [])].map((row, i) => (
                  <tr key={i} className={`border-t ${row.isDuplicate ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(row.date)}</td>
                    <td className="px-4 py-2 max-w-xs truncate hidden sm:table-cell">{row.concept}</td>
                    <td className={`px-4 py-2 text-right font-medium ${row.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {row.isDuplicate
                        ? <Badge variant="neutral" className="text-xs">dup</Badge>
                        : <CheckCircle className="h-4 w-4 text-green-500" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dupRows.length > 0 && (
            <button onClick={() => setShowDuplicates(s => !s)} className="text-sm text-primary underline-offset-4 hover:underline">
              {showDuplicates ? t('step3.hide_duplicates') : t('step3.show_duplicates')}
            </button>
          )}

          {!allReviewed && (
            <p className="flex items-center gap-1.5 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t('step3.dup_blocked', { count: collisionGroups.length - reviewedCount })}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> {t('step3.back')}</Button>
            {needsBalanceStep ? (
              <Button className="flex-1" onClick={() => setStep(4)} disabled={rowsToImport.length === 0 || !allReviewed}>
                {t('step3.next_balance')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleConfirm} disabled={rowsToImport.length === 0 || confirmImport.isPending || !allReviewed}>
                {confirmImport.isPending ? t('step3.importing') : t('step3.confirm', { count: rowsToImport.length })}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4 — Saldo inicial (cuenta bancaria sin columna de saldo, 1er import) */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('step4.title')}</h2>

          {/* Por qué lo pedimos */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 space-y-1.5">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-teal-800">
              <HelpCircle className="h-4 w-4 shrink-0" /> {t('step4.why_title')}
            </p>
            <p className="text-sm text-teal-700">{t('step4.why_body')}</p>
          </div>

          {/* Saldo + fecha de referencia */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="manual-balance">{t('step4.balance_label')}</Label>
              <Input
                id="manual-balance"
                inputMode="decimal"
                value={manualBalanceInput}
                onChange={e => setManualBalanceInput(e.target.value)}
                placeholder={t('step4.balance_placeholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('step4.date_label')}</Label>
              <DatePickerField
                value={manualBalanceDate}
                placeholder={t('step4.date_label')}
                onChange={v => setManualBalanceDate(v ?? todayISO())}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('step4.date_help')}</p>

          {balanceDateBeforeLast && (
            <p className="flex items-center gap-1.5 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {t('step4.date_warning')}
            </p>
          )}

          {!manualBalanceValid && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0" /> {t('step4.required_hint')}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4" /> {t('step4.back')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!manualBalanceValid || confirmImport.isPending}
            >
              {confirmImport.isPending ? t('step3.importing') : t('step4.confirm', { count: rowsToImport.length })}
            </Button>
          </div>
        </div>
      )}

      {activeProfile && (
        <AccountFormDialog
          open={accountDialogOpen}
          onOpenChange={setAccountDialogOpen}
          profileId={activeProfile.id}
          sortOrder={accounts.length}
          onSaved={acc => setAccountId(acc.id)}
        />
      )}
    </div>
  )
}

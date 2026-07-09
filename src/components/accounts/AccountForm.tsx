import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronDown, Plus } from 'lucide-react'
import { useCreateAccount, useUpdateAccount } from '@/hooks/useAccounts'
import { useBankEntities, useCreateBankSuggestion } from '@/hooks/useBankEntities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import { accountFormSchema, bankSuggestionSchema, firstError, LIMITS } from '@/lib/validation'
import type { Account, AccountType } from '@/lib/database.types'

const ACCOUNT_TYPES: AccountType[] = ['cuenta_corriente', 'ahorro', 'tarjeta_credito', 'tarjeta_debito', 'valores']

// Paleta pastel (tono suave, en línea con los colores de la app).
const COLORS = [
  '#a5b4fc', '#c4b5fd', '#d8b4fe', '#f0abfc', '#f9a8d4',
  '#fda4af', '#fdba74', '#fcd34d', '#bef264', '#86efac',
  '#6ee7b7', '#5eead4', '#7dd3fc', '#93c5fd', '#cbd5e1',
]

interface FormState { entity: string; type: AccountType | ''; alias: string; color: string; openingBalance: string }
const emptyForm: FormState = { entity: '', type: '', alias: '', color: COLORS[0], openingBalance: '' }

/** Cuentas cuyo saldo se calcula por suma y que llevan saldo inicial. */
function isBankType(type: AccountType | ''): boolean {
  return type === 'cuenta_corriente' || type === 'ahorro'
}

/** Parseo tolerante de un importe escrito a mano (coma o punto decimal). Vacío = null. */
function parseOpeningBalance(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number(t.replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileId: string
  /** When set, the dialog edits this account; otherwise it creates a new one. */
  editing?: Account | null
  /** Preselected account type when creating (e.g. from a section's "add" card). */
  defaultType?: AccountType
  /** sort_order to assign to a newly created account (usually accounts.length). */
  sortOrder?: number
  /** Called with the created/updated account after a successful save. */
  onSaved?: (account: Account) => void
}

export function AccountFormDialog({
  open,
  onOpenChange,
  profileId,
  editing,
  defaultType,
  sortOrder = 0,
  onSaved,
}: AccountFormDialogProps) {
  const { t } = useTranslation('accounts')
  const { t: tc } = useTranslation('common')
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const { data: entities = [] } = useBankEntities()
  const createSuggestion = useCreateBankSuggestion()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [debitWarnOpen, setDebitWarnOpen] = useState(false)
  // Popup "Añadir nueva entidad" (crear entidad que no está en el catálogo).
  const [newEntityOpen, setNewEntityOpen] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityError, setNewEntityError] = useState<string | null>(null)

  // Sync form whenever the dialog opens (or the edited account changes)
  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        entity: editing.entity,
        type: editing.type,
        // El alias solo tiene sentido si difiere de la entidad (así se guardó si estaba vacío).
        alias: editing.name.trim().toLowerCase() === editing.entity.trim().toLowerCase() ? '' : editing.name,
        color: editing.color,
        openingBalance: editing.opening_balance != null ? String(editing.opening_balance) : '',
      })
    } else {
      setForm({ ...emptyForm, type: defaultType ?? emptyForm.type })
    }
  }, [open, editing, defaultType])

  // Débito no se permite (duplicaría movimientos ya presentes en la cuenta corriente):
  // se muestra un aviso y no se aplica la selección.
  function handleTypeChange(value: string) {
    if (value === 'tarjeta_debito') {
      setDebitWarnOpen(true)
      return
    }
    setForm(f => ({ ...f, type: value as AccountType }))
  }

  // El usuario crea una entidad que no está en el catálogo (solo texto). Entra
  // como pendiente de revisión; el logo lo pone el admin. Si ya existe, se usa.
  async function handleCreateEntity(name: string) {
    const n = name.trim()
    if (!n) return
    setForm(f => ({ ...f, entity: n }))
    try {
      await createSuggestion.mutateAsync(n)
      toast({ title: t('entity_created'), variant: 'success' })
    } catch (err: any) {
      const dup = String(err?.message ?? '').includes('duplicate') || err?.code === '23505'
      if (!dup) toast({ title: t('entity_create_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  function openNewEntity(seed: string) {
    setNewEntityName(seed.slice(0, LIMITS.bankSuggestionName))
    setNewEntityError(null)
    setNewEntityOpen(true)
  }

  function confirmNewEntity() {
    const name = newEntityName.trim()
    // Validación de seguridad (longitud + sin caracteres de marcado).
    if (!bankSuggestionSchema.safeParse(name).success) {
      setNewEntityError(t('new_entity.invalid'))
      return
    }
    setNewEntityOpen(false)
    setNewEntityName('')
    setNewEntityError(null)
    handleCreateEntity(name)
  }

  async function handleSubmit() {
    const entity = form.entity.trim()
    if (!entity || !form.type) return
    const type = form.type
    // El alias es opcional: si está vacío, el nombre de la cuenta = entidad.
    const name = form.alias.trim() || entity
    // Saldo inicial: solo cuentas bancarias; en el resto siempre null.
    const openingBalance = isBankType(type) ? parseOpeningBalance(form.openingBalance) : null
    // Validación (defensa en profundidad): longitud, color, importe.
    // El logo ya no se sube por cuenta (lo gestiona el admin por entidad).
    const invalid = firstError(accountFormSchema.safeParse({
      type, entity, alias: form.alias, color: form.color,
      logo_url: '', openingBalance,
    }))
    if (invalid) {
      toast({ title: tc('errors.invalid_input'), variant: 'destructive' })
      return
    }
    try {
      let saved: Account
      if (editing) {
        // No tocamos iban/last_four de cuentas existentes (ya no se editan aquí).
        saved = await updateAccount.mutateAsync({
          id: editing.id,
          entity,
          type,
          name,
          color: form.color,
          logo_url: null,
          opening_balance: openingBalance,
        })
      } else {
        saved = await createAccount.mutateAsync({
          profile_id: profileId,
          entity,
          type,
          name,
          color: form.color,
          logo_url: null,
          currency: 'EUR',
          is_active: true,
          sort_order: sortOrder,
          iban: null,
          last_four: null,
          opening_balance: openingBalance,
        }) as Account
      }
      toast({ title: tc('actions.save'), variant: 'success' })
      onOpenChange(false)
      onSaved?.(saved)
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t('edit_account') : t('new_account')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 1. Tipo de cuenta (primero, como se muestra en la tarjeta) */}
          <div className="space-y-1.5">
            <Label>{t('fields.type')}</Label>
            <Select value={form.type} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue placeholder={t('fields.type_placeholder')} /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{tc(`account_type.${type}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Entidad — combobox del catálogo (estilo Select) + posibilidad de escribir otra */}
          <div className="space-y-1.5">
            <Label>{t('fields.entity')}</Label>
            <EntityCombobox
              value={form.entity}
              onChange={v => setForm(f => ({ ...f, entity: v }))}
              onAddNew={openNewEntity}
              addLabel={t('entity_create_cta')}
              options={entities.map(e => e.name).sort((a, b) => a.localeCompare(b, 'es'))}
              placeholder={t('fields.entity_placeholder')}
              maxLength={LIMITS.accountEntity}
            />
          </div>

          {/* 3. Alias (opcional) */}
          <div className="space-y-1.5">
            <Label>{t('fields.alias')}</Label>
            <Input
              value={form.alias}
              onChange={e => setForm(f => ({ ...f, alias: e.target.value }))}
              placeholder={t('fields.alias_placeholder')}
              maxLength={LIMITS.accountAlias}
            />
          </div>

          {/* 3.b Saldo inicial (solo cuentas bancarias): saldo antes del 1er movimiento.
                 El saldo actual = saldo inicial + suma de movimientos. */}
          {isBankType(form.type) && (
            <div className="space-y-1.5">
              <Label>{t('fields.opening_balance')}</Label>
              <Input
                inputMode="decimal"
                value={form.openingBalance}
                onChange={e => setForm(f => ({ ...f, openingBalance: e.target.value }))}
                placeholder={t('fields.opening_balance_placeholder')}
              />
              <p className="text-xs text-muted-foreground">{t('fields.opening_balance_hint')}</p>
            </div>
          )}

          {/* 4. Color (pastel) */}
          <div className="space-y-1.5">
            <Label>{t('fields.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0f172a' : 'transparent' }}
                />
              ))}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc('actions.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!form.entity.trim() || !form.type}>{tc('actions.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Aviso: por qué no se permiten tarjetas de débito */}
    <Dialog open={debitWarnOpen} onOpenChange={setDebitWarnOpen}>
      <DialogContent className="sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('debit_warning.title')}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('debit_warning.body')}</p>
        <DialogFooter>
          <Button onClick={() => setDebitWarnOpen(false)}>{t('debit_warning.ok')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Popup: añadir una entidad nueva (solo nombre, máx. 30) */}
    <Dialog open={newEntityOpen} onOpenChange={setNewEntityOpen}>
      <DialogContent className="sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('new_entity.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{t('new_entity.name')}</Label>
          <Input
            autoFocus
            value={newEntityName}
            onChange={e => { setNewEntityName(e.target.value); setNewEntityError(null) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmNewEntity() } }}
            placeholder={t('new_entity.placeholder')}
            maxLength={LIMITS.bankSuggestionName}
          />
          <p className="text-xs text-muted-foreground">{t('new_entity.hint')}</p>
          {newEntityError && <p className="text-xs text-[#CB6391]">{newEntityError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewEntityOpen(false)}>{tc('actions.cancel')}</Button>
          <Button onClick={confirmNewEntity} disabled={!newEntityName.trim()}>{t('new_entity.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

/**
 * Combobox de entidad con el mismo estilo visual que el Select de tipo, pero que
 * permite escribir una entidad libre además de elegir del catálogo.
 */
function EntityCombobox({ value, onChange, onAddNew, addLabel, options, placeholder, maxLength }: {
  value: string
  onChange: (v: string) => void
  onAddNew: (seed: string) => void
  addLabel: string
  options: string[]
  placeholder?: string
  maxLength?: number
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const q = value.trim().toLowerCase()
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q)) : options

  useEffect(() => {
    if (!open) return
    function onDocPointer(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointer)
    return () => document.removeEventListener('mousedown', onDocPointer)
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        maxLength={maxLength}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {/* Acción destacada: abrir el popup para añadir una entidad nueva */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setOpen(false); onAddNew(value) }}
            className="flex w-full items-center gap-2 rounded-md bg-teal-50 px-2 py-2 text-left text-sm font-semibold text-teal-700 outline-none transition-colors hover:bg-teal-100"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {addLabel}
          </button>
          {/* Separador con el resto del catálogo */}
          <div className="my-1 h-px bg-slate-200" />
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
              className="flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

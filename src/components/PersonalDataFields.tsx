import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { GENDERS, EMPLOYMENT_STATUSES, FINANCIAL_GOALS } from '@/lib/validation'
import { getCountries, getRegions, type CountryOption, type RegionOption } from '@/lib/geo'
import { cn } from '@/lib/utils'

/** Todos los campos como string (el formulario los normaliza al validar). */
export type PersonalFormValue = {
  full_name: string
  gender: string
  birth_date: string
  country: string
  province: string
  employment_status: string
  financial_goal: string
}

export const emptyPersonalForm: PersonalFormValue = {
  full_name: '',
  gender: '',
  birth_date: '',
  country: '',
  province: '',
  employment_status: '',
  financial_goal: '',
}

interface Props {
  value: PersonalFormValue
  onChange: (patch: Partial<PersonalFormValue>) => void
  errors: Record<string, string>
}

export function PersonalDataFields({ value, onChange, errors }: Props) {
  const { t, i18n } = useTranslation('settings')
  const lang = i18n.language.startsWith('es') ? 'es' : 'en'
  const today = new Date().toISOString().slice(0, 10)

  const [countries, setCountries] = useState<CountryOption[]>([])
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingRegions, setLoadingRegions] = useState(false)

  // Carga (perezosa) el catálogo de países, localizado al idioma actual.
  useEffect(() => {
    let active = true
    setLoadingCountries(true)
    getCountries(lang).then((c) => {
      if (active) {
        setCountries(c)
        setLoadingCountries(false)
      }
    })
    return () => { active = false }
  }, [lang])

  // Al cambiar el país, recarga sus subdivisiones.
  useEffect(() => {
    let active = true
    if (!value.country) {
      setRegions([])
      return
    }
    setLoadingRegions(true)
    getRegions(value.country).then((r) => {
      if (active) {
        setRegions(r)
        setLoadingRegions(false)
      }
    })
    return () => { active = false }
  }, [value.country])

  const err = (k: string) => (errors[k] ? t(`personal.errors.${errors[k]}`) : null)

  return (
    <div className="space-y-4">
      {/* Nombre completo */}
      <Field label={t('personal.full_name')} error={err('full_name')}>
        <Input
          value={value.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          maxLength={80}
          autoComplete="name"
        />
      </Field>

      {/* Género */}
      <Field label={t('personal.gender')} error={err('gender')}>
        <Select value={value.gender} onValueChange={(v) => onChange({ gender: v })}>
          <SelectTrigger><SelectValue placeholder={t('personal.select_placeholder')} /></SelectTrigger>
          <SelectContent>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g}>{t(`personal.gender_options.${g}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Fecha de nacimiento */}
      <Field label={t('personal.birth_date')} error={err('birth_date')}>
        <Input
          type="date"
          value={value.birth_date}
          max={today}
          min="1900-01-01"
          onChange={(e) => onChange({ birth_date: e.target.value })}
        />
      </Field>

      {/* País (buscable, localizado) */}
      <Field label={t('personal.country')} error={err('country')}>
        <ComboSelect
          options={countries.map((c) => ({ value: c.code, label: c.name }))}
          value={value.country}
          onChange={(v) => onChange({ country: v, province: '' })}
          placeholder={t('personal.country_placeholder')}
          loading={loadingCountries}
        />
      </Field>

      {/* Provincia / Estado / Región — dependiente del país */}
      <Field label={t('personal.region')} error={err('province')}>
        {regions.length > 0 || loadingRegions ? (
          <ComboSelect
            options={regions.map((r) => ({ value: r.name, label: r.name }))}
            value={value.province}
            onChange={(v) => onChange({ province: v })}
            placeholder={t('personal.region_placeholder')}
            loading={loadingRegions}
            disabled={!value.country}
          />
        ) : (
          // País sin subdivisiones en la base → texto libre.
          <Input
            value={value.province}
            onChange={(e) => onChange({ province: e.target.value })}
            maxLength={100}
            disabled={!value.country}
            placeholder={t('personal.region_placeholder')}
          />
        )}
      </Field>

      {/* Situación laboral */}
      <Field label={t('personal.employment_status')} error={err('employment_status')}>
        <Select value={value.employment_status} onValueChange={(v) => onChange({ employment_status: v })}>
          <SelectTrigger><SelectValue placeholder={t('personal.select_placeholder')} /></SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`personal.employment_options.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Objetivo financiero (opcional) */}
      <Field
        label={`${t('personal.financial_goal')} ${t('personal.optional')}`}
        error={err('financial_goal')}
      >
        <Select value={value.financial_goal} onValueChange={(v) => onChange({ financial_goal: v })}>
          <SelectTrigger><SelectValue placeholder={t('personal.select_placeholder')} /></SelectTrigger>
          <SelectContent>
            {FINANCIAL_GOALS.map((g) => (
              <SelectItem key={g} value={g}>{t(`personal.goal_options.${g}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/**
 * Desplegable buscable (value/label) con estilo alineado al Select del sistema.
 * Cierra al hacer clic fuera; filtra por texto; muestra estado de carga.
 */
function ComboSelect({
  options,
  value,
  onChange,
  placeholder,
  loading,
  disabled,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation('settings')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const query = q.trim().toLowerCase()
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options

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
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => { setOpen((o) => !o); setQ('') }}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn(selected ? '' : 'text-muted-foreground')}>
          {loading ? t('personal.loading') : selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && !loading && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('personal.search_placeholder')}
            className="mb-1 flex h-8 w-full rounded-sm border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{t('personal.no_results')}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false) }}
                  className={cn(
                    'flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    o.value === value && 'bg-accent/50',
                  )}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

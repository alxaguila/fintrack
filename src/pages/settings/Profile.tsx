import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserSettings, useUpdateUserProfile } from '@/hooks/useUserSettings'
import { personalDataSchema, fieldErrors } from '@/lib/validation'
import { PersonalDataFields, emptyPersonalForm, type PersonalFormValue } from '@/components/PersonalDataFields'
import { getCountries } from '@/lib/geo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'
import { SettingsHeader } from './SettingsHeader'

function loadForm(settings: NonNullable<ReturnType<typeof useUserSettings>['data']>): PersonalFormValue {
  return {
    first_name: settings.first_name ?? '',
    last_name: settings.last_name ?? '',
    gender: settings.gender ?? '',
    birth_date: settings.birth_date ?? '',
    country: settings.country ?? '',
    province: settings.province ?? '',
    employment_status: settings.employment_status ?? '',
    financial_goal: settings.financial_goal ?? '',
  }
}

export default function SettingsProfile() {
  const { t, i18n } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { data: settings } = useUserSettings()
  const updateProfile = useUpdateUserProfile()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<PersonalFormValue>(emptyPersonalForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [countryName, setCountryName] = useState('')

  // Precarga los datos guardados una vez llegan.
  useEffect(() => {
    if (!settings) return
    setForm(loadForm(settings))
  }, [settings])

  // Resuelve el nombre legible del país (guardado como código) para la vista de solo lectura.
  useEffect(() => {
    if (!settings?.country) {
      setCountryName('')
      return
    }
    let active = true
    const lang = i18n.language.startsWith('es') ? 'es' : 'en'
    getCountries(lang).then((countries) => {
      if (active) setCountryName(countries.find((c) => c.code === settings.country)?.name ?? settings.country ?? '')
    })
    return () => { active = false }
  }, [settings?.country, i18n.language])

  function patch(p: Partial<PersonalFormValue>) {
    setForm((f) => ({ ...f, ...p }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const parsed = personalDataSchema.safeParse(form)
    const errs = fieldErrors(parsed)
    setErrors(errs)
    if (!parsed.success) {
      toast({ title: t('personal.errors.check'), variant: 'destructive' })
      return
    }
    try {
      await updateProfile.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        country: form.country,
        province: form.province.trim(),
        employment_status: form.employment_status,
        financial_goal: form.financial_goal || null,
      })
      toast({ title: t('personal.saved'), variant: 'success' })
      setEditing(false)
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  function handleCancel() {
    if (settings) setForm(loadForm(settings))
    setErrors({})
    setEditing(false)
  }

  const fullName = `${form.first_name} ${form.last_name}`.trim()
  const notSet = t('personal.not_set')

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <SettingsHeader title={t('personal.title')} />

      {editing ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              <PersonalDataFields value={form} onChange={patch} errors={errors} />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleCancel}>
                  {tc('actions.cancel')}
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? t('onboarding.saving') : t('personal.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <dl className="divide-y divide-slate-100">
            <InfoRow label={t('personal.full_name')} value={fullName || notSet} />
            <InfoRow label={t('personal.gender')} value={form.gender ? t(`personal.gender_options.${form.gender}`) : notSet} />
            <InfoRow label={t('personal.birth_date')} value={form.birth_date || notSet} />
            <InfoRow label={t('personal.country')} value={countryName || notSet} />
            <InfoRow label={t('personal.region')} value={form.province || notSet} />
            <InfoRow label={t('personal.employment_status')} value={form.employment_status ? t(`personal.employment_options.${form.employment_status}`) : notSet} />
            <InfoRow label={t('personal.financial_goal')} value={form.financial_goal ? t(`personal.goal_options.${form.financial_goal}`) : notSet} />
          </dl>
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto" onClick={() => setEditing(true)}>
              {t('personal.edit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-[15px] font-medium break-words">{value}</dd>
    </div>
  )
}

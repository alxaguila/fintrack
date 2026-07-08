import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserSettings, useUpdateUserProfile } from '@/hooks/useUserSettings'
import { personalDataSchema, fieldErrors } from '@/lib/validation'
import { PersonalDataFields, emptyPersonalForm, type PersonalFormValue } from '@/components/PersonalDataFields'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'

export default function Settings() {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { data: settings } = useUserSettings()
  const updateProfile = useUpdateUserProfile()

  const [form, setForm] = useState<PersonalFormValue>(emptyPersonalForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Precarga los datos guardados una vez llegan.
  useEffect(() => {
    if (!settings) return
    setForm({
      full_name: settings.full_name ?? '',
      gender: settings.gender ?? '',
      birth_date: settings.birth_date ?? '',
      country: settings.country ?? '',
      province: settings.province ?? '',
      employment_status: settings.employment_status ?? '',
      financial_goal: settings.financial_goal ?? '',
    })
  }, [settings])

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
        full_name: form.full_name.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        country: form.country,
        province: form.province.trim(),
        employment_status: form.employment_status,
        financial_goal: form.financial_goal || null,
      })
      toast({ title: t('personal.saved'), variant: 'success' })
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      <section className="space-y-4">
        <div>
          <p className="text-[15px] font-bold">{t('personal.title')}</p>
          <p className="text-sm text-muted-foreground">{t('personal.description')}</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              <PersonalDataFields value={form} onChange={patch} errors={errors} />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? t('onboarding.saving') : t('personal.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

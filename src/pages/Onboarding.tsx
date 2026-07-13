import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUpdateUserProfile } from '@/hooks/useUserSettings'
import { personalDataSchema, fieldErrors } from '@/lib/validation'
import { PersonalDataFields, emptyPersonalForm, type PersonalFormValue } from '@/components/PersonalDataFields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/useToast'

export default function Onboarding() {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const updateProfile = useUpdateUserProfile()

  const [form, setForm] = useState<PersonalFormValue>(emptyPersonalForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function patch(p: Partial<PersonalFormValue>) {
    setForm((f) => ({ ...f, ...p }))
  }

  // "Volver atrás": cierra sesión → AppShell redirige a /auth (login).
  async function handleBack() {
    await supabase.auth.signOut()
  }

  async function handleSubmit(e: React.FormEvent) {
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
        onboarding_completed: true,
      })
      // Al invalidarse user_settings, AppShell re-renderiza y entra a la app.
    } catch (err: any) {
      toast({ title: tc('errors.save_failed'), description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 p-4 sm:items-center">
      <div className="w-full max-w-md space-y-4 py-6">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('onboarding.back')}
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Fin<span className="text-indigo-600">Track</span>
          </h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t('onboarding.title')}</CardTitle>
            <CardDescription>{t('onboarding.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PersonalDataFields value={form} onChange={patch} errors={errors} />
              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? t('onboarding.saving') : t('onboarding.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { passwordSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar'
import { toast } from '@/hooks/useToast'
import { SettingsHeader } from './SettingsHeader'

const changePasswordSchema = z
  .object({
    current: z.string().min(1),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'mismatch' })

type ChangePasswordData = z.infer<typeof changePasswordSchema>

export default function SettingsSecurity() {
  const { t } = useTranslation('settings')
  const [email, setEmail] = useState('')
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? ''))
  }, [])

  const form = useForm<ChangePasswordData>({ resolver: zodResolver(changePasswordSchema) })
  const pwd = form.watch('password') || ''

  async function onSubmit(data: ChangePasswordData) {
    setServerError('')
    // Reautenticación: verifica la contraseña actual antes de permitir el cambio.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: data.current,
    })
    if (signInErr) {
      setServerError(t('security.errors.wrong_current'))
      return
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: data.password })
    if (updateErr) {
      setServerError(updateErr.message)
      return
    }
    form.reset()
    toast({ title: t('security.password_updated'), variant: 'success' })
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <SettingsHeader title={t('security.title')} />

      {/* Email (no editable) */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 space-y-1.5">
          <Label>{t('security.email')}</Label>
          <Input value={email} readOnly disabled className="bg-slate-50" />
          <p className="text-xs text-muted-foreground">{t('security.email_hint')}</p>
        </CardContent>
      </Card>

      {/* Cambio de contraseña */}
      <section className="space-y-3">
        <p className="text-[15px] font-bold">{t('security.change_password')}</p>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current">{t('security.current_password')}</Label>
                <Input id="current" type="password" autoComplete="current-password" {...form.register('current')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">{t('security.new_password')}</Label>
                <Input id="new" type="password" autoComplete="new-password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{t('security.errors.weak_password')}</p>
                )}
                <PasswordStrengthBar password={pwd} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t('security.confirm_password')}</Label>
                <Input id="confirm" type="password" autoComplete="new-password" {...form.register('confirm')} />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{t('security.errors.passwords_mismatch')}</p>
                )}
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? t('security.saving') : t('security.save_password')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

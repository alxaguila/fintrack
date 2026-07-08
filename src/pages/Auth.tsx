import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { passwordSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar'
import { toast } from '@/hooks/useToast'

type Mode = 'login' | 'signup' | 'verify'

const RESEND_COOLDOWN = 60
// Longitud del código OTP que envía Supabase (ajuste del proyecto, 6–10).
// Aceptamos un rango para no romper si se cambia el ajuste en el dashboard.
const OTP_MIN = 6
const OTP_MAX = 8

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
const signupSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'mismatch' })

type LoginData = z.infer<typeof loginSchema>
type SignupData = z.infer<typeof signupSchema>

export default function Auth() {
  const { t, i18n } = useTranslation('auth')
  const [mode, setMode] = useState<Mode>('login')
  const [serverError, setServerError] = useState('')
  const [session, setSession] = useState<boolean | null>(null)

  // Estado del paso de verificación por código (OTP).
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Sesión existente + reacción a cambios de auth (login / verifyOtp correcto).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cuenta atrás del botón "reenviar código".
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) })
  const pwd = signupForm.watch('password') || ''

  const lang: 'es' | 'en' = i18n.language.startsWith('es') ? 'es' : 'en'
  function setLang(next: 'es' | 'en') {
    if (next === lang) return
    i18n.changeLanguage(next)
    localStorage.setItem('fintrack_language', next)
  }

  if (session) return <Navigate to="/" replace />

  function switchMode(next: Mode) {
    setServerError('')
    setMode(next)
  }

  async function onLogin(data: LoginData) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) setServerError(t('errors.invalid_credentials'))
  }

  async function onSignup(data: SignupData) {
    setServerError('')
    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      // El idioma elegido viaja como metadato → la plantilla de email de Supabase
      // se bifurca con {{ if eq .Data.lang "en" }} para enviar el código en su idioma.
      options: { data: { lang } },
    })
    if (error) {
      if (error.message.includes('already registered')) setServerError(t('errors.email_taken'))
      else setServerError(error.message)
      return
    }
    // Si las confirmaciones por email están desactivadas, ya hay sesión → redirige.
    if (res.session) return
    // En caso normal (confirmación activa) pasamos a introducir el código.
    setPendingEmail(data.email)
    setCode('')
    setCooldown(RESEND_COOLDOWN)
    switchMode('verify')
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < OTP_MIN) return
    setServerError('')
    setVerifying(true)
    const { data, error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'signup',
    })
    if (error) {
      setVerifying(false)
      setServerError(t('errors.invalid_code'))
      return
    }
    // Guarda el idioma elegido como preferencia persistente del usuario (best-effort),
    // para que la app arranque en ese idioma también en otros dispositivos.
    if (data.user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: data.user.id, preferred_language: lang, updated_at: new Date().toISOString() })
    }
    // onAuthStateChange crea la sesión y redirige.
  }

  async function onResend() {
    if (cooldown > 0) return
    setServerError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail })
    if (error) {
      setServerError(error.message)
      return
    }
    setCooldown(RESEND_COOLDOWN)
    toast({ title: 'FinTrack', description: t('verify.resent'), variant: 'success' })
  }

  function backToSignup() {
    // Vuelve al registro con el email precargado para poder corregirlo.
    signupForm.setValue('email', pendingEmail)
    setCode('')
    switchMode('signup')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-end">
          <div className="inline-flex overflow-hidden rounded-full border border-slate-200 text-xs font-semibold">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn(
                  'px-3 py-1 transition-colors',
                  lang === l ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-100',
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Fin<span className="text-indigo-600">Track</span>
          </h1>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t(`${mode}.title`)}</CardTitle>
            <CardDescription>
              {mode === 'verify'
                ? t('verify.subtitle', { email: pendingEmail })
                : t(`${mode}.subtitle`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input id="email" type="email" placeholder={t('login.email_placeholder')} {...loginForm.register('email')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <Input id="password" type="password" placeholder={t('login.password_placeholder')} {...loginForm.register('password')} />
                </div>
                {serverError && <p className="text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? t('login.loading') : t('login.submit')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('login.no_account')}{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="text-primary underline-offset-4 hover:underline">
                    {t('login.sign_up_link')}
                  </button>
                </p>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-email">{t('signup.email')}</Label>
                  <Input id="s-email" type="email" placeholder={t('signup.email_placeholder')} {...signupForm.register('email')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-password">{t('signup.password')}</Label>
                  <Input id="s-password" type="password" placeholder={t('signup.password_placeholder')} {...signupForm.register('password')} />
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{t('errors.weak_password')}</p>
                  )}
                  <PasswordStrengthBar password={pwd} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-confirm">{t('signup.confirm_password')}</Label>
                  <Input id="s-confirm" type="password" placeholder={t('signup.confirm_placeholder')} {...signupForm.register('confirmPassword')} />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{t('errors.passwords_mismatch')}</p>
                  )}
                </div>
                {serverError && <p className="text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting ? t('signup.loading') : t('signup.submit')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('signup.has_account')}{' '}
                  <button type="button" onClick={() => switchMode('login')} className="text-primary underline-offset-4 hover:underline">
                    {t('signup.login_link')}
                  </button>
                </p>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={onVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">{t('verify.code')}</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_MAX}
                    placeholder={t('verify.code_placeholder')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX))}
                    className="text-center text-lg font-mono tracking-[0.3em]"
                  />
                </div>
                {serverError && <p className="text-sm text-destructive">{serverError}</p>}
                <Button type="submit" className="w-full" disabled={verifying || code.length < OTP_MIN}>
                  {verifying ? t('verify.loading') : t('verify.submit')}
                </Button>
                <div className="flex flex-col items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={cooldown > 0}
                    className="text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {cooldown > 0 ? t('verify.resend_in', { seconds: cooldown }) : t('verify.resend')}
                  </button>
                  <button
                    type="button"
                    onClick={backToSignup}
                    className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t('verify.change_email')}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

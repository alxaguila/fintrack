import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { passwordSchema } from '@/lib/validation'
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar'
import { toast } from '@/hooks/useToast'
import { BRAND, BrandMark } from '@/components/landing/brand'

const RESEND_COOLDOWN = 60
const OTP_MIN = 6
const OTP_MAX = 8

const signupSchema = z
  .object({ email: z.string().email(), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'mismatch' })
type SignupData = z.infer<typeof signupSchema>

/**
 * Página de registro con la estética de la landing (fondo navy + tarjeta). Reutiliza
 * el flujo signup → verificación por código OTP de Supabase (idéntico a Auth). Al
 * verificar, `onAuthStateChange` crea la sesión y redirige a /app.
 */
export default function Register() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signup' | 'verify'>('signup')
  const [serverError, setServerError] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const form = useForm<SignupData>({ resolver: zodResolver(signupSchema) })
  const pwd = form.watch('password') || ''

  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const setLang = (next: 'es' | 'en') => {
    if (next === lang) return
    i18n.changeLanguage(next)
    localStorage.setItem('fintrack_language', next)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/app', { replace: true })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/app', { replace: true })
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function onSignup(data: SignupData) {
    setServerError('')
    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { lang } },
    })
    if (error) {
      if (error.message.includes('already registered')) setServerError(t('errors.email_taken'))
      else setServerError(error.message)
      return
    }
    if (res.session) return
    setPendingEmail(data.email)
    setCode('')
    setCooldown(RESEND_COOLDOWN)
    setServerError('')
    setMode('verify')
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < OTP_MIN) return
    setServerError('')
    setVerifying(true)
    const { data, error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: 'signup' })
    if (error) {
      setVerifying(false)
      setServerError(t('errors.invalid_code'))
      return
    }
    if (data.user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: data.user.id, preferred_language: lang, updated_at: new Date().toISOString() })
    }
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
    form.setValue('email', pendingEmail)
    setCode('')
    setServerError('')
    setMode('signup')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', font: `400 15px ${BRAND.sans}`, color: BRAND.ink,
    background: '#fff', border: '1px solid #D9E0E6', borderRadius: 11, padding: '11px 13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', font: `600 13px ${BRAND.sans}`, color: '#46586B', marginBottom: 6 }
  const seg: React.CSSProperties = { font: `600 12px ${BRAND.sans}`, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', border: 'none' }

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.ink, color: BRAND.ink, position: 'relative', overflow: 'hidden', fontFamily: BRAND.sans, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', right: -160, top: -180, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.28),transparent 66%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -140, bottom: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,123,174,.3),transparent 70%)', pointerEvents: 'none' }} />

      {/* Top bar: logo (→ landing) + idioma */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <BrandMark size={30} />
          <span style={{ font: `600 22px ${BRAND.display}`, letterSpacing: '-.03em', color: '#fff' }}>fintrack</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: 3 }}>
          <button onClick={() => setLang('es')} style={{ ...seg, ...(lang === 'es' ? { background: '#fff', color: BRAND.ink } : { background: 'transparent', color: '#8FA9B8' }) }}>ES</button>
          <button onClick={() => setLang('en')} style={{ ...seg, ...(lang === 'en' ? { background: '#fff', color: BRAND.ink } : { background: 'transparent', color: '#8FA9B8' }) }}>EN</button>
        </div>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px 48px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 22, boxShadow: '0 30px 70px rgba(0,0,0,.4)', overflow: 'hidden' }}>
          <div style={{ padding: '30px 32px 34px' }}>
            <h1 style={{ margin: 0, font: `500 28px ${BRAND.display}`, letterSpacing: '-.02em', color: BRAND.ink }}>
              {mode === 'verify' ? t('verify.title') : t('signup.title')}
            </h1>
            <p style={{ margin: '8px 0 0', font: `400 15px/1.5 ${BRAND.sans}`, color: '#66757F' }}>
              {mode === 'verify' ? t('verify.subtitle', { email: pendingEmail }) : t('signup.subtitle')}
            </p>

            {mode === 'signup' && (
              <form onSubmit={form.handleSubmit(onSignup)} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <label htmlFor="r-email" style={labelStyle}>{t('signup.email')}</label>
                  <input id="r-email" type="email" placeholder={t('signup.email_placeholder')} style={inputStyle} {...form.register('email')} />
                </div>
                <div>
                  <label htmlFor="r-password" style={labelStyle}>{t('signup.password')}</label>
                  <input id="r-password" type="password" placeholder={t('signup.password_placeholder')} style={inputStyle} {...form.register('password')} />
                  {form.formState.errors.password && <p style={{ margin: '6px 0 0', font: `400 12px ${BRAND.sans}`, color: '#DC2626' }}>{t('errors.weak_password')}</p>}
                  <div style={{ marginTop: 8 }}><PasswordStrengthBar password={pwd} /></div>
                </div>
                <div>
                  <label htmlFor="r-confirm" style={labelStyle}>{t('signup.confirm_password')}</label>
                  <input id="r-confirm" type="password" placeholder={t('signup.confirm_placeholder')} style={inputStyle} {...form.register('confirmPassword')} />
                  {form.formState.errors.confirmPassword && <p style={{ margin: '6px 0 0', font: `400 12px ${BRAND.sans}`, color: '#DC2626' }}>{t('errors.passwords_mismatch')}</p>}
                </div>
                {serverError && <p style={{ margin: 0, font: `400 13px ${BRAND.sans}`, color: '#DC2626' }}>{serverError}</p>}
                <button type="submit" disabled={form.formState.isSubmitting} style={{ marginTop: 4, background: BRAND.accent, color: '#fff', font: `600 15px ${BRAND.sans}`, padding: '13px 0', borderRadius: 11, border: 'none', cursor: 'pointer', opacity: form.formState.isSubmitting ? 0.7 : 1 }}>
                  {form.formState.isSubmitting ? t('signup.loading') : t('signup.submit')}
                </button>
                <p style={{ margin: 0, textAlign: 'center', font: `400 14px ${BRAND.sans}`, color: '#66757F' }}>
                  {t('signup.has_account')}{' '}
                  <button type="button" onClick={() => navigate('/?login=1')} style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {t('signup.login_link')}
                  </button>
                </p>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={onVerify} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <label htmlFor="r-otp" style={labelStyle}>{t('verify.code')}</label>
                  <input
                    id="r-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_MAX}
                    placeholder={t('verify.code_placeholder')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX))}
                    style={{ ...inputStyle, textAlign: 'center', font: `500 20px ${BRAND.mono}`, letterSpacing: '.3em' }}
                  />
                </div>
                {serverError && <p style={{ margin: 0, font: `400 13px ${BRAND.sans}`, color: '#DC2626' }}>{serverError}</p>}
                <button type="submit" disabled={verifying || code.length < OTP_MIN} style={{ marginTop: 4, background: BRAND.accent, color: '#fff', font: `600 15px ${BRAND.sans}`, padding: '13px 0', borderRadius: 11, border: 'none', cursor: (verifying || code.length < OTP_MIN) ? 'not-allowed' : 'pointer', opacity: (verifying || code.length < OTP_MIN) ? 0.6 : 1 }}>
                  {verifying ? t('verify.loading') : t('verify.submit')}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, font: `400 14px ${BRAND.sans}` }}>
                  <button type="button" onClick={onResend} disabled={cooldown > 0} style={{ color: cooldown > 0 ? '#9AA6B0' : BRAND.blue, background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer' }}>
                    {cooldown > 0 ? t('verify.resend_in', { seconds: cooldown }) : t('verify.resend')}
                  </button>
                  <button type="button" onClick={backToSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#66757F', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft style={{ width: 14, height: 14 }} />{t('verify.change_email')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

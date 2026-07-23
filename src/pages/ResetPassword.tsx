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
import { PasswordInput } from '@/components/auth/PasswordInput'
import { toast } from '@/hooks/useToast'
import { BRAND, BrandMark } from '@/components/landing/brand'
import { getAppUrl } from '@/lib/appUrl'

const RESEND_COOLDOWN = 60
const OTP_MIN = 6
const OTP_MAX = 8

const requestSchema = z.object({ email: z.string().email() })
type RequestData = z.infer<typeof requestSchema>

const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'mismatch' })
type ResetData = z.infer<typeof resetSchema>

/**
 * Restablecer contraseña olvidada, con la estética de la landing.
 *
 * Flujo (consistente con el registro, por código en vez de enlace mágico):
 *   1. `request` → resetPasswordForEmail envía un código al correo.
 *   2. `reset`   → verifyOtp({type:'recovery'}) crea sesión y updateUser fija la nueva contraseña.
 *
 * OJO: no se redirige al detectar sesión, porque verifyOtp ya crea una ANTES de
 * haber cambiado la contraseña; la navegación a /app ocurre solo tras updateUser.
 */
export default function ResetPassword() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const [mode, setMode] = useState<'request' | 'reset'>('request')
  const [serverError, setServerError] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const requestForm = useForm<RequestData>({ resolver: zodResolver(requestSchema) })
  const resetForm = useForm<ResetData>({ resolver: zodResolver(resetSchema) })
  const pwd = resetForm.watch('password') || ''

  const lang: 'es' | 'en' = i18n.language.startsWith('en') ? 'en' : 'es'
  const setLang = (next: 'es' | 'en') => {
    if (next === lang) return
    i18n.changeLanguage(next)
    localStorage.setItem('fintrack_language', next)
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function onRequest(data: RequestData) {
    setServerError('')
    // Supabase no revela si el correo existe: la respuesta es la misma en ambos
    // casos, y el mensaje que mostramos es neutro (anti user-enumeration).
    const { error } = await supabase.auth.resetPasswordForEmail(data.email)
    if (error) {
      setServerError(error.message)
      return
    }
    setPendingEmail(data.email)
    setCode('')
    setCooldown(RESEND_COOLDOWN)
    setMode('reset')
  }

  async function onReset(data: ResetData) {
    if (code.length < OTP_MIN) return
    setServerError('')
    setSaving(true)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'recovery',
    })
    if (otpError) {
      setSaving(false)
      setServerError(t('errors.invalid_code'))
      return
    }
    // El código es válido y ya hay sesión: ahora sí fijamos la nueva contraseña.
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
    if (updateError) {
      setSaving(false)
      setServerError(updateError.message)
      return
    }
    toast({ title: 'zafyros', description: t('reset.success'), variant: 'success' })
    window.location.assign(getAppUrl())
  }

  async function onResend() {
    if (cooldown > 0) return
    setServerError('')
    // Para recovery no existe auth.resend(): se vuelve a pedir el correo.
    const { error } = await supabase.auth.resetPasswordForEmail(pendingEmail)
    if (error) {
      setServerError(error.message)
      return
    }
    setCooldown(RESEND_COOLDOWN)
    toast({ title: 'zafyros', description: t('reset.resent'), variant: 'success' })
  }

  function backToRequest() {
    requestForm.setValue('email', pendingEmail)
    setCode('')
    setServerError('')
    setMode('request')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', font: `400 15px ${BRAND.sans}`, color: BRAND.ink,
    background: '#fff', border: '1px solid #D9E0E6', borderRadius: 11, padding: '11px 13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', font: `600 13px ${BRAND.sans}`, color: '#46586B', marginBottom: 6 }
  const seg: React.CSSProperties = { font: `600 12px ${BRAND.sans}`, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', border: 'none' }
  const errorStyle: React.CSSProperties = { margin: '6px 0 0', font: `400 12px ${BRAND.sans}`, color: '#DC2626' }
  const primaryBtn = (disabled: boolean): React.CSSProperties => ({
    marginTop: 4, background: BRAND.accent, color: '#fff', font: `600 15px ${BRAND.sans}`,
    padding: '13px 0', borderRadius: 11, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
  })

  return (
    <div style={{ minHeight: '100dvh', background: BRAND.ink, color: BRAND.ink, position: 'relative', overflow: 'hidden', fontFamily: BRAND.sans, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', right: -160, top: -180, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.28),transparent 66%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -140, bottom: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(10,123,174,.3),transparent 70%)', pointerEvents: 'none' }} />

      {/* Top bar: logo (→ landing) + idioma */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <BrandMark size={30} filled={false} />
          <span style={{ font: `600 22px ${BRAND.wordmark}`, letterSpacing: '-.03em', color: '#fff' }}>zafyros</span>
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
              {mode === 'reset' ? t('reset.title') : t('forgot.title')}
            </h1>
            <p style={{ margin: '8px 0 0', font: `400 15px/1.5 ${BRAND.sans}`, color: '#66757F' }}>
              {mode === 'reset' ? t('reset.subtitle', { email: pendingEmail }) : t('forgot.subtitle')}
            </p>

            {mode === 'request' && (
              <form onSubmit={requestForm.handleSubmit(onRequest)} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <label htmlFor="rp-email" style={labelStyle}>{t('forgot.email')}</label>
                  <input id="rp-email" type="email" autoComplete="email" placeholder={t('forgot.email_placeholder')} style={inputStyle} {...requestForm.register('email')} />
                  {requestForm.formState.errors.email && <p style={errorStyle}>{t('errors.invalid_email')}</p>}
                </div>
                {serverError && <p style={{ margin: 0, font: `400 13px ${BRAND.sans}`, color: '#DC2626' }}>{serverError}</p>}
                <button type="submit" disabled={requestForm.formState.isSubmitting} style={primaryBtn(requestForm.formState.isSubmitting)}>
                  {requestForm.formState.isSubmitting ? t('forgot.loading') : t('forgot.submit')}
                </button>
                <p style={{ margin: 0, textAlign: 'center', font: `400 14px ${BRAND.sans}`, color: '#66757F' }}>
                  <button type="button" onClick={() => navigate('/?login=1')} style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {t('forgot.back_to_login')}
                  </button>
                </p>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={resetForm.handleSubmit(onReset)} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <label htmlFor="rp-otp" style={labelStyle}>{t('reset.code')}</label>
                  <input
                    id="rp-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_MAX}
                    placeholder={t('reset.code_placeholder')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX))}
                    style={{ ...inputStyle, textAlign: 'center', font: `500 20px ${BRAND.mono}`, letterSpacing: '.3em' }}
                  />
                </div>
                <div>
                  <label htmlFor="rp-password" style={labelStyle}>{t('reset.new_password')}</label>
                  <PasswordInput
                    id="rp-password"
                    autoComplete="new-password"
                    placeholder={t('reset.new_password_placeholder')}
                    style={inputStyle}
                    {...resetForm.register('password')}
                  />
                  {resetForm.formState.errors.password && <p style={errorStyle}>{t('errors.weak_password')}</p>}
                  <div style={{ marginTop: 8 }}><PasswordStrengthBar password={pwd} /></div>
                </div>
                <div>
                  <label htmlFor="rp-confirm" style={labelStyle}>{t('reset.confirm_password')}</label>
                  <PasswordInput
                    id="rp-confirm"
                    autoComplete="new-password"
                    placeholder={t('reset.confirm_placeholder')}
                    style={inputStyle}
                    {...resetForm.register('confirmPassword')}
                  />
                  {resetForm.formState.errors.confirmPassword && <p style={errorStyle}>{t('errors.passwords_mismatch')}</p>}
                </div>
                {serverError && <p style={{ margin: 0, font: `400 13px ${BRAND.sans}`, color: '#DC2626' }}>{serverError}</p>}
                <button type="submit" disabled={saving || code.length < OTP_MIN} style={primaryBtn(saving || code.length < OTP_MIN)}>
                  {saving ? t('reset.loading') : t('reset.submit')}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, font: `400 14px ${BRAND.sans}` }}>
                  <button type="button" onClick={onResend} disabled={cooldown > 0} style={{ color: cooldown > 0 ? '#9AA6B0' : BRAND.blue, background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer' }}>
                    {cooldown > 0 ? t('reset.resend_in', { seconds: cooldown }) : t('reset.resend')}
                  </button>
                  <button type="button" onClick={backToRequest} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#66757F', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft style={{ width: 14, height: 14 }} />{t('reset.change_email')}
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

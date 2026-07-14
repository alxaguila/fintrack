import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BRAND, BrandMark } from '@/components/landing/brand'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
type LoginData = z.infer<typeof loginSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Cambiar a la página de registro (cierra el popup y navega). */
  onGoRegister: () => void
}

/**
 * Popup de inicio de sesión sobre la landing. Estilo alineado con el diseño de
 * marketing (navy + azul). El éxito lo capta `onAuthStateChange` en Landing, que
 * redirige a /app; aquí solo cerramos el diálogo.
 */
export function LoginDialog({ open, onOpenChange, onGoRegister }: Props) {
  const { t } = useTranslation('auth')
  const [serverError, setServerError] = useState('')
  const form = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginData) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setServerError(t('errors.invalid_credentials'))
      return
    }
    onOpenChange(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', font: `400 15px ${BRAND.sans}`, color: BRAND.ink,
    background: '#fff', border: '1px solid #D9E0E6', borderRadius: 11, padding: '11px 13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', font: `600 13px ${BRAND.sans}`, color: '#46586B', marginBottom: 6 }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[400px] gap-0 border-0 p-0 sm:rounded-2xl"
        style={{ background: '#fff', fontFamily: BRAND.sans, overflow: 'hidden' }}
      >
        {/* Cabecera navy */}
        <div style={{ background: BRAND.ink, padding: '22px 26px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -60, top: -70, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,176,214,.3),transparent 70%)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={26} />
            <span style={{ font: `600 20px ${BRAND.display}`, letterSpacing: '-.03em', color: '#fff' }}>fintrack</span>
          </div>
          <DialogTitle asChild>
            <h2 style={{ position: 'relative', margin: '16px 0 0', font: `500 24px ${BRAND.display}`, letterSpacing: '-.02em', color: '#EAF4FA' }}>{t('login.title')}</h2>
          </DialogTitle>
          <DialogDescription asChild>
            <p style={{ position: 'relative', margin: '6px 0 0', font: `400 14px ${BRAND.sans}`, color: '#9FBAC9' }}>{t('login.subtitle')}</p>
          </DialogDescription>
        </div>

        {/* Formulario */}
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label htmlFor="ld-email" style={labelStyle}>{t('login.email')}</label>
            <input id="ld-email" type="email" placeholder={t('login.email_placeholder')} style={inputStyle} {...form.register('email')} />
          </div>
          <div>
            <label htmlFor="ld-password" style={labelStyle}>{t('login.password')}</label>
            <input id="ld-password" type="password" placeholder={t('login.password_placeholder')} style={inputStyle} {...form.register('password')} />
          </div>
          {serverError && <p style={{ margin: 0, font: `400 13px ${BRAND.sans}`, color: '#DC2626' }}>{serverError}</p>}
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="ftl-login-submit"
            style={{ marginTop: 4, background: BRAND.blue, color: '#fff', font: `600 15px ${BRAND.sans}`, padding: '12px 0', borderRadius: 11, border: 'none', cursor: 'pointer', opacity: form.formState.isSubmitting ? 0.7 : 1 }}
          >
            {form.formState.isSubmitting ? t('login.loading') : t('login.submit')}
          </button>
          <p style={{ margin: 0, textAlign: 'center', font: `400 14px ${BRAND.sans}`, color: '#66757F' }}>
            {t('login.no_account')}{' '}
            <button type="button" onClick={onGoRegister} style={{ font: `600 14px ${BRAND.sans}`, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {t('login.sign_up_link')}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// zafyros — Edge Function: send-auth-email
// ============================================================
//
// Reemplaza el envío nativo de emails de Supabase Auth (código de
// verificación de registro, código de recuperación de contraseña) por un
// envío propio vía Resend, con la plantilla de marca zafyros y en el idioma
// real del usuario. Se engancha como Auth Hook "Send Email": Supabase, en
// vez de mandar el email él mismo, llama a esta function con los datos
// (usuario + código OTP) y nosotros decidimos qué mandar y por dónde.
//
// No hace falta tocar Register.tsx ni ResetPassword.tsx: siguen llamando a
// supabase.auth.signUp() / verifyOtp() / resetPasswordForEmail() igual que
// antes, solo cambia quién manda el correo de fondo.
//
// Idioma:
//   - signup   → user.user_metadata.lang (ya lo manda Register.tsx en el signUp()).
//   - recovery → no viaja en el payload del hook; se consulta
//                user_settings.preferred_language con el user.id, con
//                fallback a 'es' si no hay fila.
//
// Seguridad: el payload viene firmado por Supabase (Standard Webhooks). Sin
// verificar la firma, cualquiera podría golpear este endpoint y disparar
// envíos arbitrarios contra nuestra cuenta de Resend.
//
// Despliegue:
//   supabase functions deploy send-auth-email --no-verify-jwt
// Secrets requeridos (supabase secrets set ...):
//   RESEND_API_KEY        — API key de Resend con permiso de envío.
//   SEND_EMAIL_HOOK_SECRET — secret que da el dashboard de Supabase al
//                            activar Authentication → Hooks → Send Email.
// Ya presentes por defecto en el runtime de Supabase:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'npm:standardwebhooks@1.0.0'

type Lang = 'es' | 'en'

type HookPayload = {
  user: {
    id: string
    email: string
    user_metadata?: Record<string, unknown>
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }
}

const FROM_ADDRESS = 'zafyros <no-reply@zafyros.com>'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace('v1,whsec_', '')

  let verified: HookPayload
  try {
    const wh = new Webhook(hookSecret)
    verified = wh.verify(payload, headers) as HookPayload
  } catch (e) {
    return json({ error: 'invalid_signature', detail: String(e) }, 401)
  }

  const { user, email_data } = verified
  const { token, email_action_type } = email_data

  try {
    const lang = await resolveLang(user, email_action_type)
    const { subject, html } = renderEmail(email_action_type, token, lang)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [user.email], subject, html }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'resend_failed', detail }, 500)
    }
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500)
  }

  return json({}, 200)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function resolveLang(user: HookPayload['user'], emailActionType: string): Promise<Lang> {
  const metaLang = user.user_metadata?.lang
  if (metaLang === 'en' || metaLang === 'es') return metaLang

  if (emailActionType === 'recovery') {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data } = await admin
      .from('user_settings')
      .select('preferred_language')
      .eq('user_id', user.id)
      .maybeSingle()
    if (data?.preferred_language === 'en' || data?.preferred_language === 'es') return data.preferred_language
  }

  return 'es'
}

// ------------------------------------------------------------
// Plantillas
// ------------------------------------------------------------

const COPY: Record<Lang, Record<'signup' | 'recovery' | 'fallback', {
  subject: string
  preheader: string
  heading: string
  body: string
  codeLabel: string
  ignore: string
}>> = {
  es: {
    signup: {
      subject: 'Tu código para verificar tu cuenta en Zafyros',
      preheader: 'Usa este código para completar tu registro en Zafyros.',
      heading: 'Verifica tu cuenta',
      body: 'Usa este código para terminar de crear tu cuenta en Zafyros. Caduca en 1 hora.',
      codeLabel: 'Tu código',
      ignore: 'Si no has sido tú, puedes ignorar este correo.',
    },
    recovery: {
      subject: 'Tu código para restablecer tu contraseña en Zafyros',
      preheader: 'Usa este código para elegir una nueva contraseña.',
      heading: 'Restablece tu contraseña',
      body: 'Usa este código para elegir una nueva contraseña de tu cuenta Zafyros. Caduca en 1 hora.',
      codeLabel: 'Tu código',
      ignore: 'Si no has sido tú, puedes ignorar este correo: tu contraseña actual sigue siendo válida.',
    },
    fallback: {
      subject: 'Tu código de verificación de Zafyros',
      preheader: 'Usa este código para continuar.',
      heading: 'Tu código de verificación',
      body: 'Usa este código para continuar en Zafyros.',
      codeLabel: 'Tu código',
      ignore: 'Si no has sido tú, puedes ignorar este correo.',
    },
  },
  en: {
    signup: {
      subject: 'Your Zafyros verification code',
      preheader: 'Use this code to finish creating your account.',
      heading: 'Verify your account',
      body: 'Use this code to finish creating your Zafyros account. It expires in 1 hour.',
      codeLabel: 'Your code',
      ignore: "If this wasn't you, you can safely ignore this email.",
    },
    recovery: {
      subject: 'Your Zafyros password reset code',
      preheader: 'Use this code to choose a new password.',
      heading: 'Reset your password',
      body: 'Use this code to choose a new password for your Zafyros account. It expires in 1 hour.',
      codeLabel: 'Your code',
      ignore: "If this wasn't you, you can safely ignore this email — your current password stays unchanged.",
    },
    fallback: {
      subject: 'Your Zafyros verification code',
      preheader: 'Use this code to continue.',
      heading: 'Your verification code',
      body: 'Use this code to continue in Zafyros.',
      codeLabel: 'Your code',
      ignore: "If this wasn't you, you can safely ignore this email.",
    },
  },
}

function renderEmail(emailActionType: string, token: string, lang: Lang) {
  const kind = emailActionType === 'signup' || emailActionType === 'recovery' ? emailActionType : 'fallback'
  const c = COPY[lang][kind]
  return { subject: c.subject, html: layout(c, token, lang) }
}

function layout(c: (typeof COPY)['es']['signup'], token: string, lang: Lang) {
  const ink = '#0A2540'
  const accent = '#FF6B4A'
  const cream = '#F5F2EC'
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
  const mono = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${cream};font-family:${font};">
  <span style="display:none;font-size:1px;color:${cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(c.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${ink};padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
                      <path d="M34,28 L66,28 L80,44 L50,80 L20,44 Z M20,44 L80,44 M34,44 L50,80 M66,44 L50,80" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font:600 20px ${font};letter-spacing:-.02em;color:#ffffff;">zafyros</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 12px;font:600 22px ${font};letter-spacing:-.01em;color:${ink};">${escapeHtml(c.heading)}</h1>
              <p style="margin:0;font:400 15px/1.6 ${font};color:#46586B;">${escapeHtml(c.body)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <div style="font:600 11px ${font};text-transform:uppercase;color:#8A97A3;margin-bottom:8px;"><span style="letter-spacing:.08em;margin-right:-.08em;">${escapeHtml(c.codeLabel)}</span></div>
                    <div style="font:600 30px ${mono};color:${ink};"><span style="letter-spacing:.28em;margin-right:-.28em;">${escapeHtml(token)}</span></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;">
              <p style="margin:0;font:400 13px/1.6 ${font};color:#8A97A3;">${escapeHtml(c.ignore)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #EBEBE5;">
              <p style="margin:0;font:400 12px ${font};color:#A7B1BA;">© ${new Date().getFullYear()} Zafyros · <span style="color:${accent};">zafyros.com</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ============================================================
// zafyros — Edge Function: send-inactivity-emails
// ============================================================
//
// Versión por email del aviso in-app "cuenta sin actualizar" (migración
// 041/048). El aviso in-app se calcula desde el cliente (useNotifications.ts,
// al montar AppShell) y por tanto solo llega a usuarios que ya abrieron la
// app — inútil para reactivar a alguien que lleva tiempo sin entrar. Esta
// function la invoca pg_cron una vez al día (migración 049), sin que medie
// ninguna sesión de usuario.
//
// Pasos:
//   1. Verifica el secreto compartido (header X-Cron-Secret) — no hay JWT de
//      usuario ni firma Standard Webhooks aquí, así que sin este control el
//      endpoint sería invocable públicamente.
//   2. Llama a generate_stale_account_notifications_all_users() (048) para
//      refrescar/escalar avisos de TODOS los usuarios (no solo el que
//      llama, a diferencia de la función original de 041).
//   3. Lee notifications con type='account_stale', resolved_at IS NULL,
//      emailed_at IS NULL, agrupadas por user_id (una cuenta puede generar
//      varias filas; se manda un único email por usuario).
//   4. Filtra por user_settings.notify_inactivity_email = true (opt-out).
//   5. Para cada usuario, resuelve email + idioma (Auth Admin API +
//      user_settings.preferred_language, mismo fallback a 'es' que
//      send-auth-email) y envía por Resend.
//   6. Marca emailed_at = now() en las notificaciones ya enviadas, para no
//      reenviar el mismo aviso 'warning' cada día (solo se reenvía al
//      escalar a 'critical', que es una notificación nueva con su propio
//      dedup_key).
//
// Sigue fallando de forma aislada: un error al mandar el email de un
// usuario no aborta el resto del lote.
//
// Despliegue:
//   supabase functions deploy send-inactivity-emails
// Secrets requeridos (supabase secrets set ...):
//   RESEND_API_KEY — igual que send-auth-email.
//   CRON_SECRET    — mismo valor que el guardado en Supabase Vault como
//                    'cron_secret' (ver migración 049).
// Ya presentes por defecto en el runtime de Supabase:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Lang = 'es' | 'en'

type StaleItem = {
  account_name: string
  profile_name: string
  days_since: number
  severity: 'warning' | 'critical'
}

type UserGroup = {
  user_id: string
  notification_ids: string[]
  items: StaleItem[]
  worstSeverity: 'warning' | 'critical'
}

const FROM_ADDRESS = 'zafyros <no-reply@zafyros.com>'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('X-Cron-Secret') !== cronSecret) {
    return json({ error: 'unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { error: rpcError } = await admin.rpc('generate_stale_account_notifications_all_users')
  if (rpcError) {
    return json({ error: 'rpc_failed', detail: rpcError.message }, 500)
  }

  const { data: pending, error: pendingError } = await admin
    .from('notifications')
    .select('id, user_id, severity, payload')
    .eq('type', 'account_stale')
    .is('resolved_at', null)
    .is('emailed_at', null)

  if (pendingError) {
    return json({ error: 'query_failed', detail: pendingError.message }, 500)
  }
  if (!pending || pending.length === 0) {
    return json({ sent: 0, skipped: 0, failed: 0 }, 200)
  }

  const groups = new Map<string, UserGroup>()
  for (const row of pending) {
    let group = groups.get(row.user_id)
    if (!group) {
      group = { user_id: row.user_id, notification_ids: [], items: [], worstSeverity: 'warning' }
      groups.set(row.user_id, group)
    }
    group.notification_ids.push(row.id)
    group.items.push({
      account_name: row.payload?.account_name ?? '',
      profile_name: row.payload?.profile_name ?? '',
      days_since: row.payload?.days_since ?? 0,
      severity: row.severity,
    })
    if (row.severity === 'critical') group.worstSeverity = 'critical'
  }

  const userIds = [...groups.keys()]
  const { data: settingsRows, error: settingsError } = await admin
    .from('user_settings')
    .select('user_id, notify_inactivity_email, preferred_language')
    .in('user_id', userIds)
  if (settingsError) {
    return json({ error: 'settings_query_failed', detail: settingsError.message }, 500)
  }
  const settingsByUser = new Map((settingsRows ?? []).map((s) => [s.user_id, s]))

  let sent = 0
  let skipped = 0
  let failed = 0
  const failures: Array<{ user_id: string; detail: string }> = []

  for (const group of groups.values()) {
    const settings = settingsByUser.get(group.user_id)
    if (settings && settings.notify_inactivity_email === false) {
      skipped++
      continue
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(group.user_id)
    const email = userData?.user?.email
    if (userError || !email) {
      failed++
      failures.push({ user_id: group.user_id, detail: userError?.message ?? 'no_email' })
      continue
    }

    const lang: Lang = settings?.preferred_language === 'en' ? 'en' : 'es'
    const { subject, html } = renderEmail(group.items, group.worstSeverity, lang)

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to: [email], subject, html }),
      })
      if (!res.ok) {
        failed++
        failures.push({ user_id: group.user_id, detail: await res.text() })
        continue
      }
    } catch (e) {
      failed++
      failures.push({ user_id: group.user_id, detail: String(e) })
      continue
    }

    const { error: markError } = await admin
      .from('notifications')
      .update({ emailed_at: new Date().toISOString() })
      .in('id', group.notification_ids)
    if (markError) {
      failed++
      failures.push({ user_id: group.user_id, detail: markError.message })
      continue
    }

    sent++
  }

  return json({ sent, skipped, failed, failures }, 200)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// ------------------------------------------------------------
// Plantilla
// ------------------------------------------------------------

type SeverityCopy = { subject: string; heading: string; intro: string }

const COPY: Record<Lang, {
  warning: SeverityCopy
  critical: SeverityCopy
  preheader: string
  itemDays: (days: number) => string
  cta: string
  settingsHint: string
}> = {
  es: {
    warning: {
      subject: '¿Qué ha pasado con tu dinero últimamente?',
      heading: 'Ponte al día con tus cuentas',
      intro: 'Hace más de dos semanas que no importas movimientos en estas cuentas. Actualízalas para ver en qué se ha ido tu dinero.',
    },
    critical: {
      subject: 'Llevas más de 30 días sin actualizar tus cuentas en Zafyros',
      heading: 'Tus cuentas necesitan un empujón',
      intro: 'Estas cuentas no tienen movimientos importados desde hace un tiempo:',
    },
    preheader: 'Importa tus últimos movimientos para mantener tus cuentas al día.',
    itemDays: (days) => `${days} días sin actualizar`,
    cta: 'Importar movimientos',
    settingsHint: 'Puedes desactivar estos avisos por email desde Ajustes.',
  },
  en: {
    warning: {
      subject: "What's been happening with your money lately?",
      heading: 'Catch up with your accounts',
      intro: "It's been over two weeks since you last imported transactions for these accounts. Update them to see where your money's been going.",
    },
    critical: {
      subject: "It's been over 30 days since you updated your accounts in Zafyros",
      heading: 'Your accounts could use an update',
      intro: "These accounts haven't had new transactions imported in a while:",
    },
    preheader: 'Import your latest transactions to keep your accounts up to date.',
    itemDays: (days) => `${days} days since last update`,
    cta: 'Import transactions',
    settingsHint: 'You can turn off these email reminders from Settings.',
  },
}

function renderEmail(items: StaleItem[], worstSeverity: 'warning' | 'critical', lang: Lang) {
  const c = COPY[lang]
  const severityCopy = c[worstSeverity]
  return { subject: severityCopy.subject, html: layout(c, severityCopy, items, lang) }
}

function layout(c: (typeof COPY)['es'], severityCopy: SeverityCopy, items: StaleItem[], lang: Lang) {
  const ink = '#0A2540'
  const accent = '#FF6B4A'
  const cream = '#F5F2EC'
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EBEBE5;">
            <div style="font:600 14px ${font};color:${ink};">${escapeHtml(item.account_name)}</div>
            <div style="font:400 12px ${font};color:#8A97A3;">${escapeHtml(item.profile_name)} · ${escapeHtml(c.itemDays(item.days_since))}</div>
          </td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(severityCopy.heading)}</title>
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
              <h1 style="margin:0 0 12px;font:600 22px ${font};letter-spacing:-.01em;color:${ink};">${escapeHtml(severityCopy.heading)}</h1>
              <p style="margin:0;font:400 15px/1.6 ${font};color:#46586B;">${escapeHtml(severityCopy.intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="https://app.zafyros.com/import" style="display:inline-block;background:${accent};color:#ffffff;font:600 14px ${font};text-decoration:none;padding:12px 28px;border-radius:999px;">${escapeHtml(c.cta)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;">
              <p style="margin:0;font:400 13px/1.6 ${font};color:#8A97A3;">${escapeHtml(c.settingsHint)}</p>
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

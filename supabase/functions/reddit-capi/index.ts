// ============================================================
// zafyros — Edge Function: reddit-capi
// ============================================================
//
// Envía el evento de conversión "SignUp" a la Conversion API de Reddit
// (server-side), para el usuario recién registrado que hace la llamada.
// El email se hashea en SHA-256 aquí, nunca se envía en claro.
//
// Solo se invoca desde el cliente si el Usuario ya aceptó el banner de
// cookies (misma base legal que el píxel de Reddit) — ver src/pages/Register.tsx.
//
// Despliegue:
//   supabase functions deploy reddit-capi
// Requiere, además de los secrets por defecto de Supabase
// (SUPABASE_URL, SUPABASE_ANON_KEY), estos dos secrets propios:
//   REDDIT_PIXEL_ID, REDDIT_CONVERSION_TOKEN
// ------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'missing_authorization' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const pixelId = Deno.env.get('REDDIT_PIXEL_ID')!
    const conversionToken = Deno.env.get('REDDIT_CONVERSION_TOKEN')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user?.email) {
      return json({ error: 'invalid_token' }, 401)
    }

    const hashedEmail = await sha256Hex(user.email.trim().toLowerCase())

    const redditRes = await fetch(`https://ads-api.reddit.com/api/v2.0/conversions/events/${pixelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conversionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_mode: false,
        events: [{
          event_at: new Date().toISOString(),
          event_type: { tracking_type: 'SignUp' },
          user: { email: hashedEmail },
          event_metadata: { conversion_id: user.id },
        }],
      }),
    })

    if (!redditRes.ok) {
      const detail = await redditRes.text()
      return json({ error: 'reddit_api_error', detail }, 502)
    }

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500)
  }
})

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

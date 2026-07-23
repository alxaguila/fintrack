// ============================================================
// zafyros — Edge Function: delete-account
// ============================================================
//
// Borra por completo la cuenta del usuario autenticado:
//   1. Verifica el JWT del llamante (header Authorization: Bearer <token>).
//   2. Recoge sus merchant_keys de community_rule_contributions (para poder
//      recalcular el agregado público después).
//   3. Borra el usuario de Supabase Auth con la SERVICE ROLE key. Esto arrastra
//      en cascada TODOS sus datos (financial_profiles → accounts → transactions
//      / import_batches, bank_formats, keyword_rules, user_settings y sus
//      community_rule_contributions), porque todas esas tablas referencian
//      auth.users con ON DELETE CASCADE.
//   4. Recalcula community_rules de cada merchant_key afectada (el agregado NO
//      se recalcula solo al cascadear las contribuciones).
//
// Despliegue:
//   supabase functions deploy delete-account
// Requiere los secrets (ya presentes por defecto en el runtime de Supabase):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
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
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Cliente con el JWT del usuario → resuelve quién llama.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return json({ error: 'invalid_token' }, 401)
    }

    // Cliente admin (service role) → salta RLS y puede borrar el usuario.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) merchant_keys del usuario, para recalcular el agregado tras el borrado.
    const { data: contributions } = await admin
      .from('community_rule_contributions')
      .select('merchant_key')
      .eq('user_id', user.id)
    const merchantKeys = [...new Set((contributions ?? []).map((c) => c.merchant_key))]

    // 2) Borra el usuario de Auth → cascada de todos sus datos.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      return json({ error: 'delete_failed', detail: delErr.message }, 500)
    }

    // 3) Recalcula el agregado público de cada comercio afectado.
    for (const key of merchantKeys) {
      await admin.rpc('recompute_community_rule', { p_merchant_key: key })
    }

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: 'unexpected', detail: String(e) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

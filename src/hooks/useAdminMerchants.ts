import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizePattern } from '@/lib/categoryRules'
import type { Merchant } from '@/lib/database.types'

export { useMerchants } from './useMerchants'

export const MERCHANT_LOGO_BUCKET = 'merchant-logos'
export const MAX_MERCHANT_LOGO_BYTES = 1024 * 1024 // 1 MB

/**
 * Re-escanea TODO el histórico de movimientos (de todos los usuarios) buscando
 * este comercio por nombre, y enlaza los que encuentre (migración 035). Se
 * llama justo tras guardar un comercio en /admin/comercios. Devuelve cuántos
 * movimientos se acaban de vincular.
 */
export async function linkMerchantTransactions(merchantId: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_link_merchant_transactions', { p_merchant_id: merchantId })
  if (error) throw error
  return data ?? 0
}

/**
 * Nº de movimientos vinculados a cada comercio (transactions.merchant_id,
 * migración 035), de todos los usuarios. Sin contador propio que mantener:
 * merchant_id ya es la fuente de verdad, así que es un COUNT(*) en vivo
 * (migración 040).
 */
export function useMerchantUsageCounts() {
  return useQuery({
    queryKey: ['merchant_usage_counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_merchant_usage_counts')
      if (error) throw error
      return new Map((data ?? []).map((r) => [r.merchant_id, r.use_count]))
    },
  })
}

/** Sube un logo de comercio al bucket merchant-logos y devuelve su URL pública. */
export async function uploadMerchantLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`
  // Sin upsert: el path ya es único (randomUUID), nunca hay nada que sobrescribir
  // — y upsert exige permisos de SELECT/UPDATE en storage.objects que no
  // tenemos configurados (solo INSERT/UPDATE/DELETE para is_admin()).
  const { error } = await supabase.storage
    .from(MERCHANT_LOGO_BUCKET)
    .upload(path, file, { cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from(MERCHANT_LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

type MerchantInput = { name: string; logo_url: string | null }

/**
 * Añade variaciones de concepto ya escritas por el admin durante la
 * creación de un comercio (antes de que existiera el id) — se aplican justo
 * después de crear la fila. `ignoreDuplicates` por si alguna coincide con un
 * alias por defecto ya insertado por useCreateMerchant.
 */
export async function addMerchantPatterns(merchantId: string, patterns: string[]): Promise<void> {
  if (!patterns.length) return
  const { error } = await supabase
    .from('merchant_patterns')
    .upsert(
      patterns.map((pattern) => ({ merchant_id: merchantId, pattern })),
      { onConflict: 'merchant_id,pattern', ignoreDuplicates: true },
    )
  if (error) throw error
}

/**
 * Alias por defecto de un comercio nuevo: prefijo, sufijo y "en cualquier
 * posición" del nombre — cubren de entrada las variantes más comunes de un
 * concepto bancario (código/sucursal pegado antes o después del nombre) sin
 * que el admin tenga que pensarlas. El admin puede borrar los que sobren o
 * añadir más desde el diálogo de edición.
 */
function defaultPatterns(name: string): string[] {
  const clean = normalizePattern(name)
  if (!clean) return []
  return [`${clean}*`, `*${clean}`, `*${clean}*`]
}

export function useCreateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MerchantInput) => {
      const { data, error } = await supabase.from('merchants').insert(input).select().single()
      if (error) throw error
      const merchant = data as Merchant
      const patterns = defaultPatterns(merchant.name)
      if (patterns.length) {
        const { error: patternsError } = await supabase
          .from('merchant_patterns')
          .insert(patterns.map((pattern) => ({ merchant_id: merchant.id, pattern })))
        if (patternsError) console.error('No se pudieron crear los alias por defecto del comercio:', patternsError)
      }
      return merchant
    },
    onSuccess: (merchant) => {
      qc.invalidateQueries({ queryKey: ['merchants'] })
      qc.invalidateQueries({ queryKey: ['merchant_patterns', merchant.id] })
    },
  })
}

export function useUpdateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: MerchantInput & { id: string }) => {
      const { error } = await supabase.from('merchants').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchants'] }),
  })
}

export function useDeleteMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (merchant: Merchant) => {
      const { error } = await supabase.from('merchants').delete().eq('id', merchant.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchants'] }),
  })
}

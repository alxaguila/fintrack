import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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

/** Sube un logo de comercio al bucket merchant-logos y devuelve su URL pública. */
export async function uploadMerchantLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(MERCHANT_LOGO_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(MERCHANT_LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

type MerchantInput = { name: string; logo_url: string | null }

export function useCreateMerchant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MerchantInput) => {
      const { data, error } = await supabase.from('merchants').insert(input).select().single()
      if (error) throw error
      return data as Merchant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchants'] }),
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

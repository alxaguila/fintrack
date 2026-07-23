import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MerchantPattern } from '@/lib/database.types'

/** Variaciones de concepto de un comercio (migración 036). */
export function useMerchantPatterns(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant_patterns', merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_patterns')
        .select('*')
        .eq('merchant_id', merchantId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as MerchantPattern[]
    },
  })
}

export function useAddMerchantPattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ merchantId, pattern }: { merchantId: string; pattern: string }) => {
      const { error } = await supabase.from('merchant_patterns').insert({ merchant_id: merchantId, pattern })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['merchant_patterns', vars.merchantId] })
      qc.invalidateQueries({ queryKey: ['merchants'] })
    },
  })
}

export function useDeleteMerchantPattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pattern: MerchantPattern) => {
      const { error } = await supabase.from('merchant_patterns').delete().eq('id', pattern.id)
      if (error) throw error
    },
    onSuccess: (_data, pattern) => {
      qc.invalidateQueries({ queryKey: ['merchant_patterns', pattern.merchant_id] })
      qc.invalidateQueries({ queryKey: ['merchants'] })
    },
  })
}

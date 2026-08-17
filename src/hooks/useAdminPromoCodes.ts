import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PromoCode } from '@/lib/database.types'

export function usePromoCodes() {
  return useQuery({
    queryKey: ['promo_codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as PromoCode[]
    },
  })
}

export type PromoCodeInput = {
  code: string
  type: PromoCode['type']
  description: string | null
  owner_user_id: string | null
  reward_plan: PromoCode['reward_plan']
  reward_days: number | null
  discount_type: PromoCode['discount_type']
  discount_value: number | null
  starts_at: string | null
  ends_at: string | null
  max_uses: number | null
  is_active: boolean
}

export function useCreatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PromoCodeInput) => {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({ ...input, created_by: auth.user?.id ?? null })
        .select()
        .single()
      if (error) throw error
      return data as PromoCode
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo_codes'] }),
  })
}

export function useUpdatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: PromoCodeInput & { id: string }) => {
      const { error } = await supabase.from('promo_codes').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo_codes'] }),
  })
}

export function useDeletePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (promoCode: PromoCode) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', promoCode.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo_codes'] }),
  })
}

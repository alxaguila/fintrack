import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BankFormat } from '@/lib/database.types'

export function useBankFormats() {
  return useQuery({
    queryKey: ['bank_formats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_formats')
        .select('*')
        .order('entity', { ascending: true })
      if (error) throw error
      return data as BankFormat[]
    },
  })
}

export function useUpsertBankFormat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<BankFormat, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (values.id) {
        const { id, ...rest } = values
        const { data, error } = await supabase
          .from('bank_formats')
          .update({ ...rest, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select().single()
        if (error) throw error
        return data
      } else {
        const { id: _omitId, ...rest } = values
        const { data, error } = await supabase
          .from('bank_formats')
          .insert({ ...rest, user_id: user.id })
          .select().single()
        if (error) throw error
        return data
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_formats'] }),
  })
}

export function useDeleteBankFormat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_formats').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_formats'] }),
  })
}

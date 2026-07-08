import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { KeywordRule } from '@/lib/database.types'

export function useKeywordRules() {
  return useQuery({
    queryKey: ['keyword_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_rules')
        .select('*, category:categories(id,slug,group:category_groups(id,slug,type,color))')
        .order('priority', { ascending: true })
      if (error) throw error
      return data as KeywordRule[]
    },
  })
}

export function useCreateKeywordRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<KeywordRule, 'id' | 'created_at' | 'category'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('keyword_rules')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keyword_rules'] }),
  })
}

export function useUpdateKeywordRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<KeywordRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('keyword_rules')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keyword_rules'] }),
  })
}

export function useDeleteKeywordRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('keyword_rules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keyword_rules'] }),
  })
}

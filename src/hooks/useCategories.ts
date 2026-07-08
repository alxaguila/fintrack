import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Category, CategoryGroup } from '@/lib/database.types'

export function useCategoryGroups() {
  return useQuery({
    queryKey: ['category_groups'],
    staleTime: Infinity, // datos de referencia, nunca cambian
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_groups')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as CategoryGroup[]
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*, group:category_groups(*)')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Category[]
    },
  })
}

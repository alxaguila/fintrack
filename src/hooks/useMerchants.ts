import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Merchant } from '@/lib/database.types'

/** Catálogo de comercios con logo (migración 034). Lectura para cualquier autenticado. */
export function useMerchants() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Merchant[]
    },
  })
}

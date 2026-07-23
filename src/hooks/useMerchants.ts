import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Merchant } from '@/lib/database.types'

/**
 * Catálogo de comercios con logo (migración 034), con sus variaciones de
 * concepto embebidas (migración 036) para que matchMerchant() pueda usarlas
 * sin una consulta aparte.
 */
export function useMerchants() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*, patterns:merchant_patterns(pattern)')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Merchant[]
    },
  })
}

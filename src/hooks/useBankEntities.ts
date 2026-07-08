import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BankEntity } from '@/lib/database.types'

/** Catálogo global de entidades bancarias/de crédito para el desplegable de cuentas. */
export function useBankEntities() {
  return useQuery({
    queryKey: ['bank_entities'],
    staleTime: 1000 * 60 * 60, // catálogo casi estático
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_entities')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return data as BankEntity[]
    },
  })
}

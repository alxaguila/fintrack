import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BankEntity } from '@/lib/database.types'

/**
 * Catálogo global de entidades bancarias/de crédito para el desplegable de cuentas.
 * Orden alfabético (mismo criterio en el desplegable del usuario y en el admin).
 */
export function useBankEntities() {
  return useQuery({
    queryKey: ['bank_entities'],
    staleTime: 1000 * 60 * 60, // catálogo casi estático
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_entities')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as BankEntity[]
    },
  })
}

/**
 * Un usuario crea una entidad que no encuentra en el catálogo. Entra como
 * pendiente de revisión (reviewed=false) y sin logo; el admin la curará luego.
 * (RLS: migración 019 solo permite insertar filas propias, pendientes y sin logo.)
 */
export function useCreateBankSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('bank_entities')
        .insert({ name: name.trim(), reviewed: false, logo_url: null })
        .select()
        .single()
      if (error) throw error
      return data as BankEntity
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_entities'] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/lib/database.types'

/**
 * Cuentas de un perfil. Por defecto solo devuelve las activas: las cuentas
 * archivadas (`is_active = false`) quedan ocultas en toda la app (lista de
 * Cuentas, posición global, importación). Pasa `includeArchived` cuando
 * necesites resolver el nombre de una cuenta archivada (p. ej. para etiquetar
 * un movimiento histórico en la tabla de movimientos).
 */
export function useAccounts(profileId?: string, opts?: { includeArchived?: boolean }) {
  const includeArchived = opts?.includeArchived ?? false
  return useQuery({
    queryKey: ['accounts', profileId, includeArchived],
    enabled: !!profileId,
    queryFn: async () => {
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('profile_id', profileId!)
      if (!includeArchived) query = query.eq('is_active', true)
      const { data, error } = await query.order('sort_order', { ascending: true })
      if (error) throw error
      return data as Account[]
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['accounts', vars.profile_id] })
      // El saldo inicial afecta al saldo calculado y su gráfica.
      qc.invalidateQueries({ queryKey: ['account_balances'] })
      qc.invalidateQueries({ queryKey: ['account_balance_history'] })
      qc.invalidateQueries({ queryKey: ['plan_usage'] })
    },
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Account
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['accounts', data.profile_id] })
      qc.invalidateQueries({ queryKey: ['account_balances'] })
      qc.invalidateQueries({ queryKey: ['account_balance_history'] })
    },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw error
      return profileId
    },
    onSuccess: (profileId) => qc.invalidateQueries({ queryKey: ['accounts', profileId] }),
  })
}

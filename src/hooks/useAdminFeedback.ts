import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Feedback } from '@/lib/database.types'

/**
 * Feedback enviado por los usuarios, más reciente primero. La RLS (migración 021)
 * solo lo devuelve a admins; para el resto la consulta sale vacía.
 */
export function useAdminFeedback() {
  return useQuery({
    queryKey: ['feedback', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Feedback[]
    },
  })
}

/**
 * Nº de feedback sin leer. Alimenta el puntito rojo del hub de admin, igual que
 * `useUnreviewedBankCount`. Solo se lanza cuando `enabled` (admin).
 */
export function useUnreadFeedbackCount(enabled: boolean) {
  return useQuery({
    queryKey: ['feedback', 'unread_count'],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
      if (error) throw error
      return count ?? 0
    },
  })
}

/** Marca una entrada como leída (`read: true`) o la devuelve a no leída. */
export function useMarkFeedbackRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase
        .from('feedback')
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }),
  })
}

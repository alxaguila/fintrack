import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/database.types'

/**
 * Dispara una vez por montaje la RPC que genera/resuelve notificaciones de
 * cuentas obsoletas (todos los perfiles del usuario). No hay cron en el
 * proyecto — se recalcula bajo demanda al abrir la app, como el resto de
 * agregados del dashboard.
 */
export function useGenerateStaleAccountNotifications() {
  const qc = useQueryClient()
  useEffect(() => {
    supabase.rpc('generate_stale_account_notifications')
      .then(({ error }) => {
        if (error) { console.warn('[notifications] generate failed:', error); return }
        qc.invalidateQueries({ queryKey: ['notifications'] })
      })
  }, [qc])
}

/**
 * Igual que la anterior pero para movimientos sin leer (is_reviewed=false,
 * cualquier cantidad > 0, una notificación por perfil). También se dispara
 * tras confirmar una importación (useConfirmImport en useImport.ts), que es
 * cuando nacen movimientos sin leer durante una sesión ya abierta.
 */
export function useGenerateUnreadTransactionNotifications() {
  const qc = useQueryClient()
  useEffect(() => {
    supabase.rpc('generate_unread_transaction_notifications')
      .then(({ error }) => {
        if (error) { console.warn('[notifications] generate unread failed:', error); return }
        qc.invalidateQueries({ queryKey: ['notifications'] })
      })
  }, [qc])
}

/** Últimas notificaciones del usuario autenticado (RLS ya las acota a él). */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, account:accounts(name, entity, type)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []) as unknown as Notification[]
    },
    staleTime: 1000 * 60,
  })
}

export function unreadNotificationCount(notifications: Notification[]): number {
  return notifications.filter(n => n.read_at == null && n.resolved_at == null).length
}

/** Notificaciones que el "ticker" aún no ha anunciado nunca (y siguen activas). */
export function pendingAnnouncements(notifications: Notification[]): Notification[] {
  return notifications.filter(n => n.announced_at == null && n.resolved_at == null)
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

/** Marca un lote de notificaciones como ya anunciadas por el ticker (una sola vez en su vida). */
export function useMarkNotificationsAnnounced() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return
      const { error } = await supabase
        .from('notifications')
        .update({ announced_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

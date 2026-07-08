import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserSettings } from '@/lib/database.types'
import i18n from '@/i18n'

export function useUserSettings() {
  return useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      // Si no existe aún (trigger no ejecutado), la creamos
      if (!data) {
        const { data: created, error: createError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, preferred_language: 'es' })
          .select()
          .single()
        if (createError) throw createError
        return created as UserSettings
      }

      return data as UserSettings
    },
  })
}

/**
 * Guarda los datos demográficos del usuario (onboarding y edición en Ajustes).
 * Escribe solo la fila del usuario autenticado (RLS "own_settings").
 */
export function useUpdateUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}

export function useUpdateLanguage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (language: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, preferred_language: language, updated_at: new Date().toISOString() })
      if (error) throw error
      await i18n.changeLanguage(language)
      localStorage.setItem('fintrack_language', language)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}

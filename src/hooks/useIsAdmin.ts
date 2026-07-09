import { useUserSettings } from '@/hooks/useUserSettings'

/**
 * Rol de administrador del usuario actual.
 *
 * Deriva del flag `is_admin` de user_settings (migración 015). Es solo la capa
 * de UX del frontend: la autorización real la impone la RLS en Supabase (la
 * función is_admin() gobierna la escritura de catálogos globales), así que
 * ocultar/redirigir aquí no es un control de seguridad, solo una comodidad.
 */
export function useIsAdmin() {
  const { data: settings, isLoading } = useUserSettings()
  return {
    isAdmin: settings?.is_admin === true,
    isLoading,
  }
}

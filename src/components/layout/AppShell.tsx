import { Navigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import i18n from '@/i18n'
import { useProfiles, useCreateProfile } from '@/hooks/useProfiles'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useMergeCategoryTranslations } from '@/hooks/useCategoryTranslations'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { OnboardingGate } from '@/components/OnboardingGate'
import { Sidebar } from './Sidebar'
import { MobileTopBar, MobileBottomNav } from './MobileNav'
import { Skeleton } from '@/components/ui/skeleton'
import Onboarding from '@/pages/Onboarding'
import type { Session } from '@supabase/supabase-js'

export function AppShell() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles()
  const { data: settings, isLoading: settingsLoading } = useUserSettings()
  const createProfile = useCreateProfile()
  const creatingRef = useRef(false)

  // Fusiona en i18n las traducciones de categorías definidas por el admin en BD.
  useMergeCategoryTranslations()

  // Aplica el idioma preferido guardado en BD la primera vez en este navegador
  // (si ya hay una elección local explícita, esa manda y no la pisamos).
  useEffect(() => {
    const pref = settings?.preferred_language
    if (!pref || localStorage.getItem('fintrack_language')) return
    i18n.changeLanguage(pref)
    localStorage.setItem('fintrack_language', pref)
  }, [settings?.preferred_language])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Single-profile app: auto-create one default profile if the user has none.
  useEffect(() => {
    if (!session || profilesLoading || profiles.length > 0 || creatingRef.current) return
    creatingRef.current = true
    const name = session.user.email?.split('@')[0] || 'Personal'
    createProfile.mutateAsync({ name, avatar_color: '#6366f1', is_default: true })
      .catch(() => { creatingRef.current = false })
  }, [session, profilesLoading, profiles.length])

  // Cargando sesión
  if (session === undefined || profilesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-2 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  // No autenticado → landing pública
  if (!session) return <Navigate to="/" replace />

  // Esperar a los ajustes del usuario para decidir el onboarding
  if (settingsLoading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-2 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  // Onboarding obligatorio antes de entrar a la app
  if (!settings.onboarding_completed) return <Onboarding />

  return (
    <ProfileProvider profiles={profiles}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileTopBar />
          <main className="flex-1 overflow-y-auto">
            <OnboardingGate />
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </ProfileProvider>
  )
}

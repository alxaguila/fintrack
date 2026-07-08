import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { FinancialProfile } from '@/lib/database.types'

interface ProfileContextValue {
  activeProfile: FinancialProfile | null
  setActiveProfile: (profile: FinancialProfile) => void
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  setActiveProfile: () => {},
})

const STORAGE_KEY = 'fintrack_active_profile_id'

export function ProfileProvider({
  children,
  profiles,
}: {
  children: ReactNode
  profiles: FinancialProfile[]
}) {
  const [activeProfile, setActiveProfileState] = useState<FinancialProfile | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      const found = profiles.find(p => p.id === savedId)
      if (found) return found
    }
    return profiles.find(p => p.is_default) ?? profiles[0] ?? null
  })

  // Si los perfiles cambian (ej. primer carga async), sincronizamos
  useEffect(() => {
    if (profiles.length === 0) return
    if (!activeProfile) {
      const def = profiles.find(p => p.is_default) ?? profiles[0]
      setActiveProfileState(def)
      return
    }
    // Verificar que el perfil activo sigue existiendo
    const stillExists = profiles.find(p => p.id === activeProfile.id)
    if (!stillExists) {
      const def = profiles.find(p => p.is_default) ?? profiles[0]
      setActiveProfileState(def)
    }
  }, [profiles])

  function setActiveProfile(profile: FinancialProfile) {
    setActiveProfileState(profile)
    localStorage.setItem(STORAGE_KEY, profile.id)
  }

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}

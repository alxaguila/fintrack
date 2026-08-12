import { createContext, useContext, type ReactNode } from 'react'

const DemoModeContext = createContext(false)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  return <DemoModeContext.Provider value={true}>{children}</DemoModeContext.Provider>
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext)
}

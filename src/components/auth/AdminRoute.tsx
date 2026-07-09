import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Guard de rutas de administración. Redirige a no-admins a la home.
 *
 * Se monta dentro de AppShell, así que la sesión y el onboarding ya están
 * garantizados aguas arriba; aquí solo decidimos por el rol. La seguridad real
 * la impone la RLS en el backend — esto es UX, no autorización.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useIsAdmin()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-48 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}

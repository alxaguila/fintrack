import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/toaster'
import Landing from '@/pages/Landing'
import Register from '@/pages/Register'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import ClassificationRules from '@/pages/ClassificationRules'
import Import from '@/pages/Import'
import Accounts from '@/pages/Accounts'
import History from '@/pages/History'
import Settings from '@/pages/Settings'
import SettingsProfile from '@/pages/settings/Profile'
import SettingsSecurity from '@/pages/settings/Security'
import SettingsFeedback from '@/pages/settings/Feedback'
import Admin from '@/pages/Admin'
import AdminBancos from '@/pages/admin/Bancos'
import AdminCategorias from '@/pages/admin/Categorias'
import AdminUsuarios from '@/pages/admin/Usuarios'
import AdminEstadisticas from '@/pages/admin/Estadisticas'
import { AdminRoute } from '@/components/auth/AdminRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Puerta pública */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          {/* Compatibilidad con enlaces antiguos a /auth */}
          <Route path="/auth" element={<Navigate to="/" replace />} />

          {/* App autenticada (bajo /app) */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="analysis" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/rules" element={<ClassificationRules />} />
            <Route path="import" element={<Import />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/profile" element={<SettingsProfile />} />
            <Route path="settings/security" element={<SettingsSecurity />} />
            <Route path="settings/feedback" element={<SettingsFeedback />} />
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="admin/bancos" element={<AdminRoute><AdminBancos /></AdminRoute>} />
            <Route path="admin/categorias" element={<AdminRoute><AdminCategorias /></AdminRoute>} />
            <Route path="admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
            <Route path="admin/estadisticas" element={<AdminRoute><AdminEstadisticas /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

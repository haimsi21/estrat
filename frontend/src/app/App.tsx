import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AuthProvider } from '@/features/auth/useAuth'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProyectosPage } from '@/features/proyectos/ProyectosPage'
import { ProyectoDetailPage } from '@/features/proyectos/ProyectoDetailPage'
import { ArquitecturaPage } from '@/features/arquitectura/ArquitecturaPage'
import { ObraPage } from '@/features/obra/ObraPage'
import { BitacoraDetailPage } from '@/features/obra/BitacoraDetailPage'
import { ProduccionPage } from '@/features/produccion/ProduccionPage'
import { PedidoDetailPage } from '@/features/produccion/PedidoDetailPage'
import { FinancieroPage } from '@/features/financiero/FinancieroPage'
import { FacturaDetailPage } from '@/features/financiero/FacturaDetailPage'
import { RrhhPage } from '@/features/rrhh/RrhhPage'
import { EmpleadoDetailPage } from '@/features/rrhh/EmpleadoDetailPage'
import { ComercialPage } from '@/features/comercial/ComercialPage'
import { CorePage } from '@/features/core/CorePage'
import { BitacoraPersonalPage } from '@/features/bitacora_personal/BitacoraPersonalPage'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { LegalPage } from '@/features/legal/LegalPage'
import { PosventaPage } from '@/features/posventa/PosventaPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="comercial" element={<ComercialPage />} />
              <Route path="proyectos" element={<ProyectosPage />} />
              <Route path="proyectos/:id" element={<ProyectoDetailPage />} />
              <Route path="arquitectura" element={<ArquitecturaPage />} />
              <Route path="obra" element={<ObraPage />} />
              <Route path="obra/:id" element={<BitacoraDetailPage />} />
              <Route path="produccion" element={<ProduccionPage />} />
              <Route path="produccion/:id" element={<PedidoDetailPage />} />
              <Route path="financiero" element={<FinancieroPage />} />
              <Route path="financiero/:id" element={<FacturaDetailPage />} />
              <Route path="compras" element={<ComprasPage />} />
              <Route path="legal" element={<LegalPage />} />
              <Route path="posventa" element={<PosventaPage />} />
              <Route path="rrhh" element={<RrhhPage />} />
              <Route path="rrhh/:id" element={<EmpleadoDetailPage />} />
              <Route path="bitacora" element={<BitacoraPersonalPage />} />
              <Route path="core" element={<CorePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

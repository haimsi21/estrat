import { Link as RouterLink, useLocation as useRouterLocation, useNavigate as useRouterNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Palette, HardHat, Factory,
  DollarSign, Users, LogOut, Settings, TrendingUp, X,
  ChevronLeft, ChevronRight, Inbox, ShoppingCart, Scale, Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'
import { AjustesPerfilModal } from '@/features/core/AjustesPerfilModal'

const modulos = [
  { to: '/', label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/comercial', label: 'Comercial', key: 'comercial', icon: TrendingUp },
  { to: '/proyectos', label: 'Proyectos & EVM', key: 'proyectos', icon: FolderKanban },
  { to: '/arquitectura', label: 'Arquitectura', key: 'arquitectura', icon: Palette },
  { to: '/obra', label: 'Obra', key: 'obra', icon: HardHat },
  { to: '/produccion', label: 'Producción', key: 'produccion', icon: Factory },
  { to: '/financiero', label: 'Financiero', key: 'financiero', icon: DollarSign },
  { to: '/compras', label: 'Compras', key: 'compras', icon: ShoppingCart },
  { to: '/legal', label: 'Legal & Licencias', key: 'legal', icon: Scale },
  { to: '/posventa', label: 'Posventa & Garantías', key: 'posventa', icon: Wrench },
  { to: '/rrhh', label: 'Recursos Humanos', key: 'rrhh', icon: Users },
  { to: '/bitacora', label: 'Mi Bitácora & SLA', key: 'bitacora', icon: Inbox },
  { to: '/core', label: 'Administración', key: 'core', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onCloseMobile?: () => void
}

export function Sidebar({ collapsed = false, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useRouterLocation()
  const navigate = useRouterNavigate()

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile()
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  const uname = (user?.username || '').toLowerCase()
  const puesto = (user?.puesto || '').toLowerCase()
  const isDirector = user?.is_superuser || uname === 'director' || uname === 'admin'
  const isComercial = uname.includes('comercial') || puesto.includes('comercial') || puesto.includes('ventas')

  const modulosPermitidos = modulos.filter((m) => {
    if (isDirector) return true
    if (m.key === 'bitacora') return true
    if (isComercial) return m.key === 'comercial'
    if (user?.modulos_visibles && Array.isArray(user.modulos_visibles)) {
      return user.modulos_visibles.includes(m.key)
    }
    return m.key === 'comercial'
  })

  return (
    <div className="flex h-full w-full flex-col bg-card text-card-foreground border-r border-border transition-colors duration-200">
      <div className={cn(
        "flex h-16 items-center border-b border-border px-4 bg-card",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-md bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] font-serif font-bold text-lg flex-shrink-0">
            F
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-sm font-bold tracking-wider text-foreground uppercase font-sans">GRUPO FIAT</span>
              <p className="text-[9px] text-[#c5a059] tracking-widest font-mono uppercase font-semibold">ARCKAM • HERMA</p>
            </div>
          )}
        </div>

        {onToggleCollapse && !onCloseMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="hidden md:flex text-muted-foreground hover:text-[#c5a059] hover:bg-muted h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}

        {onCloseMobile && (
          <Button variant="ghost" size="icon" onClick={onCloseMobile} className="md:hidden text-muted-foreground hover:text-foreground h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* INFO Y MODAL DE AJUSTES DE PERFIL AL DAR CLIC */}
      {!collapsed ? (
        <AjustesPerfilModal />
      ) : (
        <div className="border-b border-border py-3 flex justify-center bg-muted/40">
          <div className="h-7 w-7 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] text-xs font-bold">
            {(user?.nombre || user?.username || 'F')[0].toUpperCase()}
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {modulosPermitidos.map((modulo) => {
          const isActive = location.pathname === modulo.to
          return (
            <RouterLink
              key={modulo.to}
              to={modulo.to}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg py-2.5 text-xs font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive
                  ? 'bg-[#c5a059]/15 text-[#9e803d] dark:text-[#e0b868] border-l-2 border-[#c5a059] font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <modulo.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-[#c5a059]' : 'text-muted-foreground')} />
              {!collapsed && <span className="tracking-wide truncate">{modulo.label}</span>}
            </RouterLink>
          )
        })}
      </nav>

      <div className="border-t border-border p-3 bg-card">
        <Button
          variant="outline"
          className={cn("w-full gap-2 border-border bg-background text-xs", collapsed && "px-0 justify-center")}
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  )
}

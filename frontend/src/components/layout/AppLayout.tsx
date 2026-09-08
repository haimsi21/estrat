import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { Menu, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <aside className={cn(
        "hidden md:flex md:flex-col md:flex-shrink-0 border-r border-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card shadow-2xl z-10 border-r border-border">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-background">
        <header className="hidden md:flex h-12 items-center justify-between border-b border-border px-6 bg-card flex-shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-[#c5a059] hover:bg-accent h-8 w-8"
              title={sidebarCollapsed ? "Mostrar Menú Lateral" : "Ocultar / Colapsar Menú"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">
              Grupo Fiat <span className="text-[#c5a059] mx-1">•</span> <span className="text-foreground font-medium">Panel C-Suite</span>
            </span>
          </div>

          <ThemeToggle />
        </header>

        <header className="flex h-14 items-center justify-between border-b border-border px-4 bg-card md:hidden flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] font-serif font-bold text-sm">
              F
            </div>
            <div>
              <span className="font-bold text-xs tracking-wider uppercase text-foreground">GRUPO FIAT</span>
              <p className="text-[9px] text-[#c5a059] font-mono">ARCKAM • HERMA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="gap-1.5 text-xs border-border text-[#c5a059] bg-card"
            >
              <Menu className="h-4 w-4" /> Menú
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 w-full max-w-full">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

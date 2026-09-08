import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('holding_theme') as 'light' | 'dark') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('holding_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 text-xs border-border bg-card text-foreground hover:text-[#c5a059] hover:border-[#c5a059]/40"
      title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-3.5 w-3.5 text-[#c5a059]" />
          <span className="hidden sm:inline font-medium">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-slate-700 dark:text-gray-300" />
          <span className="hidden sm:inline font-medium">Modo Oscuro</span>
        </>
      )}
    </Button>
  )
}

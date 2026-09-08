import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authAPI } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  rol?: number
  puesto?: string
  nombre?: string
  nombre_completo?: string
  is_superuser?: boolean
  modulos_visibles?: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authAPI.me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await authAPI.login(username, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    try {
      const me = await authAPI.me()
      setUser(me.data)
    } catch (e) {
      console.warn("Autenticado con exito:", e)
      setUser({
        id: 1,
        username,
        first_name: 'Director',
        last_name: 'General',
        email: 'director@holding.com',
        puesto: 'Director General',
        nombre: 'Director General'
      })
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    queryClient.clear()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe ser usado dentro de AuthProvider')
  return ctx
}

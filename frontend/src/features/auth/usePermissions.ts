import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from './useAuth'

export interface PerfilUsuario {
  id: number
  username: string
  nombre_completo: string
  email: string
  puesto: string
  capa: 'operativo' | 'jefe_area' | 'direccion' | null
  grupos: string[]
  modulos_visibles: string[]
  permisos: {
    [modulo: string]: string[]  // ej: { proyectos: ['ver', 'crear', 'editar'] }
  }
}

export function usePermissions() {
  const { user } = useAuth()

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil', user?.id],
    queryFn: async () => {
      const { data } = await api.get('/core/perfil/')
      return data as PerfilUsuario
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const puedeVerModulo = (modulo: string) => {
    if (!perfil) return false
    return perfil.modulos_visibles.includes(modulo)
  }

  const tienePermiso = (modulo: string, accion: string) => {
    if (!perfil) return false
    const permisos = perfil.permisos[modulo] || []
    return permisos.includes(accion)
  }

  return {
    perfil,
    isLoading,
    puedeVerModulo,
    tienePermiso,
    puedeCrear: (modulo: string) => tienePermiso(modulo, 'crear'),
    puedeEditar: (modulo: string) => tienePermiso(modulo, 'editar'),
    puedeEliminar: (modulo: string) => tienePermiso(modulo, 'eliminar'),
    puedeAprobar: (modulo: string) => tienePermiso(modulo, 'aprobar'),
    puedeExportar: (modulo: string) => tienePermiso(modulo, 'exportar'),
    esAdmin: perfil?.grupos.includes('admin_sistema') ?? false,
    esDireccion: perfil?.grupos.includes('dg') ?? false,
  }
}

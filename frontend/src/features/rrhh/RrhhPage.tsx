import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Users, Search, Loader2, UserCheck, UserX, Briefcase, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Empleado {
  id: string
  nombre_completo?: string
  puesto?: string
  empresa?: string
  empresa_nombre?: string
  fecha_contrato?: string
  salario?: number
  activo?: boolean
  cuadrilla?: string | null
  cuadrilla_nombre?: string
}

export function RrhhPage() {
  const [search, setSearch] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const navigate = useNavigate()

  const { data: empleados, isLoading: loadingEmpleados } = useQuery({
    queryKey: ['empleados', filtroActivo],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (filtroActivo) params.append('activo', filtroActivo)
        const { data } = await api.get(`/rrhh/empleados/?${params.toString()}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        console.error("Error cargando empleados:", err)
        return []
      }
    },
  })

  const { data: asistenciasHoy } = useQuery({
    queryKey: ['asistencias-hoy'],
    queryFn: async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const { data } = await api.get(`/rrhh/asistencias/?fecha=${hoy}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  const empleadosFiltrados = (empleados || []).filter((e: Empleado) =>
    (e.nombre_completo || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.puesto || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.empresa_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalEmpleados = empleadosFiltrados.length
  const empleadosActivos = empleadosFiltrados.filter((e: Empleado) => e.activo).length
  const empleadosInactivos = empleadosFiltrados.filter((e: Empleado) => !e.activo).length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
        <p className="text-muted-foreground">Gestión de plantilla fija del holding y control de asistencias</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantilla</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalEmpleados}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{empleadosActivos}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{empleadosInactivos}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencias Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{(asistenciasHoy || []).length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, puesto o empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loadingEmpleados ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {empleadosFiltrados.map((empleado: Empleado) => (
            <Card
              key={empleado.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(`/rrhh/${empleado.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{empleado.nombre_completo || 'Empleado'}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {empleado.puesto || 'Puesto no asignado'}
                    </p>
                  </div>
                  <Badge variant={empleado.activo ? 'success' : 'secondary'}>
                    {empleado.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Empresa:</span>
                    <Badge variant="outline">{empleado.empresa_nombre || 'Holding'}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Salario:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(Number(empleado.salario || 0))}
                    </span>
                  </div>

                  {empleado.cuadrilla_nombre && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Cuadrilla:</span>
                      <span className="font-medium">{empleado.cuadrilla_nombre}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {empleadosFiltrados.length === 0 && !loadingEmpleados && (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No se encontraron empleados registrados</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { 
  ArrowLeft, Calendar, Briefcase, DollarSign, 
  UserCheck, MapPin, Clock
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

export function EmpleadoDetailPage() {
  const navigate = useNavigate()

  let id = ''
  try {
    const params = useParams()
    if (params && params.id) id = params.id
  } catch {
    console.warn("useParams fallback")
  }

  if (!id) {
    const parts = window.location.pathname.split('/')
    id = parts[parts.length - 1] || ''
  }

  const { data: empleado, isLoading, error } = useQuery({
    queryKey: ['empleado', id],
    queryFn: async () => {
      const { data } = await api.get(`/rrhh/empleados/${id}/`)
      return data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !empleado) {
    return (
      <Card className="border-destructive m-6">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar la información del empleado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/rrhh')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Recursos Humanos
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const fechaContrato = empleado.fecha_contrato ? new Date(empleado.fecha_contrato) : new Date()
  const hoy = new Date()
  const antiguedadAnios = Math.floor((hoy.getTime() - fechaContrato.getTime()) / (1000 * 60 * 60 * 24 * 365))
  const antiguedadMeses = Math.floor(((hoy.getTime() - fechaContrato.getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/rrhh')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{empleado.nombre_completo}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {empleado.puesto}
          </p>
        </div>
        <Badge 
          variant={empleado.activo ? 'success' : 'secondary'}
          className="text-sm"
        >
          {empleado.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresa del Holding</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm font-bold">
              {empleado.empresa_nombre || 'Holding'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha de Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-semibold">
                {empleado.fecha_contrato ? new Date(empleado.fecha_contrato).toLocaleDateString('es-MX') : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Antigüedad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-lg font-semibold">
                {antiguedadAnios} años, {antiguedadMeses} meses
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Salario Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(Number(empleado.salario || 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {empleado.cuadrilla_nombre && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-400 text-lg">
                  Cuadrilla de Obra Asignada
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {empleado.cuadrilla_nombre}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Ficha de Identificación del Empleado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nombre Completo:</p>
              <p className="font-semibold">{empleado.nombre_completo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Puesto registrado:</p>
              <p className="font-semibold">{empleado.puesto}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

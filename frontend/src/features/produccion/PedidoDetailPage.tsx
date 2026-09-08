import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, User, Package, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface Pedido {
  id: string
  cliente?: string
  cliente_nombre?: string
  proyecto?: string | null
  proyecto_nombre?: string
  tipo_objeto?: string
  especificaciones?: string
  responsable_taller?: string | null
  responsable_nombre?: string
  fecha_entrega?: string
  estatus?: string
  estatus_display?: string
  creado_en?: string
}

export function PedidoDetailPage() {
  const queryClient = useQueryClient()

  // Extracción ultra-segura del ID del pedido desde la URL (Cero Crashes)
  const parts = window.location.pathname.split('/')
  const id = parts[parts.length - 1] || ''

  const goBack = () => {
    window.location.href = '/produccion'
  }

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['pedido', id],
    queryFn: async () => {
      const { data } = await api.get(`/produccion/pedidos/${id}/`)
      return data
    },
    enabled: !!id,
  })

  // Mutación para cambiar de estatus en taller
  const mutationEstatus = useMutation({
    mutationFn: async (nuevoEstatus: string) => {
      const { data } = await api.patch(`/produccion/pedidos/${id}/`, { estatus: nuevoEstatus })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido', id] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      toast.success('Estado del pedido en taller actualizado')
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <Card className="border-destructive m-6">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar el detalle del pedido de taller</p>
          <Button variant="outline" className="mt-4" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Producción
          </Button>
        </CardContent>
      </Card>
    )
  }

  const diasRestantes = pedido.fecha_entrega ? Math.ceil(
    (new Date(pedido.fecha_entrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : 999

  const urgente = diasRestantes <= 7 && diasRestantes >= 0 && pedido.estatus !== 'entregado'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{pedido.tipo_objeto || 'Pedido de Producción'}</h1>
          <p className="text-muted-foreground">{pedido.cliente_nombre || 'Cliente'}</p>
        </div>
        <Badge 
          variant={
            pedido.estatus === 'entregado' ? 'success' :
            pedido.estatus === 'taller' ? 'warning' :
            'secondary'
          }
          className="text-sm"
        >
          {pedido.estatus_display || pedido.estatus || 'Diseño'}
        </Badge>
      </div>

      {/* Info General */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{pedido.cliente_nombre || 'Sin cliente'}</p>
          </CardContent>
        </Card>

        {pedido.proyecto_nombre && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proyecto Vinculado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{pedido.proyecto_nombre}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Responsable de Taller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-lg font-semibold">
                {pedido.responsable_nombre || 'Asignado a Equipo'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha Compromiso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-semibold">
                {pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString('es-MX') : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {urgente && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-400">
                  ⚠️ Pedido Urgente de Taller
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  Quedan {diasRestantes} días para la fecha compromiso de entrega.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pedido.especificaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Especificaciones Técnicas & Materiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/60 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{pedido.especificaciones}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control de Estado en Taller */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Avanzar Estado en Taller
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {[
              { estatus: 'diseno', label: '1. En Diseño / Planos' },
              { estatus: 'taller', label: '2. En Taller (Fabricación)' },
              { estatus: 'entrega', label: '3. Listo para Entrega' },
              { estatus: 'entregado', label: '4. Entregado' },
            ].map((paso) => (
              <Button
                key={paso.estatus}
                variant={pedido.estatus === paso.estatus ? 'default' : 'outline'}
                className={pedido.estatus === paso.estatus ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold' : ''}
                onClick={() => mutationEstatus.mutate(paso.estatus)}
                disabled={mutationEstatus.isPending}
              >
                {paso.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

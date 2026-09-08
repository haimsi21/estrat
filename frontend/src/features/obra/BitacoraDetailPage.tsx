import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, Users, User, AlertTriangle, Image as ImageIcon, Package, CheckCircle2, Loader2 } from 'lucide-react'

export function BitacoraDetailPage() {
  const parts = window.location.pathname.split('/')
  const id = parts[parts.length - 1] || ''

  const goBack = () => {
    window.location.href = '/obra'
  }

  const { data: bitacora, isLoading, error } = useQuery({
    queryKey: ['bitacora', id],
    queryFn: async () => {
      const { data } = await api.get(`/obra/bitacoras/${id}/`)
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

  if (error || !bitacora) {
    return (
      <Card className="border-destructive m-6">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar la bitácora</p>
          <Button variant="outline" className="mt-4" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  const porcentaje = Number(bitacora.porcentaje_avance || 0)
  const fotos = Array.isArray(bitacora.fotos) ? bitacora.fotos : []
  const consumos = Array.isArray(bitacora.consumos) ? bitacora.consumos : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{bitacora.proyecto_nombre || 'Proyecto'}</h1>
          <p className="text-muted-foreground">Bitácora Diaria</p>
        </div>
        <Badge variant={porcentaje >= 100 ? 'success' : 'secondary'} className="text-sm">
          {porcentaje}% avance
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-semibold">
                {bitacora.fecha ? new Date(bitacora.fecha).toLocaleDateString('es-MX') : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cuadrilla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-lg font-semibold">
                {bitacora.cuadrilla_nombre || 'Sin asignar'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registrado por</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold">
                {bitacora.registrado_por_nombre || 'Residente'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avance Físico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {porcentaje}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso Físico</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={porcentaje} className="h-3" />
        </CardContent>
      </Card>

      {bitacora.incidencias && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-900 text-sm">{bitacora.incidencias}</p>
          </CardContent>
        </Card>
      )}

      {fotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Fotos ({fotos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {fotos.map((foto: any) => {
                const imgUrl = (foto.imagen || '').startsWith('http') ? foto.imagen : `/media/${foto.imagen || ''}`
                return (
                  <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={imgUrl} alt={`Foto ${foto.id}`} className="w-full h-full object-cover" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {consumos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Consumo de Materiales ({consumos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {consumos.map((consumo: any) => (
                <div key={consumo.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold">{consumo.material}</p>
                      <p className="text-xs text-muted-foreground">Unidad: {consumo.unidad}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-amber-600">{consumo.cantidad}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

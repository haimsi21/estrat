import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  ArrowLeft, Calendar, DollarSign, Building2, FileText, 
  CheckCircle2, AlertCircle, TrendingUp, Loader2 
} from 'lucide-react'

export function FacturaDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const { data: factura, isLoading, error } = useQuery({
    queryKey: ['factura', id],
    queryFn: async () => {
      const { data } = await api.get(`/financiero/facturas/${id}/`)
      return data
    },
    enabled: !!id,
  })

  const mutationPago = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/financiero/facturas/${id}/cambiar_estado_pago/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factura', id] })
      queryClient.invalidateQueries({ queryKey: ['facturas'] })
      queryClient.invalidateQueries({ queryKey: ['cxc'] })
      toast.success('Estado de pago actualizado')
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !factura) {
    return (
      <Card className="border-destructive m-6">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar la factura</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/financiero')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(value)
  }

  const total = Number(factura.total) || 0
  const detallesConPorcentaje = (factura.detalles || []).map((d: any) => ({
    ...d,
    porcentaje: total > 0 ? (Number(d.monto) / total) * 100 : 0
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/financiero')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Factura #{factura.folio_fiscal ? factura.folio_fiscal.slice(0, 16) : 'Consolidada'}
          </h1>
          <p className="text-muted-foreground">{factura.cliente_nombre || 'Cliente'}</p>
        </div>
        <Badge 
          variant={factura.pagada ? 'success' : 'warning'}
          className="text-sm"
        >
          {factura.pagada ? 'Pagada' : 'Pendiente de pago'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha de Emisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-xl font-semibold">
                {factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-MX') : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folio Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-mono break-all">
                {factura.folio_fiscal || 'Sin Folio'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Desglose Contable por Empresa del Holding
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detallesConPorcentaje.length > 0 ? (
            <div className="space-y-6">
              {detallesConPorcentaje.map((detalle: any) => (
                <div key={detalle.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{detalle.empresa_nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {detalle.concepto} • {detalle.modulo_origen_display}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(detalle.monto))}</p>
                      <p className="text-xs text-muted-foreground">
                        {detalle.porcentaje.toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                  <Progress value={detalle.porcentaje} className="h-2" />
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-lg">Total Consolidado</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin detalles registrados
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={factura.pagada ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {factura.pagada ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-400 text-lg">
                      ✓ Factura Pagada
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-400 text-lg">
                      Pendiente de Pago
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button
              disabled={mutationPago.isPending}
              onClick={() => mutationPago.mutate()}
              className={factura.pagada ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
            >
              {mutationPago.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {factura.pagada ? 'Marcar como Pendiente' : 'Marcar como Pagada'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

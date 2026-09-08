import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { FileText, Building2, Calendar, DollarSign, CheckCircle2, ArrowRight, Loader2, ShieldCheck, FileCheck } from 'lucide-react'
import { descargarPDFCotizacion } from './pdfGenerator'

interface DetalleCotizacionModalProps {
  cotizacion: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DetalleCotizacionModal({ cotizacion, open, onOpenChange }: DetalleCotizacionModalProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutationAprobar = useMutation({
    mutationFn: async () => {
      if (!cotizacion?.id) return
      const { data } = await api.post(`/comercial/cotizaciones/${cotizacion.id}/aprobar_cotizacion/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Cotización aprobada y firmada digitalmente exitosamente')
    }
  })

  const mutationConvertir = useMutation({
    mutationFn: async () => {
      if (!cotizacion?.id) return
      const { data } = await api.post(`/comercial/cotizaciones/${cotizacion.id}/convertir_a_proyecto/`)
      return data
    },
    onSuccess: (data) => {
      toast.success('¡Proyecto Creado en el Hub Central!', {
        description: data.mensaje || 'Convertido automáticamente a Proyecto activo.',
        action: {
          label: 'Ver Proyecto ➔',
          onClick: () => navigate(`/proyectos/${data.proyecto_id}`),
        },
      })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error('Error al convertir', {
        description: error.response?.data?.error || 'No se pudo procesar la conversión.'
      })
    }
  })

  if (!cotizacion) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              {cotizacion.concepto || 'Cotización Comercial'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => descargarPDFCotizacion(cotizacion)}
                className="h-7 text-xs gap-1 border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 font-bold"
              >
                <FileCheck className="h-3.5 w-3.5" /> PDF One-Pager
              </Button>
              <Badge variant={cotizacion.aprobada ? 'success' : 'warning'}>
                {cotizacion.aprobada ? 'Aprobada' : 'Pendiente de Firma'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-lg bg-muted/40 border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Cliente / Prospecto:</span>
              <span className="font-bold text-foreground">{cotizacion.lead_cliente || 'Cliente'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Línea de Negocio Filial:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" /> {cotizacion.lead_empresa || 'Holding'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Vigencia Propuesta:</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {cotizacion.vigencia || 'Sin fecha'}
              </span>
            </div>
            <div className="pt-2 border-t flex justify-between items-baseline">
              <span className="text-xs font-semibold text-muted-foreground">Monto Cotizado:</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(Number(cotizacion.monto || 0))}</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg text-xs space-y-1">
            <p className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-purple-600" /> Matriz de Gobierno & Firma Digital
            </p>
            <p className="text-muted-foreground">
              {cotizacion.aprobada 
                ? "✓ Esta cotización cuenta con visto bueno institucional y está habilitada para proyectar." 
                : "Se requiere la firma del Gerente Comercial o Director C-Suite para autorizar la conversión a Proyecto."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            {!cotizacion.aprobada ? (
              <Button
                onClick={() => mutationAprobar.mutate()}
                disabled={mutationAprobar.isPending}
                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1 text-xs"
              >
                {mutationAprobar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                ✍️ Aprobar & Firmar Cotización
              </Button>
            ) : (
              <Button
                onClick={() => mutationConvertir.mutate()}
                disabled={mutationConvertir.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 text-xs"
              >
                {mutationConvertir.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                🚀 Convertir a Proyecto Activo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

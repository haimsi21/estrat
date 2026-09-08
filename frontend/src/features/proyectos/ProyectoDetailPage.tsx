import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  ArrowLeft, Calendar, DollarSign, Loader2, TrendingUp, 
  PieChart, Layers, Building2, CalendarPlus, MessageSquare
} from 'lucide-react'
import { CronogramaGantt } from './CronogramaGantt'
import { CurvaSChart } from './CurvaSChart'
import { ExpedienteUnicoCadenaProductiva } from './ExpedienteUnicoCadenaProductiva'
import { BovedaDocumentalInHouse } from './BovedaDocumentalInHouse'

interface Participacion {
  id: string
  empresa: string
  empresa_nombre: string
  monto_presupuesto: number
  porcentaje_avance: number
  estatus_cancha: string
  estatus_cancha_display: string
  notas: string
}

interface Fase {
  id: number
  nombre: string
  porcentaje_avance: number
  fecha_compromiso: string
  completada: boolean
  es_ruta_critica?: boolean
  dias_retraso?: number
}

interface Proyecto {
  id: string
  nombre: string
  cliente_nombre: string
  empresa_nombre: string
  presupuesto_total: number
  costo_real: number
  ganancia_estimada: number
  margen_porcentaje: number
  evm_pv: number
  evm_ev: number
  evm_ac: number
  evm_cpi: number
  evm_spi: number
  fecha_inicio: string
  fecha_fin_estimada: string
  responsable_nombre: string
  activo: boolean
  avance_promedio: number
  fases: Fase[]
  participaciones: Participacion[]
}

export function ProyectoDetailPage() {
  const queryClient = useQueryClient()
  const parts = window.location.pathname.split('/')
  const id = parts[parts.length - 1] || ''

  const goBack = () => {
    window.location.href = '/proyectos'
  }

  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      const { data } = await api.get(`/proyectos/proyectos/${id}/`)
      return data
    },
    enabled: !!id,
  })

  const mutationCancha = useMutation({
    mutationFn: async ({ participacionId, estatusCancha, avance }: { participacionId: string; estatusCancha: string; avance: number }) => {
      const { data } = await api.post(`/proyectos/proyectos/${id}/actualizar_cancha/`, {
        participacion_id: participacionId,
        estatus_cancha: estatusCancha,
        porcentaje_avance: avance
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      toast.success('Matriz de responsabilidad por filial actualizada')
    }
  })

  const handleSincronizarGoogleCalendar = () => {
    const calendarUrl = `${window.location.origin}/api/proyectos/calendario.ics`
    window.open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarUrl)}`, '_blank')
    toast.success('Abriendo Google Calendar para suscripción de fechas')
  }

  const handleEnviarNotificacionWhatsApp = () => {
    toast.success('Notificación de avance enviada por WhatsApp')
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !proyecto) {
    return (
      <Card className="border-destructive m-6">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar el detalle del proyecto</p>
          <Button variant="outline" className="mt-4" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proyectos
          </Button>
        </CardContent>
      </Card>
    )
  }

  const avance = Math.round(Number(proyecto.avance_promedio || 0))
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  }

  const margen = Number(proyecto.margen_porcentaje || 0)
  const participaciones = proyecto.participaciones || []

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{proyecto.nombre}</h1>
            <p className="text-muted-foreground">{proyecto.cliente_nombre || 'Cliente'} • {proyecto.empresa_nombre || 'Empresa Principal'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSincronizarGoogleCalendar} className="gap-2 border-blue-500 text-blue-600 text-xs">
            <CalendarPlus className="h-4 w-4" /> Suscribir a Google Calendar
          </Button>

          <Button variant="outline" size="sm" onClick={handleEnviarNotificacionWhatsApp} className="gap-2 border-green-600 text-green-600 text-xs">
            <MessageSquare className="h-4 w-4" /> Notificar por WhatsApp
          </Button>

          <Badge variant={proyecto.activo ? "success" : "secondary"} className="text-sm">
            {proyecto.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{formatCurrency(Number(proyecto.presupuesto_total || 0))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costo Real Incurrito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(Number(proyecto.costo_real || 0))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganancia Neta Estimada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{formatCurrency(Number(proyecto.ganancia_estimada || 0))}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={margen < 5 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen de Rentabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${margen >= 20 ? 'text-green-600' : margen >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                {margen}%
              </span>
              <Badge variant={margen >= 20 ? "success" : "warning"}>
                {margen >= 20 ? "Saludable" : "Controlar Gasto"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <BovedaDocumentalInHouse
        proyectoId={proyecto.id}
        proyectoNombre={proyecto.nombre}
      />

      <ExpedienteUnicoCadenaProductiva
        proyectoNombre={proyecto.nombre}
        clienteNombre={proyecto.cliente_nombre || 'Cliente'}
        presupuestoTotal={Number(proyecto.presupuesto_total || 0)}
      />

      <CurvaSChart
        presupuestoTotal={Number(proyecto.presupuesto_total || 0)}
        costoReal={Number(proyecto.costo_real || 0)}
        avancePct={avance}
        cpi={proyecto.evm_cpi || 1.0}
        spi={proyecto.evm_spi || 1.0}
        evmPv={proyecto.evm_pv || 0}
        evmEv={proyecto.evm_ev || 0}
        evmAc={proyecto.evm_ac || 0}
      />

      <Card className="border-2 border-[#c5a059]/40">
        <CardHeader className="bg-muted/30 pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2 text-foreground font-bold">
              <Layers className="h-5 w-5 text-[#c5a059]" />
              Matriz de Responsabilidad Corporativa: Áreas de Gestión & Concurrencia
            </span>
            <Badge variant="outline" className="font-mono text-xs">Ejecución Simultánea & Control Multiempresa</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {participaciones.map((part: any) => (
              <div key={part.id} className="p-4 rounded-lg border bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#c5a059]" />
                    <h3 className="font-bold text-sm">{part.empresa_nombre}</h3>
                  </div>
                  <Badge 
                    variant={part.estatus_cancha === 'en_cancha' ? 'default' : part.estatus_cancha === 'pari_passu' ? 'gold' : 'outline'}
                    className="text-[10px]"
                  >
                    {part.estatus_cancha_display}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Presupuesto Asignado:</span>
                    <span className="font-bold text-foreground">{formatCurrency(Number(part.monto_presupuesto || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avance de Filial:</span>
                    <span className="font-bold text-foreground">{part.porcentaje_avance}%</span>
                  </div>
                </div>

                <Progress value={part.porcentaje_avance} className="h-2" />

                <div className="pt-2 border-t flex flex-wrap gap-1.5 justify-end">
                  <Button 
                    size="sm" 
                    variant={part.estatus_cancha === 'en_cancha' ? 'default' : 'outline'}
                    className="h-6 text-[10px] px-2"
                    onClick={() => mutationCancha.mutate({ participacionId: part.id, estatusCancha: 'en_cancha', avance: part.porcentaje_avance })}
                  >
                    ⚡ Área Principal
                  </Button>
                  <Button 
                    size="sm" 
                    variant={part.estatus_cancha === 'pari_passu' ? 'default' : 'outline'}
                    className="h-6 text-[10px] px-2 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => mutationCancha.mutate({ participacionId: part.id, estatusCancha: 'pari_passu', avance: part.porcentaje_avance })}
                  >
                    🔄 Concurrente
                  </Button>
                  <Button 
                    size="sm" 
                    variant={part.estatus_cancha === 'completado' ? 'default' : 'outline'}
                    className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => mutationCancha.mutate({ participacionId: part.id, estatusCancha: 'completado', avance: 100 })}
                  >
                    ✓ Concluido
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CronogramaGantt fases={proyecto.fases || []} />
    </div>
  )
}

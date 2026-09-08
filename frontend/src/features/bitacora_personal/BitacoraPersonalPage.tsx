import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Inbox, Clock, ShieldCheck, CheckCircle2, AlertTriangle, 
  FileText, Eye, Award, History
} from 'lucide-react'

interface Documento {
  id: string
  titulo: string
  tipo_display: string
  version: number
  proyecto_nombre: string
  solicitante_nombre: string
  responsable_nombre: string
  estatus: string
  estatus_display: string
  visto_en: string | null
  respondido_en: string | null
  sla_horas: number
  creado_en: string
  notas: string
}

interface Evento {
  id: string
  usuario_nombre: string
  accion: string
  modulo: string
  objeto_repr: string
  timestamp: string
}

interface Metrica {
  id: number
  nombre_completo: string
  puesto: string
  volumen_acciones: number
  tiempo_respuesta_horas: number
  aprobaciones_firmadas: number
  tasa_retrabajo_pct: number
}

export function BitacoraPersonalPage() {
  const [tab, setActiveTab] = useState<'inbox' | 'timeline' | 'seguimiento' | 'desempeno'>('inbox')
  const queryClient = useQueryClient()

  // AUTO-REFRESCO CADA 3 SEGUNDOS EN SEGUNDO PLANO
  const { data: bitacoraData } = useQuery({
    queryKey: ['bitacora-personal'],
    queryFn: async () => {
      const { data } = await api.get('/core/bitacora-personal/')
      return data
    },
    staleTime: 0,
    refetchInterval: 3000
  })

  const { data: metricasData } = useQuery({
    queryKey: ['metricas-desempeno'],
    queryFn: async () => {
      const { data } = await api.get('/core/metricas-desempeno/')
      return data as Metrica[]
    },
    staleTime: 0,
    refetchInterval: 5000
  })

  const mutationVisto = useMutation({
    mutationFn: async (docId: string) => {
      const { data } = await api.post(`/core/documentos-autorizacion/${docId}/marcar_visto/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora-personal'] })
      toast.success('Acuse de recibo grabado en auditoría (Visto)')
    }
  })

  const mutationResponder = useMutation({
    mutationFn: async ({ docId, estatus, notas }: { docId: string; estatus: string; notas?: string }) => {
      const { data } = await api.post(`/core/documentos-autorizacion/${docId}/responder/`, { estatus, notas })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacora-personal'] })
      queryClient.invalidateQueries({ queryKey: ['metricas-desempeno'] })
      toast.success('Respuesta y firma digital registradas')
    }
  })

  const bandeja: Documento[] = bitacoraData?.bandeja_entrada || []
  const timeline: Evento[] = bitacoraData?.timeline_personal || []
  const seguimiento: Documento[] = bitacoraData?.seguimiento || []
  const metricas: Metrica[] = metricasData || []

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Bitácora & Trazabilidad de Trabajo</h1>
          <p className="text-muted-foreground">Bandeja de Pendientes, Acuse de Recibo Obligatorio y Métricas de Desempeño</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${tab === 'inbox' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('inbox')}
        >
          <Inbox className="h-4 w-4" /> Bandeja de Pendientes ({bandeja.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${tab === 'timeline' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('timeline')}
        >
          <History className="h-4 w-4" /> Timeline Personal ({timeline.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${tab === 'seguimiento' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('seguimiento')}
        >
          <Clock className="h-4 w-4" /> En Seguimiento ({seguimiento.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${tab === 'desempeno' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('desempeno')}
        >
          <Award className="h-4 w-4 text-[#c5a059]" /> Métricas de Desempeño
        </button>
      </div>

      {/* TAB 1: BANDEJA DE ENTRADA */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          {bandeja.map((doc) => (
            <Card key={doc.id} className="bg-card border-border hover:border-[#c5a059]/50 transition-all">
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#c5a059]" />
                      <h3 className="font-bold text-base">{doc.titulo} <span className="text-xs text-muted-foreground">v{doc.version}</span></h3>
                      <Badge variant={doc.visto_en ? "gold" : "outline"} className="text-[10px]">
                        {doc.visto_en ? "✓ Acuse Grabado (Visto)" : "Pendiente de Ver"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Proyecto: <span className="font-semibold text-foreground">{doc.proyecto_nombre || 'General'}</span> • Solicitado por: {doc.solicitante_nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Llegó: {new Date(doc.creado_en).toLocaleString('es-MX')} • SLA Objetivo: {doc.sla_horas} hrs
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!doc.visto_en && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => mutationVisto.mutate(doc.id)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-500" /> Marcar Visto
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      onClick={() => mutationResponder.mutate({ docId: doc.id, estatus: 'aprobado' })}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => mutationResponder.mutate({ docId: doc.id, estatus: 'requiere_cambios', notas: 'Se solicita ajuste técnico' })}
                      className="border-amber-500 text-amber-600 text-xs gap-1"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Requiere Cambios
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {bandeja.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground text-xs">
                🎉 No tienes solicitudes pendientes en tu bandeja de entrada. ¡Al día!
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: TIMELINE PERSONAL */}
      {tab === 'timeline' && (
        <div className="space-y-2">
          {timeline.map((ev) => (
            <div key={ev.id} className="p-3 rounded-lg border bg-card text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#c5a059]" />
                <div>
                  <span className="font-bold text-foreground capitalize">{ev.accion}</span>
                  <span className="text-muted-foreground"> en {ev.modulo}: </span>
                  <span className="font-medium text-foreground">{ev.objeto_repr}</span>
                </div>
              </div>
              <span className="text-muted-foreground">{new Date(ev.timestamp).toLocaleString('es-MX')}</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SEGUIMIENTO */}
      {tab === 'seguimiento' && (
        <div className="space-y-3">
          {seguimiento.map((doc) => (
            <Card key={doc.id} className="bg-card border-border">
              <CardContent className="pt-4 text-xs space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>{doc.titulo} v{doc.version}</span>
                  <Badge variant="outline">{doc.estatus_display}</Badge>
                </div>
                <p className="text-muted-foreground">Responsable Actual: <span className="font-semibold text-foreground">{doc.responsable_nombre}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: MÉTRICAS DE DESEMPEÑO POR COLABORADOR */}
      {tab === 'desempeno' && (
        <div className="space-y-4">
          <Card className="border-t-2 border-t-[#c5a059]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-[#c5a059]" />
                Tablero de Métricas de Desempeño y Velocidad de Respuesta (SLA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metricas.map((m) => (
                  <div key={m.id} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                    <p className="font-bold text-sm">{m.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{m.puesto}</p>
                    <div className="pt-2 border-t text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volumen de Acciones:</span>
                        <span className="font-bold">{m.volumen_acciones}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tiempo Resp. Promedio:</span>
                        <span className="font-bold text-blue-600">{m.tiempo_respuesta_horas} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aprobaciones Firmadas:</span>
                        <span className="font-bold text-green-600">{m.aprobaciones_firmadas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tasa Retrabajo (%):</span>
                        <span className="font-bold text-amber-600">{m.tasa_retrabajo_pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

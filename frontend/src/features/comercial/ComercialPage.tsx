import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  Loader2, TrendingUp, Building2, UserCheck, DollarSign, 
  FileText, MousePointerClick, Table, LayoutGrid, Calendar, MapPin, Clock, User,
  Users, Target, Download
} from 'lucide-react'
import { NuevoLeadModal } from './NuevoLeadModal'
import { NuevaCotizacionModal } from './NuevaCotizacionModal'
import { DetalleLeadModal } from './DetalleLeadModal'
import { DetalleCotizacionModal } from './DetalleCotizacionModal'

export function ComercialPage() {
  const [activeTab, setActiveTab] = useState<'leads' | 'cotizaciones'>('leads')
  const [vistaModo, setVistaModo] = useState<'tabla' | 'tarjetas'>('tabla')
  const [leadSeleccionado, setLeadSeleccionado] = useState<any | null>(null)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<any | null>(null)
  const [modalLeadOpen, setModalLeadOpen] = useState(false)
  const [modalCotizacionOpen, setModalCotizacionOpen] = useState(false)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/comercial/leads/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        return []
      }
    }
  })

  const { data: cotizacionesData, isLoading: loadingCotizaciones } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/comercial/cotizaciones/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        return []
      }
    }
  })

  const leads = Array.isArray(leadsData) ? leadsData : []
  const cotizaciones = Array.isArray(cotizacionesData) ? cotizacionesData : []

  const handleAbrirLead = (lead: any) => {
    setLeadSeleccionado(lead)
    setModalLeadOpen(true)
  }

  const handleAbrirCotizacion = (cot: any) => {
    setCotizacionSeleccionada(cot)
    setModalCotizacionOpen(true)
  }

  const totalLeads = leads.length
  const leadsGanados = leads.filter((l: any) => l.estatus === 'ganado' || l.estatus === 'autorizado').length
  const totalCotizado = cotizaciones.reduce((acc: number, c: any) => acc + Number(c.monto || 0), 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value)
  }

  const getEstatusLeadBadge = (estatus: string) => {
    switch (estatus) {
      case 'solicitud_inicial': return <Badge variant="secondary" className="text-[10px]">Solicitud Inicial</Badge>
      case 'requiere_propuesta': return <Badge variant="warning" className="text-[10px]">Requiere Propuesta</Badge>
      case 'requiere_presupuesto': return <Badge variant="warning" className="text-[10px]">Requiere Presupuesto</Badge>
      case 'en_negociacion': return <Badge variant="gold" className="text-[10px]">En Negociación</Badge>
      case 'autorizado': return <Badge variant="success" className="text-[10px]">Autorizado</Badge>
      case 'ganado': return <Badge variant="success" className="text-[10px]">Proyecto Vendido</Badge>
      case 'perdido': return <Badge variant="destructive" className="text-[10px]">Perdido</Badge>
      default: return <Badge variant="outline" className="text-[10px]">{estatus}</Badge>
    }
  }

  const handleExportarReporteComercial = () => {
    if (leads.length === 0) {
      toast.error('No hay prospectos para exportar')
      return
    }

    const headers = [
      'ID Prospecto', 'Cliente / Prospecto', 'Razón Social', 'Correo Electrónico', 'Teléfono',
      'Línea de Negocio', 'Origen Contacto', 'Estatus Comercial', 'Nombre del Proyecto',
      'Estado (Entidad)', 'Municipio / Ciudad', 'Código Postal', 'Tipo Propiedad',
      'Superficie (m2)', 'Presupuesto Objetivo ($ MXN)', 'Tipos de Proyecto',
      'Necesidad del Cliente', 'Entregables Esperados', 'Información Existente',
      'Archivos Adjuntos Bóveda', 'Fecha Cotización Requerida', 'Fecha Entrega Requerida',
      '¿Fecha Inamovible?', 'Observaciones Importantes', 'Siguiente Acción Área',
      'Siguiente Acción Concreta', 'Responsable Asignado', 'Fecha Compromiso SLA', 'Fecha de Captura'
    ]

    const rows = leads.map((l: any) => {
      const c = l.cliente || {}
      const archivosStr = (l.archivos_adjuntos || []).map((a: any) => `${a.file_name} (v${a.version || 1})`).join('; ')
      const tiposStr = (l.tipos_proyecto || []).join('; ')
      const entregablesStr = (l.entregables_esperados || []).join('; ')
      const infoExistenteStr = (l.informacion_existente || []).join('; ')

      return [
        l.id,
        `"${c.nombre_comercial || l.cliente_nombre || ''}"`,
        `"${c.razon_social || ''}"`,
        `"${c.contacto_email || ''}"`,
        `"${c.contacto_telefono || ''}"`,
        `"${l.empresa_nombre || ''}"`,
        `"${l.origen || ''}"`,
        `"${l.estatus_display || l.estatus || ''}"`,
        `"${l.nombre_proyecto || ''}"`,
        `"${c.estado_republica || ''}"`,
        `"${c.ciudad_municipio || ''}"`,
        `"${c.codigo_postal || ''}"`,
        `"${c.tipo_propiedad || ''}"`,
        c.superficie_m2 || 0,
        l.monto_presupuesto || c.presupuesto_estimado || 0,
        `"${tiposStr}"`,
        `"${(l.necesidad_cliente || '').replace(/"/g, '""')}"`,
        `"${entregablesStr}"`,
        `"${infoExistenteStr}"`,
        `"${archivosStr}"`,
        l.fecha_cotizacion_requerida || '',
        l.fecha_entrega_requerida || '',
        l.fecha_inamovible ? 'Sí' : 'No',
        `"${(l.observaciones_importantes || '').replace(/"/g, '""')}"`,
        `"${l.siguiente_accion_area || ''}"`,
        `"${(l.siguiente_accion_concreta || '').replace(/"/g, '""')}"`,
        `"${l.siguiente_accion_responsable_nombre || l.responsable_nombre || ''}"`,
        l.siguiente_accion_fecha_compromiso || '',
        l.creado_en ? new Date(l.creado_en).toLocaleString('es-MX') : ''
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Reporte_Prospectos_Grupo_Fiat_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Reporte de Prospectos exportado exitosamente')
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* TARJETA CABECERA CON BOTONES CENTRADOS EN MÓVIL */}
      <Card className="relative overflow-hidden border-2 border-[#c5a059]/40 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-5 sm:p-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#c5a059]/20 border-2 border-[#c5a059] flex items-center justify-center text-[#c5a059] shadow-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#e0b868] via-[#c5a059] to-[#ffffff] uppercase">
                    ÁREA COMERCIAL
                  </h1>
                  <p className="text-[10px] text-[#c5a059] tracking-widest font-mono uppercase font-semibold">
                    ARCKAM Interiorismo Comercial • HERMA Agency
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                <Badge variant="gold" className="gap-1 font-bold">
                  <Users className="h-3 w-3" /> UN SOLO EQUIPO
                </Badge>
                <Badge variant="gold" className="gap-1 font-bold">
                  <Target className="h-3 w-3" /> UN SOLO OBJETIVO
                </Badge>
                <span className="text-[#e0b868] font-medium italic text-xs hidden sm:inline">
                  "Convertimos prospectos en proyectos."
                </span>
              </div>
            </div>

            {/* BOTONES CENTRADOS EN MÓVIL CON ESPACIADO PERFECTO */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-2 sm:pt-0 mx-auto lg:mx-0">
              <div className="w-full sm:w-auto flex justify-center"><NuevoLeadModal /></div>
              <div className="w-full sm:w-auto flex justify-center"><NuevaCotizacionModal /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Prospectos en Pipeline</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalLeads}</div></CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Proyectos Vendidos / Ganados</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{leadsGanados}</div></CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Monto Total Cotizado</CardTitle>
            <DollarSign className="h-4 w-4 text-[#c5a059]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-[#c5a059]">{formatCurrency(totalCotizado)}</div></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
        <div className="flex">
          <button
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'leads' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('leads')}
          >
            Pipeline de Prospectos ({totalLeads})
          </button>
          <button
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'cotizaciones' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('cotizaciones')}
          >
            Cotizaciones ({cotizaciones.length})
          </button>
        </div>

        {activeTab === 'leads' && (
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportarReporteComercial}
              className="h-7 text-xs gap-1 border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 font-bold"
            >
              <Download className="h-3.5 w-3.5" /> Descargar Reporte
            </Button>

            <span className="text-[11px] text-muted-foreground ml-1 hidden sm:inline">Vista:</span>
            <Button
              size="sm"
              variant={vistaModo === 'tabla' ? 'gold' : 'outline'}
              onClick={() => setVistaModo('tabla')}
              className="h-7 text-xs gap-1"
            >
              <Table className="h-3.5 w-3.5" /> Tabla
            </Button>
            <Button
              size="sm"
              variant={vistaModo === 'tarjetas' ? 'gold' : 'outline'}
              onClick={() => setVistaModo('tarjetas')}
              className="h-7 text-xs gap-1"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Tarjetas
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'leads' && (
        <div className="space-y-4">
          {loadingLeads ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <>
              {vistaModo === 'tabla' ? (
                <Card className="bg-card border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                          <th className="p-3">Cliente / Prospecto</th>
                          <th className="p-3">Línea de Negocio</th>
                          <th className="p-3">Estatus</th>
                          <th className="p-3">Presupuesto Objetivo</th>
                          <th className="p-3">Ubicación</th>
                          <th className="p-3">Fechas Críticas & SLA</th>
                          <th className="p-3">Responsable</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {leads.map((lead: any) => {
                          const c = lead.cliente || {}
                          const nombreCliente = lead.cliente_nombre || c.nombre_comercial || c.razon_social || 'Prospecto'
                          const empresaNombre = lead.empresa_nombre || lead.empresa?.nombre || 'Holding'
                          const ultInteraccion = lead.interacciones?.[0]
                          const montoReal = Number(lead.monto_presupuesto || c.presupuesto_estimado || 0)

                          return (
                            <tr 
                              key={lead.id} 
                              onClick={() => handleAbrirLead(lead)}
                              className="hover:bg-muted/40 cursor-pointer transition-colors"
                            >
                              <td className="p-3 font-bold text-card-foreground">
                                <div className="space-y-0.5">
                                  <p className="text-sm">{nombreCliente}</p>
                                  {c.razon_social && c.razon_social !== nombreCliente && (
                                    <p className="text-[10px] text-muted-foreground font-normal">{c.razon_social}</p>
                                  )}
                                </div>
                              </td>

                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px] gap-1 font-semibold">
                                  <Building2 className="h-3 w-3 text-[#c5a059]" /> {empresaNombre}
                                </Badge>
                              </td>

                              <td className="p-3">
                                {getEstatusLeadBadge(lead.estatus)}
                              </td>

                              <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                                {montoReal > 0 ? formatCurrency(montoReal) : <span className="text-muted-foreground font-normal italic">Por Definir</span>}
                              </td>

                              <td className="p-3 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-blue-500" />
                                  {c.ubicacion || `${c.ciudad_municipio || 'Ciudad'}, ${c.estado_republica || 'CDMX'}`}
                                </span>
                              </td>

                              <td className="p-3 space-y-0.5 text-[11px]">
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Captura: {lead.creado_en ? new Date(lead.creado_en).toLocaleDateString('es-MX') : 'Hoy'}
                                </p>
                                {ultInteraccion?.proximo_seguimiento && (
                                  <p className="text-blue-600 font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> SLA: {ultInteraccion.proximo_seguimiento}
                                  </p>
                                )}
                              </td>

                              <td className="p-3 text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-purple-500" />
                                  {lead.responsable_nombre || 'Asignado a Equipo'}
                                </span>
                              </td>

                              <td className="p-3 text-right">
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-[#c5a059] gap-1">
                                  Ver Prospecto <MousePointerClick className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}

                        {leads.length === 0 && (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                              No hay prospectos registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {leads.map((lead: any) => {
                    const clienteNombre = lead.cliente_nombre || lead.cliente?.nombre_comercial || lead.cliente?.razon_social || 'Prospecto'
                    const empresaNombre = lead.empresa_nombre || lead.empresa?.nombre || 'Empresa Holding'

                    return (
                      <Card 
                        key={lead.id} 
                        className="cursor-pointer hover:shadow-lg hover:border-[#c5a059]/50 transition-all border group relative"
                        onClick={() => handleAbrirLead(lead)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg group-hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                                {clienteNombre}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" /> {empresaNombre}
                              </p>
                            </div>
                            {getEstatusLeadBadge(lead.estatus)}
                          </div>

                          {lead.notas && (
                            <p className="text-xs text-muted-foreground bg-muted/60 p-2.5 rounded-md mb-3 line-clamp-2">
                              {lead.notas}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span className="capitalize">Origen: {lead.origen || 'Web'}</span>
                            <span className="text-[#c5a059] font-medium flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" /> Ver Prospecto ➔
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'cotizaciones' && (
        <div className="space-y-4">
          {loadingCotizaciones ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <div className="grid gap-4">
              {cotizaciones.map((cot: any) => (
                <Card 
                  key={cot.id} 
                  className="hover:shadow-md transition-all cursor-pointer border hover:border-[#c5a059]/50"
                  onClick={() => handleAbrirCotizacion(cot)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-semibold">{cot.concepto || 'Cotización'}</h3>
                          {cot.aprobada ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Aprobada</Badge>
                          ) : (
                            <Badge variant="secondary">Pendiente de Firma</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" /> {cot.lead_cliente || 'Cliente'}
                          </span>
                          <span>•</span>
                          <span>{cot.lead_empresa || 'Empresa'}</span>
                        </div>
                        <p className="text-2xl font-bold text-[#c5a059]">
                          {formatCurrency(Number(cot.monto || 0))}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-semibold text-[#c5a059]">
                        <span>Ver Detalle & Firma ➔</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {cotizaciones.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No hay cotizaciones registradas aún.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      <DetalleLeadModal 
        lead={leadSeleccionado}
        open={modalLeadOpen}
        onOpenChange={setModalLeadOpen}
      />

      <DetalleCotizacionModal
        cotizacion={cotizacionSeleccionada}
        open={modalCotizacionOpen}
        onOpenChange={setModalCotizacionOpen}
      />
    </div>
  )
}

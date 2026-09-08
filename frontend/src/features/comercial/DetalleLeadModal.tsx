import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Building2, Save, User, Loader2, FileCheck, MapPin, FolderUp, UserCheck, Layers, FileText, Download, Eye, Check } from 'lucide-react'
import { descargarPDFProspecto } from './pdfGenerator'
import { BitacoraInteraccionesCliente } from './BitacoraInteraccionesCliente'
import { FileUpload } from '@/components/ui/FileUpload'

const OPCIONES_TIPO_PROYECTO = [
  'Arquitectura / Diseño', 'Proyecto Ejecutivo', 'Obra / Remodelación',
  'Mobiliario', 'Producción HERMA', 'Anuncios / Imagen',
  'Mantenimiento', 'Desarrollo Inmobiliario', 'Otro'
]

const OPCIONES_ENTREGABLES = [
  'Levantamiento', 'Propuesta / Concepto', 'Render', 'Planos',
  'Proyecto Ejecutivo', 'Presupuesto', 'Mobiliario', 'Producción',
  'Obra', 'Mantenimiento', 'Llave en Mano', 'Otro'
]

interface DetalleLeadModalProps {
  lead: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DetalleLeadModal({ lead, open, onOpenChange }: DetalleLeadModalProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'seguimiento'>('brief')
  const [editData, setEditData] = useState<any>(null)
  const [tiposProyecto, setTiposProyecto] = useState<string[]>([])
  const [responsablesPorTipo, setResponsablesPorTipo] = useState<Record<string, { responsable_id: string; entregable: string }>>({})

  const queryClient = useQueryClient()

  useEffect(() => {
    if (lead) {
      const c = lead.cliente || {}
      const tiposExistentes = lead.tipos_proyecto || []
      const mapaInicial: Record<string, { responsable_id: string; entregable: string }> = {}

      if (Array.isArray(lead.tipos_proyecto_detalle)) {
        lead.tipos_proyecto_detalle.forEach((td: any) => {
          mapaInicial[td.tipo] = {
            responsable_id: td.responsable_id || '',
            entregable: td.entregable || 'Propuesta / Concepto'
          }
        })
      }

      setTiposProyecto(tiposExistentes)
      setResponsablesPorTipo(mapaInicial)

      setEditData({
        ...lead,
        nombre_prospecto: lead.cliente_nombre || c.nombre_comercial || c.razon_social || '',
        contacto_email: c.contacto_email || '',
        contacto_telefono: c.contacto_telefono || '',
        codigo_postal: c.codigo_postal || '',
        estado_republica: c.estado_republica || 'CDMX',
        ciudad_municipio: c.ciudad_municipio || '',
        entregables_esperados: lead.entregables_esperados || [],
        informacion_existente: lead.informacion_existente || [],
        archivos_adjuntos: lead.archivos_adjuntos || []
      })
    }
  }, [lead])

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-list'],
    queryFn: async () => (await api.get('/core/usuarios/')).data
  })

  const usuariosList = Array.isArray(usuarios) ? usuarios : []

  const toggleTipoProyecto = (tipo: string) => {
    if (tiposProyecto.includes(tipo)) {
      setTiposProyecto(prev => prev.filter(t => t !== tipo))
    } else {
      setTiposProyecto(prev => [...prev, tipo])
      if (!responsablesPorTipo[tipo]) {
        setResponsablesPorTipo(prev => ({
          ...prev,
          [tipo]: { responsable_id: '', entregable: 'Propuesta / Concepto' }
        }))
      }
    }
  }

  const mutationUpdate = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put(`/comercial/leads/${lead.id}/`, payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`Brief de Prospecto actualizado correctamente (v${data.version || 2})`)
      onOpenChange(false)
    }
  })

  if (!lead || !editData) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const tiposProyectoDetalle = tiposProyecto.map(tipo => {
      const cfg = responsablesPorTipo[tipo] || { responsable_id: '', entregable: 'Propuesta / Concepto' }
      const userObj = usuariosList.find((u: any) => String(u.id) === String(cfg.responsable_id))
      return {
        tipo,
        responsable_id: cfg.responsable_id,
        responsable_nombre: userObj ? userObj.nombre_completo : '',
        entregable: cfg.entregable
      }
    })

    mutationUpdate.mutate({
      ...editData,
      tipos_proyecto: tiposProyecto,
      tipos_proyecto_detalle: tiposProyectoDetalle
    })
  }

  const handleFileUploadComplete = (fileData: any) => {
    const nuevosArchivos = [...(editData.archivos_adjuntos || []), {
      file_url: fileData.file_url,
      file_path: fileData.file_path,
      file_name: fileData.file_name,
      file_size: fileData.file_size,
      file_type: fileData.file_type,
      version: (editData.version || 1) + 1,
      subido_en: new Date().toISOString()
    }]
    setEditData({ ...editData, archivos_adjuntos: nuevosArchivos })
    toast.success(`Archivo "${fileData.file_name}" subido e integrado a la Bóveda`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[820px] max-h-[92vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base sm:text-xl font-bold">{editData.nombre_prospecto || lead.cliente_nombre}</DialogTitle>
              <Badge variant="gold" className="font-mono text-xs font-bold">
                v{lead.version || 1}
              </Badge>
            </div>

            <Button size="sm" variant="outline" onClick={() => descargarPDFProspecto(lead)} className="h-7 text-xs border-[#c5a059] text-[#c5a059] font-bold">
              <FileCheck className="h-3.5 w-3.5 mr-1" /> PDF One-Pager
            </Button>
          </div>
        </DialogHeader>

        <div className="flex border-b text-xs font-medium">
          <button
            className={`px-4 py-2 border-b-2 font-bold transition-all ${activeTab === 'brief' ? 'border-[#c5a059] text-[#c5a059]' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('brief')}
          >
            📋 Brief Completo & Edición (10 Secciones)
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-bold transition-all ${activeTab === 'seguimiento' ? 'border-[#c5a059] text-[#c5a059]' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('seguimiento')}
          >
            🗓️ Seguimiento & Bitácora Diaria
          </button>
        </div>

        {activeTab === 'brief' && (
          <form onSubmit={handleSave} className="space-y-4 text-xs mt-3">
            {/* 1. DATOS BÁSICOS - 1 COLUMNA EN MÓVIL Y 3 EN COMPUTADORA */}
            <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
              <p className="font-bold text-xs text-[#c5a059]">1. DATOS BÁSICOS & UBICACIÓN</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Nombre del Proyecto / Oportunidad</Label>
                  <Input value={editData.nombre_proyecto || ''} onChange={e => setEditData({...editData, nombre_proyecto: e.target.value})} className="h-10 sm:h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estatus Comercial</Label>
                  <select value={editData.estatus} onChange={e => setEditData({...editData, estatus: e.target.value})} className="flex h-10 sm:h-9 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs font-bold">
                    <option value="solicitud_inicial">Solicitud Inicial</option>
                    <option value="requiere_propuesta">Requiere Propuesta</option>
                    <option value="en_negociacion">En Negociación</option>
                    <option value="ganado">Proyecto Vendido / Ganado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-semibold"><MapPin className="h-3.5 w-3.5 text-[#c5a059]" /> CP</Label>
                  <Input value={editData.codigo_postal || ''} onChange={e => setEditData({...editData, codigo_postal: e.target.value})} className="h-10 sm:h-8 font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estado</Label>
                  <Input value={editData.estado_republica || ''} onChange={e => setEditData({...editData, estado_republica: e.target.value})} className="h-10 sm:h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Municipio / Sucursal</Label>
                  <Input value={editData.ciudad_municipio || ''} onChange={e => setEditData({...editData, ciudad_municipio: e.target.value})} className="h-10 sm:h-8 text-xs" />
                </div>
              </div>
            </div>

            {/* 2. TIPO DE PROYECTO CON BOTONES RESPONSIVOS EN MÓVIL Y SELECTORES DE RESPONSABLE */}
            <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
              <p className="font-bold text-xs text-[#c5a059]">2. TIPO DE PROYECTO & ASIGNACIÓN DE RESPONSABLES</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {OPCIONES_TIPO_PROYECTO.map((tipo) => {
                  const isSelected = tiposProyecto.includes(tipo)

                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => toggleTipoProyecto(tipo)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#c5a059]/20 border-[#c5a059] text-foreground shadow-sm ring-1 ring-[#c5a059]' 
                          : 'bg-card border-input text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="truncate">{tipo}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#c5a059] flex-shrink-0 ml-1 font-bold" />}
                    </button>
                  )
                })}
              </div>

              {tiposProyecto.length > 0 && (
                <div className="mt-3 p-3 bg-card border-2 border-[#c5a059]/50 rounded-lg space-y-3 shadow-md">
                  <p className="font-bold text-xs text-[#c5a059] flex items-center gap-1.5 uppercase tracking-wide">
                    <UserCheck className="h-4 w-4 text-[#c5a059]" />
                    Asignar Persona Responsable ({tiposProyecto.length}):
                  </p>

                  <div className="space-y-2.5">
                    {tiposProyecto.map((tipo) => {
                      const config = responsablesPorTipo[tipo] || { responsable_id: '', entregable: 'Propuesta / Concepto' }

                      return (
                        <div key={tipo} className="p-2.5 rounded-md border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-bold text-xs text-foreground flex items-center gap-2 sm:w-1/3">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#c5a059] flex-shrink-0" />
                            <span className="truncate">{tipo}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <User className="h-3 w-3" /> Responsable:
                              </Label>
                              <select
                                value={config.responsable_id}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setResponsablesPorTipo(prev => ({
                                    ...prev,
                                    [tipo]: { ...prev[tipo], responsable_id: val }
                                  }))
                                }}
                                className="flex h-9 sm:h-8 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-0 text-xs font-semibold shadow-sm"
                              >
                                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar Responsable...</option>
                                {usuariosList.map((u: any) => (
                                  <option key={u.id} value={u.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">
                                    {u.nombre_completo} ({u.puesto || u.username})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-muted-foreground">Entregable Requerido:</Label>
                              <select
                                value={config.entregable}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setResponsablesPorTipo(prev => ({
                                    ...prev,
                                    [tipo]: { ...prev[tipo], entregable: val }
                                  }))
                                }}
                                className="flex h-9 sm:h-8 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-0 text-xs font-medium shadow-sm"
                              >
                                {OPCIONES_ENTREGABLES.map((eOpt) => (
                                  <option key={eOpt} value={eOpt} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">
                                    {eOpt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. NECESIDAD DEL PROSPECTO */}
            <div className="space-y-1">
              <Label className="font-bold text-foreground text-xs">3. ¿QUÉ NECESITA EL PROSPECTO?</Label>
              <textarea 
                value={editData.necesidad_cliente || ''} 
                onChange={e => setEditData({...editData, necesidad_cliente: e.target.value})} 
                className="flex min-h-[70px] w-full rounded border border-input bg-background px-3 py-2 text-xs" 
              />
            </div>

            {/* 5. BÓVEDA DOCUMENTAL */}
            <div className="p-3 bg-[#c5a059]/10 border border-[#c5a059]/40 rounded-lg space-y-2">
              <p className="font-bold text-xs text-[#c5a059] flex items-center gap-1">
                <FolderUp className="h-4 w-4" /> 5. BÓVEDA DOCUMENTAL IN-HOUSE ({(editData.archivos_adjuntos || []).length} Archivos)
              </p>

              {(editData.archivos_adjuntos || []).length > 0 && (
                <div className="space-y-1.5">
                  {editData.archivos_adjuntos.map((arch: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-card border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-[#c5a059]" />
                        <span className="font-bold truncate">{arch.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => window.open(arch.file_url, '_blank')} className="h-6 text-[10px]">
                          <Eye className="h-3 w-3 text-blue-500 mr-1" /> Ver
                        </Button>
                        <Button size="sm" variant="outline" asChild className="h-6 text-[10px] border-[#c5a059] text-[#c5a059]">
                          <a href={arch.file_url} download target="_blank" rel="noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <FileUpload
                fileType="documento"
                accept="*/*"
                maxFiles={5}
                onUploadComplete={handleFileUploadComplete}
                label=""
                description="Subir nuevos planos, renders o documentos"
              />
            </div>

            {/* 6 & 7. PRESUPUESTO & FECHAS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Presupuesto ($ MXN)</Label>
                <Input type="number" value={editData.monto_presupuesto || ''} onChange={e => setEditData({...editData, monto_presupuesto: e.target.value})} className="h-10 sm:h-9 font-bold text-xs text-emerald-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Propuesta Requerida</Label>
                <Input type="date" value={editData.fecha_cotizacion_requerida || ''} onChange={e => setEditData({...editData, fecha_cotizacion_requerida: e.target.value})} className="h-10 sm:h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha Entrega Requerida</Label>
                <Input type="date" value={editData.fecha_entrega_requerida || ''} onChange={e => setEditData({...editData, fecha_entrega_requerida: e.target.value})} className="h-10 sm:h-9 text-xs" />
              </div>
            </div>

            {/* 10. GOBERNANZA & SLA */}
            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg space-y-2">
              <p className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-blue-600" /> 10. GOBERNANZA & TRANSFERENCIA SLA
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Área Responsable</Label>
                  <Input value={editData.siguiente_accion_area || ''} onChange={e => setEditData({...editData, siguiente_accion_area: e.target.value})} className="h-10 sm:h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Responsable General</Label>
                  <select value={editData.responsable || ''} onChange={e => setEditData({...editData, responsable: e.target.value})} className="flex h-10 sm:h-9 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs font-semibold">
                    {usuariosList.map((u: any) => (
                      <option key={u.id} value={u.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{u.nombre_completo}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Compromiso SLA</Label>
                  <Input type="date" value={editData.siguiente_accion_fecha_compromiso || ''} onChange={e => setEditData({...editData, siguiente_accion_fecha_compromiso: e.target.value})} className="h-10 sm:h-9 text-xs" />
                </div>
              </div>
            </div>

            {/* BARRA FIJA EN LA PARTE INFERIOR DE ACCIÓN (STICKY FOOTER) */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-1 border-t flex justify-end gap-3 z-20">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-10 text-xs px-4">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={mutationUpdate.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-xs px-6 shadow-lg">
                {mutationUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar Cambios (Crear v{(lead.version || 1) + 1})
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'seguimiento' && (
          <div className="mt-3">
            <BitacoraInteraccionesCliente
              leadId={lead.id}
              clienteNombre={editData.nombre_prospecto || lead.cliente_nombre || 'Cliente'}
              telefono={lead.cliente?.contacto_telefono || ''}
              email={lead.cliente?.contacto_email || ''}
              interacciones={lead.interacciones || []}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, UserPlus, Sparkles, MapPin, Check, FolderUp, FileCheck, UserCheck, User } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'

const ESTADOS_MEXICO = [
  'CDMX', 'Jalisco', 'Nuevo León', 'Querétaro', 'Quintana Roo', 'Yucatán',
  'Estado de México', 'Puebla', 'Guanajuato', 'Aguascalientes', 'Baja California',
  'Baja California Sur', 'Campeche', 'Coahuila', 'Colima', 'Chiapas', 'Chihuahua',
  'Durango', 'Guerrero', 'Hidalgo', 'Michoacán', 'Morelos', 'Nayarit', 'Oaxaca',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Zacatecas'
]

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

const OPCIONES_INFO_EXISTENTE = [
  'Fotografías', 'Videos', 'Planos', 'Medidas / Levantamiento',
  'Renders', 'Manual de Imagen', 'Catálogo de Conceptos',
  'Especificaciones', 'Cotización de Referencia', 'Ninguna'
]

export function NuevoLeadModal() {
  const [open, setOpen] = useState(false)
  const [tipoCliente, setTipoCliente] = useState<'nuevo' | 'existente'>('nuevo')
  
  const [tiposProyecto, setTiposProyecto] = useState<string[]>([])
  const [responsablesPorTipo, setResponsablesPorTipo] = useState<Record<string, { responsable_id: string; entregable: string }>>({})

  const [formData, setFormData] = useState({
    nombre_prospecto: '',
    contacto_email: '',
    contacto_telefono: '',
    cliente: '',
    empresa: '',
    origen: 'web',
    
    nombre_proyecto: '',
    sucursal_ubicacion: '',
    codigo_postal: '',
    estado_republica: 'CDMX',
    ciudad_municipio: '',

    necesidad_cliente: '',
    entregables_esperados: [] as string[],
    informacion_existente: [] as string[],
    archivos_adjuntos: [] as any[],

    presupuesto_indicado: 'pendiente',
    monto_presupuesto: '',

    fecha_cotizacion_requerida: '',
    fecha_inicio_solicitado: '',
    fecha_entrega_requerida: '',
    fecha_inamovible: false,

    estatus: 'solicitud_inicial',
    observaciones_importantes: '',

    siguiente_accion_area: 'Diseño / Arquitectura',
    siguiente_accion_concreta: '',
    siguiente_accion_responsable: '',
    siguiente_accion_fecha_compromiso: '',
  })

  const queryClient = useQueryClient()

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-lead'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/clientes/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-lead'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-select'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/usuarios/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const clientes = Array.isArray(clientesData) ? clientesData : []
  const empresas = Array.isArray(empresasData) ? empresasData : []
  const usuarios = Array.isArray(usuariosData) ? usuariosData : []

  useEffect(() => {
    if (empresas.length > 0 && !formData.empresa) {
      setFormData(prev => ({ ...prev, empresa: empresas[0].id }))
    }
  }, [empresasData])

  const handleCPLookup = async (cpValue: string) => {
    setFormData(prev => ({ ...prev, codigo_postal: cpValue }))
    if (cpValue.length === 5) {
      try {
        const { data } = await api.get(`/core/cp-lookup/?cp=${cpValue}`)
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            estado_republica: data.estado || prev.estado_republica,
            ciudad_municipio: data.municipio || prev.ciudad_municipio,
          }))
          toast.success(`Ubicación: ${data.municipio}, ${data.estado}`)
        }
      } catch {
        console.log("CP no encontrado")
      }
    }
  }

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

  const toggleArrayItem = (arrayName: 'entregables_esperados' | 'informacion_existente', item: string) => {
    setFormData(prev => {
      const arr = prev[arrayName]
      const exists = arr.includes(item)
      const updated = exists ? arr.filter(i => i !== item) : [...arr, item]
      return { ...prev, [arrayName]: updated }
    })
  }

  const handleFileUploadComplete = (fileData: any) => {
    setFormData(prev => ({
      ...prev,
      archivos_adjuntos: [...prev.archivos_adjuntos, {
        file_url: fileData.file_url,
        file_path: fileData.file_path,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
        file_type: fileData.file_type,
        version: 1,
        subido_en: new Date().toISOString()
      }]
    }))
    toast.success(`Archivo "${fileData.file_name}" subido e integrado al Brief`)
  }

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post('/comercial/leads/', data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['bitacora-personal'] })
      toast.success('Brief de Prospecto guardado exitosamente')
      setOpen(false)
    },
    onError: () => {
      toast.error('Error al registrar Brief de Prospecto')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const empresaId = formData.empresa || (empresas.length > 0 ? empresas[0].id : '')

    const tiposProyectoDetalle = tiposProyecto.map(tipo => {
      const cfg = responsablesPorTipo[tipo] || { responsable_id: '', entregable: 'Propuesta / Concepto' }
      const userObj = usuarios.find((u: any) => String(u.id) === String(cfg.responsable_id))
      return {
        tipo,
        responsable_id: cfg.responsable_id,
        responsable_nombre: userObj ? userObj.nombre_completo : '',
        entregable: cfg.entregable
      }
    })

    const payload: any = {
      ...formData,
      tipos_proyecto: tiposProyecto,
      tipos_proyecto_detalle: tiposProyectoDetalle,
      empresa: empresaId,
      monto_presupuesto: parseFloat(formData.monto_presupuesto) || 0,
      siguiente_accion_responsable: formData.siguiente_accion_responsable || null,
      fecha_cotizacion_requerida: formData.fecha_cotizacion_requerida || null,
      fecha_inicio_solicitado: formData.fecha_inicio_solicitado || null,
      fecha_entrega_requerida: formData.fecha_entrega_requerida || null,
      siguiente_accion_fecha_compromiso: formData.siguiente_accion_fecha_compromiso || null,
      sucursal_ubicacion: `${formData.ciudad_municipio}, ${formData.estado_republica} (CP: ${formData.codigo_postal})`
    }

    if (tipoCliente === 'nuevo') {
      if (!formData.nombre_prospecto.trim()) {
        toast.error('Nombre del prospecto es obligatorio')
        return
      }
      payload.nombre_prospecto = formData.nombre_prospecto.trim()
    } else {
      if (!formData.cliente) {
        toast.error('Selecciona un cliente existente')
        return
      }
      payload.cliente = formData.cliente
    }

    mutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm">
          <UserPlus className="h-4 w-4" /> Brief de Prospecto
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[820px] max-h-[92vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg font-bold">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            Brief de Prospecto — Grupo Fiat
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1 text-xs">
          <div className="flex rounded-md bg-muted p-1">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'nuevo' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              onClick={() => setTipoCliente('nuevo')}
            >
              🆕 Nuevo Prospecto
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'existente' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              onClick={() => setTipoCliente('existente')}
            >
              🏢 Cliente Existente
            </button>
          </div>

          {/* 1. DATOS BÁSICOS - AHORA TOTALMENTE RESPONSIVO EN MÓVIL (1 COLUMNA EN MÓVIL, 2/3 EN PANTALLA GRANDE) */}
          <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
            <p className="font-bold text-xs text-[#c5a059]">1. DATOS BÁSICOS DEL PROSPECTO</p>
            
            {tipoCliente === 'nuevo' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Prospecto / Empresa *</Label>
                  <Input value={formData.nombre_prospecto} onChange={e => setFormData({...formData, nombre_prospecto: e.target.value})} placeholder="Ej. Inmobiliaria del Norte S.A." required={tipoCliente === 'nuevo'} className="h-10 sm:h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nombre Proyecto</Label>
                  <Input value={formData.nombre_proyecto} onChange={e => setFormData({...formData, nombre_proyecto: e.target.value})} placeholder="Ej. Torre Mirador" className="h-10 sm:h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Correo Electrónico</Label>
                  <Input type="email" value={formData.contacto_email} onChange={e => setFormData({...formData, contacto_email: e.target.value})} placeholder="correo@empresa.com" className="h-10 sm:h-9 text-xs" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Teléfono de Contacto</Label>
                  <Input value={formData.contacto_telefono} onChange={e => setFormData({...formData, contacto_telefono: e.target.value})} placeholder="55 1234 5678" className="h-10 sm:h-9 text-xs" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Cliente Existente *</Label>
                <select value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="flex h-10 sm:h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-bold">
                  <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar cliente...</option>
                  {clientes.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{c.nombre_comercial || c.razon_social}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label className="font-bold text-[#c5a059] flex items-center gap-1 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> Código Postal (CP)
                </Label>
                <Input value={formData.codigo_postal} onChange={e => handleCPLookup(e.target.value)} placeholder="11000" maxLength={5} className="h-10 sm:h-8 font-bold text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estado</Label>
                <select value={formData.estado_republica} onChange={e => setFormData({...formData, estado_republica: e.target.value})} className="flex h-10 sm:h-8 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs font-medium">
                  {ESTADOS_MEXICO.map(est => <option key={est} value={est} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{est}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Municipio / Sucursal</Label>
                <Input value={formData.ciudad_municipio} onChange={e => setFormData({...formData, ciudad_municipio: e.target.value})} placeholder="Lomas de Chapultepec" className="h-10 sm:h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* 2. TIPO DE PROYECTO - BOTONES RESPONSIVOS EN MÓVIL */}
          <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
            <p className="font-bold text-xs text-[#c5a059] flex items-center justify-between">
              <span>2. TIPO DE PROYECTO (Seleccionar una o varias)</span>
            </p>

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
                              {usuarios.map((u: any) => (
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

          {/* 3. NECESIDAD DEL CLIENTE */}
          <div className="space-y-1">
            <Label className="font-bold text-foreground text-xs">3. ¿QUÉ NECESITA EL PROSPECTO?</Label>
            <textarea 
              value={formData.necesidad_cliente}
              onChange={e => setFormData({...formData, necesidad_cliente: e.target.value})}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              placeholder="Describir los requerimientos..."
            />
          </div>

          {/* 4. ENTREGABLES ESPERADOS */}
          <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
            <p className="font-bold text-xs text-[#c5a059]">4. ENTREGABLES ESPERADOS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {OPCIONES_ENTREGABLES.map((item) => {
                const checked = formData.entregables_esperados.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('entregables_esperados', item)}
                    className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      checked 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' 
                        : 'bg-card border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5. BÓVEDA DOCUMENTAL */}
          <div className="p-3 bg-[#c5a059]/10 border-2 border-[#c5a059]/40 rounded-lg space-y-3">
            <p className="font-bold text-xs text-[#c5a059] flex items-center gap-1.5">
              <FolderUp className="h-4 w-4" /> 5. INFORMACIÓN EXISTENTE & BÓVEDA IN-HOUSE
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {OPCIONES_INFO_EXISTENTE.map((info) => {
                const checked = formData.informacion_existente.includes(info)
                return (
                  <button
                    key={info}
                    type="button"
                    onClick={() => toggleArrayItem('informacion_existente', info)}
                    className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      checked 
                        ? 'bg-purple-600/20 border-purple-500 text-purple-600 dark:text-purple-400 font-bold' 
                        : 'bg-card border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{info}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 border-t border-[#c5a059]/30 space-y-2">
              <FileUpload
                fileType="documento"
                accept="*/*"
                maxFiles={10}
                onUploadComplete={handleFileUploadComplete}
                label=""
                description="Haz clic o arrastra planos, levantamientos, PDF o modelos 3D"
              />
            </div>
          </div>

          {/* 6 & 7. PRESUPUESTO & FECHAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
              <p className="font-bold text-xs text-[#c5a059]">6. PRESUPUESTO</p>
              <div className="space-y-1">
                <Label className="text-[11px]">¿Indicó presupuesto objetivo?</Label>
                <select value={formData.presupuesto_indicado} onChange={e => setFormData({...formData, presupuesto_indicado: e.target.value})} className="flex h-9 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs">
                  <option value="si" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Sí</option>
                  <option value="no" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">No</option>
                  <option value="pendiente" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Aún no se ha preguntado</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Monto ($ MXN):</Label>
                <Input type="number" value={formData.monto_presupuesto} onChange={e => setFormData({...formData, monto_presupuesto: e.target.value})} placeholder="15000000" className="h-9 font-bold text-xs" />
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
              <p className="font-bold text-xs text-[#c5a059]">7. FECHAS CLAVE</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Propuesta:</Label>
                  <Input type="date" value={formData.fecha_cotizacion_requerida} onChange={e => setFormData({...formData, fecha_cotizacion_requerida: e.target.value})} className="h-8 text-[11px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Entrega:</Label>
                  <Input type="date" value={formData.fecha_entrega_requerida} onChange={e => setFormData({...formData, fecha_entrega_requerida: e.target.value})} className="h-8 text-[11px]" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="inamovible" checked={formData.fecha_inamovible} onChange={e => setFormData({...formData, fecha_inamovible: e.target.checked})} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="inamovible" className="cursor-pointer text-[11px]">¿Fecha inamovible? (Sí)</Label>
              </div>
            </div>
          </div>

          {/* 10. SIGUIENTE ACCIÓN CON STICKY FOOTER PARA GARANTIZAR CLIC EN MÓVIL */}
          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg space-y-3">
            <p className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-blue-600" /> 10. SIGUIENTE ACCIÓN GENERAL
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Área que actúa:</Label>
                <select value={formData.siguiente_accion_area} onChange={e => setFormData({...formData, siguiente_accion_area: e.target.value})} className="flex h-9 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs font-semibold">
                  <option value="Levantamiento" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Levantamiento</option>
                  <option value="Diseño / Arquitectura" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Diseño / Arquitectura</option>
                  <option value="Render" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Render</option>
                  <option value="Costos" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Costos / Presupuestos</option>
                  <option value="HERMA" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Producción HERMA</option>
                  <option value="Obra" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Obra</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-blue-900 dark:text-blue-300">Responsable Asignado:</Label>
                <select value={formData.siguiente_accion_responsable} onChange={e => setFormData({...formData, siguiente_accion_responsable: e.target.value})} className="flex h-9 w-full rounded border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs font-semibold">
                  <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Asignar a Miembro...</option>
                  {usuarios.map((u: any) => (
                    <option key={u.id} value={u.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{u.nombre_completo} ({u.puesto || u.username})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px]">Acción Concreta:</Label>
                <Input value={formData.siguiente_accion_concreta} onChange={e => setFormData({...formData, siguiente_accion_concreta: e.target.value})} placeholder="Ej. Contactar para levantar especificaciones" className="h-9 text-xs bg-background" />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-[#c5a059]">SLA Compromiso:</Label>
                <Input type="date" value={formData.siguiente_accion_fecha_compromiso} onChange={e => setFormData({...formData, siguiente_accion_fecha_compromiso: e.target.value})} className="h-9 text-xs bg-background font-bold" />
              </div>
            </div>
          </div>

          {/* BARRA DE ACCIÓN FIJA EN LA PARTE INFERIOR (STICKY FOOTER) - SIEMPRE VISIBLE EN MÓVILES */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-1 border-t flex justify-end gap-3 z-20">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 text-xs px-4">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-xs px-6 shadow-lg">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Prospecto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

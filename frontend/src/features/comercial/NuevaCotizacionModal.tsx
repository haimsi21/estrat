import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { FileText, Loader2, Building2, Sparkles, FolderUp } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'

interface NuevaCotizacionModalProps {
  leadIdInicial?: string
  openExternal?: boolean
  onOpenChangeExternal?: (open: boolean) => void
}

export function NuevaCotizacionModal({ leadIdInicial, openExternal, onOpenChangeExternal }: NuevaCotizacionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openExternal !== undefined
  const open = isControlled ? openExternal : internalOpen
  const setOpen = isControlled ? (onOpenChangeExternal || (() => {})) : setInternalOpen

  const [formData, setFormData] = useState({
    lead: leadIdInicial || '',
    concepto: '',
    monto: '',
    vigencia: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    esquema_pago: '50_40_10',
    aprobada: false,
    archivo_adjunto: null as any
  })

  useEffect(() => {
    if (leadIdInicial) {
      setFormData(prev => ({ ...prev, lead: leadIdInicial }))
    }
  }, [leadIdInicial])

  const queryClient = useQueryClient()

  const { data: leadsData } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/comercial/leads/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const leads = Array.isArray(leadsData) ? leadsData : []
  const leadSeleccionadoObj = leads.find((l: any) => String(l.id) === String(formData.lead))

  const handleLeadChange = (leadId: string) => {
    const leadObj = leads.find((l: any) => String(l.id) === String(leadId))
    setFormData(prev => ({
      ...prev,
      lead: leadId,
      concepto: leadObj ? `Propuesta Comercial — ${leadObj.nombre_proyecto || leadObj.cliente_nombre || 'Proyecto'}` : prev.concepto,
      monto: leadObj && leadObj.monto_presupuesto > 0 ? String(leadObj.monto_presupuesto) : prev.monto
    }))
  }

  const handleFileUploadComplete = (fileData: any) => {
    setFormData(prev => ({
      ...prev,
      archivo_adjunto: fileData
    }))
    toast.success(`Cotización PDF "${fileData.file_name}" adjuntada al Expediente`)
  }

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        monto: parseFloat(data.monto) || 0,
        archivo: data.archivo_adjunto?.file_path || null
      }
      const { data: res } = await api.post('/comercial/cotizaciones/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['bitacora-personal'] })
      toast.success('Cotización Comercial generada exitosamente')
      setOpen(false)
      setFormData({ lead: '', concepto: '', monto: '', vigencia: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], esquema_pago: '50_40_10', aprobada: false, archivo_adjunto: null })
    },
    onError: () => {
      toast.error('Error al generar Cotización')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lead || !formData.concepto || !formData.monto) {
      toast.error('Prospecto, Concepto y Monto son requeridos')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm">
            <FileText className="h-4 w-4" /> Nueva Cotización
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[92vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg font-bold">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#c5a059]" />
            Generar Cotización Comercial — Grupo Fiat
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-xs">
          <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
            <p className="font-bold text-xs text-[#c5a059]">1. VÍNCULO CON EL PROSPECTO</p>
            <div className="space-y-2">
              <Label htmlFor="lead" className="text-xs font-semibold">Seleccionar Prospecto *</Label>
              <select 
                id="lead" 
                value={formData.lead} 
                onChange={e => handleLeadChange(e.target.value)}
                className="flex h-10 sm:h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-semibold"
                required
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar Prospecto...</option>
                {leads.map((l: any) => (
                  <option key={l.id} value={l.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">
                    {l.cliente_nombre || 'Prospecto'} — {l.nombre_proyecto || l.empresa_nombre} (${Number(l.monto_presupuesto || 0).toLocaleString()} MXN)
                  </option>
                ))}
              </select>
            </div>

            {leadSeleccionadoObj && (
              <div className="p-2.5 bg-[#c5a059]/10 border border-[#c5a059]/40 rounded-lg space-y-1.5 text-xs">
                <p className="font-bold text-[#c5a059] flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Prospecto: {leadSeleccionadoObj.cliente_nombre}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Línea Negocio:</span>
                    <span className="font-bold text-foreground">{leadSeleccionadoObj.empresa_nombre}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Presupuesto Brief:</span>
                    <span className="font-bold text-emerald-600">${Number(leadSeleccionadoObj.monto_presupuesto || 0).toLocaleString()} MXN</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Ubicación:</span>
                    <span className="font-semibold text-foreground truncate block">{leadSeleccionadoObj.sucursal_ubicacion || 'CDMX'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
            <p className="font-bold text-xs text-[#c5a059]">2. ESTRUCTURA FINANCIERA DE LA PROPUESTA</p>
            
            <div className="space-y-2">
              <Label htmlFor="concepto" className="text-xs font-semibold">Concepto / Nombre de la Propuesta *</Label>
              <Input 
                id="concepto" 
                value={formData.concepto} 
                onChange={e => setFormData({...formData, concepto: e.target.value})} 
                placeholder="Ej. Anteproyecto Arquitectónico y Construcción" 
                className="h-10 sm:h-9 text-xs"
                required 
              />
            </div>

            {/* SECCIÓN FINANCIERA EN 1 COLUMNA PARA MÓVIL Y 3 EN PANTALLA GRANDE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="monto" className="text-xs font-semibold">Monto Total ($ MXN) *</Label>
                <Input 
                  id="monto" 
                  type="number" 
                  value={formData.monto} 
                  onChange={e => setFormData({...formData, monto: e.target.value})} 
                  placeholder="250000" 
                  className="h-10 sm:h-9 font-bold text-xs text-emerald-600"
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="vigencia" className="text-xs font-semibold">Vigencia Hasta *</Label>
                <Input 
                  id="vigencia" 
                  type="date" 
                  value={formData.vigencia} 
                  onChange={e => setFormData({...formData, vigencia: e.target.value})} 
                  className="h-10 sm:h-9 text-xs"
                  required 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Esquema de Pago</Label>
                <select 
                  value={formData.esquema_pago}
                  onChange={e => setFormData({...formData, esquema_pago: e.target.value})}
                  className="flex h-10 sm:h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs shadow-sm font-medium"
                >
                  <option value="50_40_10" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">50% Anticipo / 40% Avance / 10% Entrega</option>
                  <option value="30_60_10" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">30% Anticipo / 60% Estimaciones / 10% Finiquito</option>
                  <option value="contado" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">100% Contado / Pago Único</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
            <p className="font-bold text-xs text-[#c5a059] flex items-center gap-1">
              <FolderUp className="h-4 w-4" /> 3. DOCUMENTACIÓN ADJUNTA
            </p>
            <FileUpload
              fileType="pdf"
              accept=".pdf,.xlsx,.docx"
              maxFiles={1}
              onUploadComplete={handleFileUploadComplete}
              label=""
              description="Sube la propuesta en PDF para almacenarla en la Bóveda"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#c5a059]/10 border rounded-lg">
            <input 
              type="checkbox" 
              id="aprobada" 
              checked={formData.aprobada} 
              onChange={e => setFormData({...formData, aprobada: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="aprobada" className="cursor-pointer text-xs font-bold text-foreground">
              Marcar como Aprobada e ingresar a Matriz de Firma C-Suite
            </Label>
          </div>

          {/* BARRA DE ACCIÓN FIJA ABAJO */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-1 border-t flex justify-end gap-3 z-20">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 text-xs px-4">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 text-xs px-6 shadow-lg">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cotización
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

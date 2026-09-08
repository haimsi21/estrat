import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, Palette, FileText, Box } from 'lucide-react'
import { FileUpload } from '@/components/ui/FileUpload'

export function NuevaPropuestaModal() {
  const [open, setOpen] = useState(false)
  const [tipoCliente, setTipoCliente] = useState<'nuevo' | 'existente'>('nuevo')
  const [formData, setFormData] = useState({
    nombre_prospecto: '',
    cliente: '',
    proyecto: '',
    version: 1,
    estatus: 'boceto',
  })
  const [archivosSubidos, setArchivosSubidos] = useState<Array<{ tipo: string; archivo: string; name: string }>>([])

  const queryClient = useQueryClient()

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-arq'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/clientes/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-arq'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const clientes = Array.isArray(clientesData) ? clientesData : []
  const proyectos = Array.isArray(proyectosData) ? proyectosData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        version: Number(data.version) || 1,
        archivos_input: archivosSubidos,
      }
      const { data: res } = await api.post('/arquitectura/propuestas/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propuestas'] })
      toast.success('Propuesta de Diseño registrada exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar propuesta')
    }
  })

  const resetForm = () => {
    setFormData({ nombre_prospecto: '', cliente: '', proyecto: '', version: 1, estatus: 'boceto' })
    setArchivosSubidos([])
  }

  const handleFileUploaded = (fileData: any, tipo: 'plano' | 'modelo_3d' | 'render') => {
    setArchivosSubidos(prev => [...prev, { tipo, archivo: fileData.file_path, name: fileData.file_name }])
    toast.success(`Adjuntado: ${fileData.file_name}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tipoCliente === 'nuevo' && !formData.nombre_prospecto.trim()) {
      toast.error('Nombre de prospecto requerido')
      return
    }
    if (tipoCliente === 'existente' && !formData.cliente) {
      toast.error('Selecciona un cliente de la lista')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold">
          <Plus className="h-4 w-4" /> Nueva Propuesta de Arquitectura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Nueva Propuesta Arquitectónica & Diseños 3D
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex rounded-md bg-muted p-1 text-xs">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'nuevo' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              onClick={() => {
                setTipoCliente('nuevo')
                setFormData({...formData, cliente: ''})
              }}
            >
              🆕 Nuevo Prospecto
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'existente' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground'}`}
              onClick={() => {
                setTipoCliente('existente')
                setFormData({...formData, nombre_prospecto: ''})
              }}
            >
              🏢 Cliente Existente
            </button>
          </div>

          {tipoCliente === 'nuevo' ? (
            <div className="space-y-2 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-md">
              <Label htmlFor="nombre_prospecto">Nombre del Cliente / Prospecto *</Label>
              <Input 
                id="nombre_prospecto" 
                value={formData.nombre_prospecto} 
                onChange={e => setFormData({...formData, nombre_prospecto: e.target.value})} 
                placeholder="Ej. Residencia Lomas / Lic. Sofia Martínez"
                required={tipoCliente === 'nuevo'}
              />
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-muted/50 border rounded-md">
              <Label htmlFor="cliente">Seleccionar Cliente Existente *</Label>
              <select 
                id="cliente" 
                value={formData.cliente} 
                onChange={e => setFormData({...formData, cliente: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-bold"
                required={tipoCliente === 'existente'}
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar cliente...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{c.nombre_comercial || c.razon_social}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="proyecto">Proyecto Vinculado (Opcional)</Label>
              <select 
                id="proyecto" 
                value={formData.proyecto} 
                onChange={e => setFormData({...formData, proyecto: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm"
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Sin vincular a proyecto aún...</option>
                {proyectos.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Versión *</Label>
              <Input 
                id="version" 
                type="number" 
                min="1" 
                value={formData.version} 
                onChange={e => setFormData({...formData, version: parseInt(e.target.value) || 1})} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estatus">Estado de la Propuesta</Label>
            <select 
              id="estatus" 
              value={formData.estatus} 
              onChange={e => setFormData({...formData, estatus: e.target.value})}
              className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm"
            >
              <option value="boceto" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Boceto Inicial</option>
              <option value="revision" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">En Revisión con Cliente</option>
              <option value="aprobado" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Aprobado por Cliente</option>
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label className="font-semibold text-xs">Carga de Archivos (AutoCAD, Renders, USDZ 3D)</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-card space-y-2">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <FileText className="h-4 w-4 text-blue-600" /> Planos (AutoCAD / DWG / PDF)
                </span>
                <FileUpload 
                  fileType="documento"
                  accept=".dwg,.dxf,.pdf"
                  onUploadComplete={(file) => handleFileUploaded(file, 'plano')}
                />
              </div>

              <div className="p-3 border rounded-lg bg-card space-y-2">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Box className="h-4 w-4 text-purple-600" /> Modelo 3D / LiDAR (USDZ / GLTF)
                </span>
                <FileUpload 
                  fileType="modelo_3d"
                  accept=".usdz,.gltf,.glb,.obj"
                  onUploadComplete={(file) => handleFileUploaded(file, 'modelo_3d')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Propuesta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

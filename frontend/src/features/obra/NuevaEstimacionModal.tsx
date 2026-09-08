import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { FileCheck, Loader2, Plus } from 'lucide-react'

export function NuevaEstimacionModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    proyecto: '',
    numero_estimacion: 1,
    fecha_presentacion: new Date().toISOString().split('T')[0],
    porcentaje_ejecutado: '',
    monto_ejecutado: '',
    estatus: 'presentada',
    notas: '',
  })

  const queryClient = useQueryClient()

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-estimacion'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const proyectos = Array.isArray(proyectosData) ? proyectosData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        numero_estimacion: parseInt(data.numero_estimacion) || 1,
        porcentaje_ejecutado: parseFloat(data.porcentaje_ejecutado) || 0,
        monto_ejecutado: parseFloat(data.monto_ejecutado) || 0,
      }
      const { data: res } = await api.post('/obra/estimaciones/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimaciones'] })
      toast.success('Estimación de Obra presentada exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar estimación', {
        description: error.response?.data?.detail || 'Verifica los campos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      proyecto: '',
      numero_estimacion: 1,
      fecha_presentacion: new Date().toISOString().split('T')[0],
      porcentaje_ejecutado: '',
      monto_ejecutado: '',
      estatus: 'presentada',
      notas: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proyecto || !formData.monto_ejecutado) {
      toast.error('Proyecto y Monto Ejecutado son requeridos')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" /> Nueva Estimación de Obra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Presentar Estimación de Avance (Progress Billing)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="proyecto">Proyecto Activo *</Label>
            <select 
              id="proyecto" 
              value={formData.proyecto} 
              onChange={e => setFormData({...formData, proyecto: e.target.value})}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">Seleccionar proyecto...</option>
              {proyectos.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_estimacion">Número de Estimación *</Label>
              <Input 
                id="numero_estimacion" 
                type="number" 
                min="1" 
                value={formData.numero_estimacion} 
                onChange={e => setFormData({...formData, numero_estimacion: parseInt(e.target.value) || 1})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_presentacion">Fecha Presentación *</Label>
              <Input 
                id="fecha_presentacion" 
                type="date" 
                value={formData.fecha_presentacion} 
                onChange={e => setFormData({...formData, fecha_presentacion: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="porcentaje_ejecutado">% Avance Ejecutado *</Label>
              <Input 
                id="porcentaje_ejecutado" 
                type="number" 
                step="0.1" 
                value={formData.porcentaje_ejecutado} 
                onChange={e => setFormData({...formData, porcentaje_ejecutado: e.target.value})} 
                placeholder="Ej. 15.5" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_ejecutado">Monto Valor Ganado ($) *</Label>
              <Input 
                id="monto_ejecutado" 
                type="number" 
                value={formData.monto_ejecutado} 
                onChange={e => setFormData({...formData, monto_ejecutado: e.target.value})} 
                placeholder="350000" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas de la Estimación</Label>
            <textarea 
              id="notas" 
              value={formData.notas} 
              onChange={e => setFormData({...formData, notas: e.target.value})}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ej. Estimación #1 correspondiente al colado de losa de cimentación."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Estimación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

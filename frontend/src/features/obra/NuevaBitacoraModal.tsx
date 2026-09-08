import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, WifiOff, X, Package, Trash2, Camera } from 'lucide-react'

export function NuevaBitacoraModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    proyecto: '',
    cuadrilla: '',
    porcentaje_avance: 0,
    incidencias: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  const [fotosSubidas, setFotosSubidas] = useState<any[]>([])
  const [consumosMaterial, setConsumosMaterial] = useState<Array<{ material: string; cantidad: string; unidad: string }>>([
    { material: '', cantidad: '', unidad: 'pza' }
  ])

  const queryClient = useQueryClient()

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-lista-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: cuadrillasData } = useQuery({
    queryKey: ['cuadrillas-modal', formData.proyecto],
    queryFn: async () => {
      if (!formData.proyecto) return []
      try {
        const { data } = await api.get(`/obra/cuadrillas/?proyecto=${formData.proyecto}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
    enabled: !!formData.proyecto
  })

  const proyectos = Array.isArray(proyectosData) ? proyectosData : []
  const cuadrillas = Array.isArray(cuadrillasData) ? cuadrillasData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { 
        ...data, 
        porcentaje_avance: Number(data.porcentaje_avance) || 0,
        fotos: fotosSubidas.map(f => ({ archivo: f.file_path })),
        consumos: consumosMaterial
          .filter(c => c.material.trim() && parseFloat(c.cantidad) > 0)
          .map(c => ({ material: c.material, cantidad: parseFloat(c.cantidad), unidad: c.unidad }))
      }
      const { data: res } = await api.post('/obra/bitacoras/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitacoras'] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      toast.success('Bitácora de Obra registrada exitosamente')
      setOpen(false)
    },
    onError: () => {
      toast.error('Error al registrar Bitácora')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proyecto) {
      toast.error('Debes seleccionar un proyecto de la lista')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4" /> Nueva Bitácora de Obra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capturar Jornada de Obra & Avance Físico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto Activo *</Label>
              <select 
                id="proyecto" 
                value={formData.proyecto} 
                onChange={e => setFormData({...formData, proyecto: e.target.value, cuadrilla: ''})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-semibold"
                required
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar proyecto...</option>
                {proyectos.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuadrilla">Cuadrilla Asignada</Label>
              <select 
                id="cuadrilla" 
                value={formData.cuadrilla} 
                onChange={e => setFormData({...formData, cuadrilla: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm"
                disabled={!formData.proyecto}
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar cuadrilla...</option>
                {cuadrillas.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Reporte *</Label>
              <Input id="fecha" type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avance">% Avance Físico *</Label>
              <Input id="avance" type="number" min="0" max="100" value={formData.porcentaje_avance} onChange={e => setFormData({...formData, porcentaje_avance: Number(e.target.value) || 0})} placeholder="45" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incidencias">Observaciones</Label>
            <textarea 
              id="incidencias" 
              value={formData.incidencias} 
              onChange={e => setFormData({...formData, incidencias: e.target.value})}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              placeholder="Avance de obra..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white font-bold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Bitácora
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

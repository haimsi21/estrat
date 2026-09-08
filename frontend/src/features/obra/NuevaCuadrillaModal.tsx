import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Users, Loader2 } from 'lucide-react'

export function NuevaCuadrillaModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    proyecto: '',
  })

  const queryClient = useQueryClient()

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-cuadrilla'],
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
      const { data: res } = await api.post('/obra/cuadrillas/', data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuadrillas'] })
      toast.success('Cuadrilla de Obra creada exitosamente')
      setOpen(false)
      setFormData({ nombre: '', proyecto: '' })
    },
    onError: (error: any) => {
      toast.error('Error al crear cuadrilla', {
        description: error.response?.data?.detail || 'Verifica los campos.'
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.proyecto) {
      toast.error('Nombre de Cuadrilla y Proyecto son requeridos')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" /> Nueva Cuadrilla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Alta de Cuadrilla de Trabajo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Cuadrilla *</Label>
            <Input 
              id="nombre" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              placeholder="Ej. Cuadrilla Alpha - Cimentación & Estructura"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proyecto">Proyecto Asignado *</Label>
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

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cuadrilla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

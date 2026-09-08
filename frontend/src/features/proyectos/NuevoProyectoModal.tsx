import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

export function NuevoProyectoModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    empresa: '',
    presupuesto_total: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin_estimada: '',
  })
  const queryClient = useQueryClient()

  // Cargar Clientes
  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const { data } = await api.get('/core/clientes/')
      return Array.isArray(data) ? data : (data.results || [])
    }
  })

  // Cargar Empresas
  const { data: empresas } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: async () => {
      const { data } = await api.get('/core/empresas/')
      return Array.isArray(data) ? data : (data.results || [])
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        nombre: data.nombre,
        cliente: data.cliente,
        empresa: data.empresa,
        presupuesto_total: parseFloat(data.presupuesto_total) || 0,
        fecha_inicio: data.fecha_inicio,
        fecha_fin_estimada: data.fecha_fin_estimada || data.fecha_inicio,
        activo: true
      }
      const { data: res } = await api.post('/proyectos/proyectos/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      toast.success('Proyecto creado exitosamente', { description: 'El hub central ha sido actualizado.' })
      setOpen(false)
      setFormData({ 
        nombre: '', 
        cliente: '', 
        empresa: '', 
        presupuesto_total: '', 
        fecha_inicio: new Date().toISOString().split('T')[0], 
        fecha_fin_estimada: '' 
      })
    },
    onError: (error: any) => {
      toast.error('Error al crear proyecto', { description: error.response?.data?.detail || 'Verifica los datos obligatorios' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre || !formData.cliente || !formData.empresa || !formData.presupuesto_total) {
      toast.error('Faltan datos obligatorios', { description: 'Nombre, Cliente, Empresa y Presupuesto son requeridos.' })
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Proyecto *</Label>
            <Input 
              id="nombre" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              placeholder="Ej. Torre Mirador 42" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <select 
                id="cliente" 
                value={formData.cliente} 
                onChange={e => setFormData({...formData, cliente: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clientes?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre_comercial || c.razon_social}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa Responsable *</Label>
              <select 
                id="empresa" 
                value={formData.empresa} 
                onChange={e => setFormData({...formData, empresa: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Seleccionar empresa...</option>
                {empresas?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presupuesto">Presupuesto Total (MXN) *</Label>
            <Input 
              id="presupuesto" 
              type="number" 
              value={formData.presupuesto_total} 
              onChange={e => setFormData({...formData, presupuesto_total: e.target.value})} 
              placeholder="5000000" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Fecha de Inicio *</Label>
              <Input 
                id="inicio" 
                type="date" 
                value={formData.fecha_inicio} 
                onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fin">Fecha Fin Estimada *</Label>
              <Input 
                id="fin" 
                type="date" 
                value={formData.fecha_fin_estimada} 
                onChange={e => setFormData({...formData, fecha_fin_estimada: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Proyecto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

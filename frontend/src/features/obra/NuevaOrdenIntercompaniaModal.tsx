import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Building2, Loader2 } from 'lucide-react'

export function NuevaOrdenIntercompaniaModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    proyecto: '',
    empresa_origen: '',
    empresa_destino: '',
    concepto: '',
    monto_interno: '',
    fecha_entrega_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const queryClient = useQueryClient()

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-orden-ic'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-orden-ic'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const proyectos = Array.isArray(proyectosData) ? proyectosData : []
  const empresas = Array.isArray(empresasData) ? empresasData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        monto_interno: parseFloat(data.monto_interno) || 0,
      }
      const { data: res } = await api.post('/obra/ordenes-intercompania/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-intercompania'] })
      toast.success('Orden Intercompañía generada exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al generar Orden Intercompañía', {
        description: error.response?.data?.detail || 'Verifica los campos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      proyecto: '',
      empresa_origen: '',
      empresa_destino: '',
      concepto: '',
      monto_interno: '',
      fecha_entrega_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proyecto || !formData.empresa_origen || !formData.empresa_destino || !formData.monto_interno) {
      toast.error('Proyecto, Empresas y Monto son requeridos')
      return
    }
    if (formData.empresa_origen === formData.empresa_destino) {
      toast.error('La empresa origen y destino no pueden ser la misma')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-purple-500 text-purple-700 dark:text-purple-400">
          <Building2 className="h-4 w-4" /> Orden Intercompañía
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Generar Contratación Intercompañía (Holding)
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
              <Label htmlFor="empresa_origen">Empresa Contratante *</Label>
              <select 
                id="empresa_origen" 
                value={formData.empresa_origen} 
                onChange={e => setFormData({...formData, empresa_origen: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Seleccionar contratante...</option>
                {empresas.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa_destino">Empresa Prestadora *</Label>
              <select 
                id="empresa_destino" 
                value={formData.empresa_destino} 
                onChange={e => setFormData({...formData, empresa_destino: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Seleccionar prestadora...</option>
                {empresas.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto de Contratación Interna *</Label>
            <Input 
              id="concepto" 
              value={formData.concepto} 
              onChange={e => setFormData({...formData, concepto: e.target.value})} 
              placeholder="Ej. Proyecto Ejecutivo & Modelado 3D / Mobiliario Taller" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_interno">Monto Interno ($ MXN) *</Label>
              <Input 
                id="monto_interno" 
                type="number" 
                value={formData.monto_interno} 
                onChange={e => setFormData({...formData, monto_interno: e.target.value})} 
                placeholder="150000" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_entrega_estimada">Fecha Entrega *</Label>
              <Input 
                id="fecha_entrega_estimada" 
                type="date" 
                value={formData.fecha_entrega_estimada} 
                onChange={e => setFormData({...formData, fecha_entrega_estimada: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Orden Intercompañía
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

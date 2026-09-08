import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, Factory } from 'lucide-react'

export function NuevoPedidoModal() {
  const [open, setOpen] = useState(false)
  const [tipoCliente, setTipoCliente] = useState<'nuevo' | 'existente'>('nuevo')
  const [formData, setFormData] = useState({
    nombre_prospecto: '',
    cliente: '',
    proyecto: '',
    tipo_objeto: '',
    especificaciones: '',
    fecha_entrega: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estatus: 'diseno',
  })

  const queryClient = useQueryClient()

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-prod-modal'],
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
    queryKey: ['proyectos-prod-modal'],
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
      const { data: res } = await api.post('/produccion/pedidos/', data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] })
      toast.success('Ticket / Pedido de Taller registrado exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar pedido', {
        description: error.response?.data?.detail || 'Verifica los campos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      nombre_prospecto: '',
      cliente: '',
      proyecto: '',
      tipo_objeto: '',
      especificaciones: '',
      fecha_entrega: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estatus: 'diseno',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo_objeto.trim()) {
      toast.error('El tipo de objeto/mueble es obligatorio')
      return
    }
    if (tipoCliente === 'nuevo' && !formData.nombre_prospecto.trim()) {
      toast.error('Nombre del cliente/prospecto es requerido')
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
        <Button className="gap-2 bg-[#c5a059] hover:bg-[#b38f46] text-black font-bold shadow-md">
          <Plus className="h-4 w-4" /> Nuevo Ticket / Pedido de Taller
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Factory className="h-5 w-5 text-[#c5a059]" />
            Alta de Ticket / Pedido de Producción
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex rounded-md bg-muted p-1 text-xs">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'nuevo' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => {
                setTipoCliente('nuevo')
                setFormData({...formData, cliente: ''})
              }}
            >
              🆕 Nuevo Prospecto / Cliente
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${tipoCliente === 'existente' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => {
                setTipoCliente('existente')
                setFormData({...formData, nombre_prospecto: ''})
              }}
            >
              🏢 Cliente Existente
            </button>
          </div>

          {tipoCliente === 'nuevo' ? (
            <div className="space-y-2 p-3 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-md">
              <Label htmlFor="nombre_prospecto">Nombre del Cliente / Empresa *</Label>
              <Input 
                id="nombre_prospecto" 
                value={formData.nombre_prospecto} 
                onChange={e => setFormData({...formData, nombre_prospecto: e.target.value})} 
                placeholder="Ej. Inmobiliaria Lomas / Lic. Carlos Ruiz"
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required={tipoCliente === 'existente'}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre_comercial || c.razon_social}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo_objeto">Objeto / Mueble a Medida (Ticket) *</Label>
            <Input 
              id="tipo_objeto" 
              value={formData.tipo_objeto} 
              onChange={e => setFormData({...formData, tipo_objeto: e.target.value})} 
              placeholder="Ej. Cocina Integral Granito Negro / Clóset Encino"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto Vinculado (Opcional)</Label>
              <select 
                id="proyecto" 
                value={formData.proyecto} 
                onChange={e => setFormData({...formData, proyecto: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Pedido Independiente...</option>
                {proyectos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_entrega">Fecha Compromiso Entrega *</Label>
              <Input 
                id="fecha_entrega" 
                type="date" 
                value={formData.fecha_entrega} 
                onChange={e => setFormData({...formData, fecha_entrega: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estatus">Estado Inicial</Label>
            <select 
              id="estatus" 
              value={formData.estatus} 
              onChange={e => setFormData({...formData, estatus: e.target.value})}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="diseno">En Diseño / Planos de Taller</option>
              <option value="taller">En Taller (Fabricación)</option>
              <option value="entrega">Listo para Entrega / Instalación</option>
              <option value="entregado">Entregado al Cliente</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especificaciones">Especificaciones Técnicas / Materiales & Herrajes</Label>
            <textarea 
              id="especificaciones" 
              value={formData.especificaciones} 
              onChange={e => setFormData({...formData, especificaciones: e.target.value})}
              className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ej. Madera de encino en acabado mate, cubierta granito San Gabriel 2cm."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-[#c5a059] hover:bg-[#b38f46] text-black font-bold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

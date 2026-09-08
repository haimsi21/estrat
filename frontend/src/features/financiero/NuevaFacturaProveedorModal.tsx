import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, ShoppingBag } from 'lucide-react'

export function NuevaFacturaProveedorModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    proveedor_nombre: '',
    empresa: '',
    proyecto: '',
    concepto: '',
    monto: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pagada: false,
  })

  const queryClient = useQueryClient()

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-cxp-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-cxp-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const empresas = Array.isArray(empresasData) ? empresasData : []
  const proyectos = Array.isArray(proyectosData) ? proyectosData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        monto: parseFloat(data.monto) || 0,
        saldo_pendiente: data.pagada ? 0 : (parseFloat(data.monto) || 0),
        proyecto: data.proyecto || null
      }
      const { data: res } = await api.post('/financiero/cxp/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxp'] })
      queryClient.invalidateQueries({ queryKey: ['pnl'] })
      queryClient.invalidateQueries({ queryKey: ['flujo-caja'] })
      queryClient.invalidateQueries({ queryKey: ['reporte-inversionistas'] })
      toast.success('Factura de Proveedor (CxP) registrada exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar factura de proveedor', {
        description: error.response?.data?.detail || 'Verifica los campos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      proveedor_nombre: '',
      empresa: '',
      proyecto: '',
      concepto: '',
      monto: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pagada: false,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proveedor_nombre || !formData.empresa || !formData.monto) {
      toast.error('Proveedor, Empresa y Monto son requeridos')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-amber-500 text-amber-700 dark:text-amber-400">
          <ShoppingBag className="h-4 w-4" /> Registrar CxP Proveedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-600" />
            Cuentas por Pagar (CxP) — Proveedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="proveedor_nombre">Nombre del Proveedor / Contratista *</Label>
            <Input 
              id="proveedor_nombre" 
              value={formData.proveedor_nombre} 
              onChange={e => setFormData({...formData, proveedor_nombre: e.target.value})} 
              placeholder="Ej. Cementos Moctezuma / Aceros de México" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa Pagadora (Holding) *</Label>
              <select 
                id="empresa" 
                value={formData.empresa} 
                onChange={e => setFormData({...formData, empresa: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Seleccionar empresa...</option>
                {empresas.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proyecto">Proyecto Imputable (Opcional)</Label>
              <select 
                id="proyecto" 
                value={formData.proyecto} 
                onChange={e => setFormData({...formData, proyecto: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Gasto General de Operación...</option>
                {proyectos.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto / Descripción del Insumo *</Label>
            <Input 
              id="concepto" 
              value={formData.concepto} 
              onChange={e => setFormData({...formData, concepto: e.target.value})} 
              placeholder="Ej. Suministro de 500 bultos de cemento gris y aditivo" 
              required 
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($ MXN) *</Label>
              <Input 
                id="monto" 
                type="number" 
                value={formData.monto} 
                onChange={e => setFormData({...formData, monto: e.target.value})} 
                placeholder="125000" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_emision">Fecha Emisión *</Label>
              <Input 
                id="fecha_emision" 
                type="date" 
                value={formData.fecha_emision} 
                onChange={e => setFormData({...formData, fecha_emision: e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Vencimiento CxP *</Label>
              <Input 
                id="fecha_vencimiento" 
                type="date" 
                value={formData.fecha_vencimiento} 
                onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="pagada" 
              checked={formData.pagada} 
              onChange={e => setFormData({...formData, pagada: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <Label htmlFor="pagada" className="cursor-pointer text-sm font-medium">
              Marcar como Pagada a Proveedor (Egreso realizado)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar CxP Proveedor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

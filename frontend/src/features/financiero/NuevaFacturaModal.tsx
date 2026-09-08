import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Loader2, DollarSign, Building2, Trash2 } from 'lucide-react'

export function NuevaFacturaModal() {
  const [open, setOpen] = useState(false)
  const [tipoCliente, setTipoCliente] = useState<'nuevo' | 'existente'>('nuevo')
  const [formData, setFormData] = useState({
    nombre_prospecto: '',
    cliente: '',
    folio_fiscal: '',
    fecha: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pagada: false,
  })

  const [detalles, setDetalles] = useState<Array<{ concepto: string; monto: string; empresa: string; modulo_origen: string }>>([
    { concepto: 'Servicios de Gestión & Construcción', monto: '', empresa: '', modulo_origen: 'proyecto' }
  ])

  const queryClient = useQueryClient()

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-fin'],
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
    queryKey: ['empresas-fin'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const clientes = Array.isArray(clientesData) ? clientesData : []
  const empresas = Array.isArray(empresasData) ? empresasData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        detalles: detalles.map(d => ({
          concepto: d.concepto,
          monto: parseFloat(d.monto) || 0,
          empresa: d.empresa,
          modulo_origen: d.modulo_origen
        }))
      }
      const { data: res } = await api.post('/financiero/facturas/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] })
      queryClient.invalidateQueries({ queryKey: ['cxc'] })
      queryClient.invalidateQueries({ queryKey: ['pnl'] })
      queryClient.invalidateQueries({ queryKey: ['reporte-inversionistas'] })
      toast.success('Factura registrada con desglose contable por empresa', {
        description: 'Actualizados los registros consolidados y cuentas por cobrar.'
      })
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al emitir factura', {
        description: error.response?.data?.detail || 'Verifica los datos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      nombre_prospecto: '',
      cliente: '',
      folio_fiscal: '',
      fecha: new Date().toISOString().split('T')[0],
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pagada: false,
    })
    setDetalles([{ concepto: 'Servicios de Gestión & Construcción', monto: '', empresa: '', modulo_origen: 'proyecto' }])
  }

  const handleAgregarDetalle = () => {
    setDetalles(prev => [...prev, { concepto: 'Servicios de Arquitectura / Diseño', monto: '', empresa: '', modulo_origen: 'arquitectura' }])
  }

  const handleRemoverDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDetalleChange = (index: number, field: string, value: string) => {
    setDetalles(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tipoCliente === 'nuevo' && !formData.nombre_prospecto.trim()) {
      toast.error('Nombre del cliente/empresa es obligatorio')
      return
    }
    if (tipoCliente === 'existente' && !formData.cliente) {
      toast.error('Selecciona un cliente de la lista')
      return
    }

    const algunDetalleValido = detalles.some(d => d.empresa && parseFloat(d.monto) > 0)
    if (!algunDetalleValido) {
      toast.error('Debes agregar al menos un desglose con Empresa y Monto mayor a 0')
      return
    }

    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4" /> Emitir Factura Consolidada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Nueva Factura Consolidada por Cliente
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
              🆕 Nuevo Cliente / Empresa
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
            <div className="space-y-2 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
              <Label htmlFor="nombre_prospecto">Nombre o Razón Social del Cliente *</Label>
              <Input 
                id="nombre_prospecto" 
                value={formData.nombre_prospecto} 
                onChange={e => setFormData({...formData, nombre_prospecto: e.target.value})} 
                placeholder="Ej. Grupo Inmobiliario Valle S.A. de C.V."
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="folio_fiscal">Folio Fiscal / CFDI UUID (Opcional)</Label>
              <Input 
                id="folio_fiscal" 
                value={formData.folio_fiscal} 
                onChange={e => setFormData({...formData, folio_fiscal: e.target.value})} 
                placeholder="FACT-2026-98124" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha Emisión *</Label>
              <Input 
                id="fecha" 
                type="date" 
                value={formData.fecha} 
                onChange={e => setFormData({...formData, fecha: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-md bg-card">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="pagada" 
                checked={formData.pagada} 
                onChange={e => setFormData({...formData, pagada: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="pagada" className="cursor-pointer text-sm font-medium">
                ¿Factura Pagada?
              </Label>
            </div>

            {!formData.pagada && (
              <div className="flex items-center gap-2">
                <Label htmlFor="vencimiento" className="text-xs text-muted-foreground">Vencimiento CxC:</Label>
                <Input 
                  id="vencimiento" 
                  type="date" 
                  value={formData.fecha_vencimiento} 
                  onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})}
                  className="h-7 text-xs w-36"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm flex items-center gap-1">
                <Building2 className="h-4 w-4 text-primary" /> Desglose Contable por Empresa del Holding
              </Label>
              <Button type="button" size="sm" variant="ghost" onClick={handleAgregarDetalle} className="text-xs text-primary gap-1">
                <Plus className="h-3.5 w-3.5" /> Agregar Línea
              </Button>
            </div>

            <div className="space-y-2">
              {detalles.map((det, index) => (
                <div key={index} className="flex gap-2 items-center p-2 border rounded-md bg-muted/30">
                  <select 
                    value={det.empresa} 
                    onChange={e => handleDetalleChange(index, 'empresa', e.target.value)}
                    className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs w-40"
                    required
                  >
                    <option value="">Empresa Holding...</option>
                    {empresas.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>

                  <Input 
                    placeholder="Concepto (Ej. Servicios de Arquitectura / Obra)" 
                    value={det.concepto} 
                    onChange={e => handleDetalleChange(index, 'concepto', e.target.value)}
                    className="flex-1 text-xs h-8"
                    required
                  />

                  <Input 
                    type="number" 
                    placeholder="Monto ($)" 
                    value={det.monto} 
                    onChange={e => handleDetalleChange(index, 'monto', e.target.value)}
                    className="w-28 text-xs h-8"
                    required
                  />

                  {detalles.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoverDetalle(index)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Emitir Factura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

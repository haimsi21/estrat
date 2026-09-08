import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'

export function NuevoEmpleadoModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    puesto: '',
    empresa: '',
    cuadrilla: '',
    salario: '',
    fecha_contrato: new Date().toISOString().split('T')[0],
    activo: true,
  })

  const queryClient = useQueryClient()

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-rrhh-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: cuadrillasData } = useQuery({
    queryKey: ['cuadrillas-rrhh-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/obra/cuadrillas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const empresas = Array.isArray(empresasData) ? empresasData : []
  const cuadrillas = Array.isArray(cuadrillasData) ? cuadrillasData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        salario: parseFloat(data.salario) || 0,
        cuadrilla: data.cuadrilla || null,
      }
      const { data: res } = await api.post('/rrhh/empleados/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] })
      toast.success('Empleado registrado exitosamente en la plantilla fija del holding')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar empleado', {
        description: error.response?.data?.detail || 'Verifica los campos obligatorios.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      puesto: '',
      empresa: '',
      cuadrilla: '',
      salario: '',
      fecha_contrato: new Date().toISOString().split('T')[0],
      activo: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre_completo || !formData.puesto || !formData.empresa || !formData.salario) {
      toast.error('Nombre, Puesto, Empresa y Salario son obligatorios')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#c5a059] hover:bg-[#b38f46] text-black font-semibold">
          <UserPlus className="h-4 w-4" /> Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-[#c5a059]" />
            Alta de Empleado en Plantilla Fija
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo *</Label>
            <Input 
              id="nombre_completo" 
              value={formData.nombre_completo} 
              onChange={e => setFormData({...formData, nombre_completo: e.target.value})} 
              placeholder="Ej. Arq. Miguel Hernández Morales" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto / Cargo *</Label>
              <Input 
                id="puesto" 
                value={formData.puesto} 
                onChange={e => setFormData({...formData, puesto: e.target.value})} 
                placeholder="Ej. Residente de Obra / Diseñador 3D" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa del Holding *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salario">Salario Mensual (MXN) *</Label>
              <Input 
                id="salario" 
                type="number" 
                value={formData.salario} 
                onChange={e => setFormData({...formData, salario: e.target.value})} 
                placeholder="25000" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_contrato">Fecha de Contratación *</Label>
              <Input 
                id="fecha_contrato" 
                type="date" 
                value={formData.fecha_contrato} 
                onChange={e => setFormData({...formData, fecha_contrato: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuadrilla">Cuadrilla de Obra Asignada (Opcional)</Label>
            <select 
              id="cuadrilla" 
              value={formData.cuadrilla} 
              onChange={e => setFormData({...formData, cuadrilla: e.target.value})}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Sin cuadrilla asignada...</option>
              {cuadrillas.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-[#c5a059] hover:bg-[#b38f46] text-black font-semibold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Empleado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

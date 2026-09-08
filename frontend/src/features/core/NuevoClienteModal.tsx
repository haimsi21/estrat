import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Users, Loader2, Plus, Building2 } from 'lucide-react'

export function NuevoClienteModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    razon_social: '',
    nombre_comercial: '',
    rfc: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    empresas_relacionadas: [] as string[],
    activo: true,
  })

  const queryClient = useQueryClient()

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-cliente-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const empresas = Array.isArray(empresasData) ? empresasData : []

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post('/core/clientes/', data)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-core'] })
      queryClient.invalidateQueries({ queryKey: ['clientes-select'] })
      toast.success('Cliente registrado exitosamente en la base de datos del Holding')
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error al registrar cliente', {
        description: error.response?.data?.detail || 'Verifica los campos.'
      })
    }
  })

  const resetForm = () => {
    setFormData({
      razon_social: '',
      nombre_comercial: '',
      rfc: '',
      contacto_nombre: '',
      contacto_telefono: '',
      contacto_email: '',
      empresas_relacionadas: [],
      activo: true,
    })
  }

  const handleEmpresaToggle = (empresaId: string) => {
    setFormData(prev => {
      const exists = prev.empresas_relacionadas.includes(empresaId)
      const updated = exists 
        ? prev.empresas_relacionadas.filter(id => id !== empresaId)
        : [...prev.empresas_relacionadas, empresaId]
      return { ...prev, empresas_relacionadas: updated }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.razon_social.trim()) {
      toast.error('La Razón Social o Nombre Comercial es obligatorio')
      return
    }
    mutation.mutate({
      ...formData,
      nombre_comercial: formData.nombre_comercial || formData.razon_social
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Alta de Cliente Formal del Holding
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="razon_social">Razón Social / Nombre Legal *</Label>
            <Input 
              id="razon_social" 
              value={formData.razon_social} 
              onChange={e => setFormData({...formData, razon_social: e.target.value})} 
              placeholder="Ej. Inmobiliaria & Desarrollos del Valle S.A. de C.V." 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
              <Input 
                id="nombre_comercial" 
                value={formData.nombre_comercial} 
                onChange={e => setFormData({...formData, nombre_comercial: e.target.value})} 
                placeholder="Ej. Inmobiliaria Valle" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc">RFC Fiscal</Label>
              <Input 
                id="rfc" 
                value={formData.rfc} 
                onChange={e => setFormData({...formData, rfc: e.target.value})} 
                placeholder="IVA900101ABC" 
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold text-muted-foreground">Datos del Contacto Principal</Label>
            <div className="space-y-2">
              <Input 
                placeholder="Nombre de Contacto (Ej. Lic. Roberto Gómez)" 
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="email"
                  placeholder="Correo Electrónico" 
                  value={formData.contacto_email} 
                  onChange={e => setFormData({...formData, contacto_email: e.target.value})} 
                />
                <Input 
                  placeholder="Teléfono" 
                  value={formData.contacto_telefono} 
                  onChange={e => setFormData({...formData, contacto_telefono: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold text-muted-foreground">Empresas con las que Opera en el Holding:</Label>
            <div className="flex gap-2">
              {empresas.map((emp: any) => {
                const isSelected = formData.empresas_relacionadas.includes(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleEmpresaToggle(emp.id)}
                    className={`flex-1 py-1.5 px-2 rounded border text-xs font-medium transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-input'}`}
                  >
                    <Building2 className="h-3 w-3 inline mr-1" />
                    {emp.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

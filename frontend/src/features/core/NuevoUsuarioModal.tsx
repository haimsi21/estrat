import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Shield, Loader2, Plus, Building2, User, Sparkles, Layers } from 'lucide-react'

const TODOS_MODULOS = [
  { key: 'dashboard', label: 'Dashboard C-Suite' },
  { key: 'comercial', label: 'Comercial (CRM)' },
  { key: 'proyectos', label: 'Proyectos & EVM' },
  { key: 'arquitectura', label: 'Arquitectura & 3D' },
  { key: 'obra', label: 'Obra & Terreno' },
  { key: 'produccion', label: 'Producción & Taller' },
  { key: 'financiero', label: 'Financiero & Tesorería' },
  { key: 'compras', label: 'Compras (Procurement)' },
  { key: 'legal', label: 'Legal & Licencias' },
  { key: 'posventa', label: 'Posventa & Garantías' },
  { key: 'rrhh', label: 'Recursos Humanos' },
  { key: 'bitacora', label: 'Mi Bitácora & SLA' },
  { key: 'core', label: 'Administración (Core)' },
]

const ORDEN_CAPAS: Record<string, number> = {
  'direccion': 1,
  'jefe_area': 2,
  'coordinador': 3,
  'operativo': 4,
  'cliente_external': 5,
}

export function NuevoUsuarioModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    puesto: '',
    departamento: 'comercial',
    reporta_a: '',
    cliente_asociado: '',
    password: '432432',
    rol: '',
    monto_autorizacion_max: '100000',
    empresas: [] as string[],
    modulos_permitidos: ['comercial', 'bitacora'] as string[],
    is_active: true,
  })

  const queryClient = useQueryClient()

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-usuario-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles-usuario-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/roles/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-jefes-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/usuarios/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-asociar-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/clientes/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const empresas = Array.isArray(empresasData) ? empresasData : []
  const roles = Array.isArray(rolesData) ? rolesData : []
  const jefes = Array.isArray(usuariosData) ? usuariosData : []
  const clientes = Array.isArray(clientesData) ? clientesData : []

  const rolesOrdenados = [...roles].sort((a: any, b: any) => {
    const ordenA = ORDEN_CAPAS[a.capa] || 99
    const ordenB = ORDEN_CAPAS[b.capa] || 99
    return ordenA - ordenB
  })

  const rolSeleccionadoObj = roles.find((r: any) => String(r.id) === String(formData.rol))
  const esClienteExternal = rolSeleccionadoObj?.capa === 'cliente_external' || formData.departamento === 'cliente'

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        monto_autorizacion_max: parseFloat(data.monto_autorizacion_max) || 0,
        reporta_a: data.reporta_a || null,
        cliente_asociado: data.cliente_asociado || null,
        rol: data.rol || null
      }
      const { data: res } = await api.post('/core/usuarios/', payload)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-core'] })
      toast.success('Cuenta de usuario configurada exitosamente')
      setOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error('Error al crear usuario')
    }
  })

  const resetForm = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      puesto: '',
      departamento: 'comercial',
      reporta_a: '',
      cliente_asociado: '',
      password: '432432',
      rol: '',
      monto_autorizacion_max: '100000',
      empresas: [],
      modulos_permitidos: ['comercial', 'bitacora'],
      is_active: true,
    })
  }

  const handleEmpresaToggle = (empresaId: string) => {
    setFormData(prev => {
      const exists = prev.empresas.includes(empresaId)
      const updated = exists 
        ? prev.empresas.filter(id => id !== empresaId)
        : [...prev.empresas, empresaId]
      return { ...prev, empresas: updated }
    })
  }

  const handleModuloToggle = (key: string) => {
    setFormData(prev => {
      const exists = prev.modulos_permitidos.includes(key)
      const updated = exists 
        ? prev.modulos_permitidos.filter(k => k !== key)
        : [...prev.modulos_permitidos, key]
      return { ...prev, modulos_permitidos: updated }
    })
  }

  const aplicarPreset = (preset: string) => {
    switch (preset) {
      case 'vendedor':
        setFormData(prev => ({
          ...prev,
          puesto: 'Ejecutivo Comercial',
          departamento: 'comercial',
          monto_autorizacion_max: '50000',
          modulos_permitidos: ['comercial', 'bitacora']
        }))
        break
      case 'arquitecto':
        setFormData(prev => ({
          ...prev,
          puesto: 'Arquitecto Diseñador 3D',
          departamento: 'arquitectura',
          monto_autorizacion_max: '100000',
          modulos_permitidos: ['arquitectura', 'proyectos', 'bitacora']
        }))
        break
      case 'residente':
        setFormData(prev => ({
          ...prev,
          puesto: 'Residente Obra & Terreno',
          departamento: 'obra',
          monto_autorizacion_max: '200000',
          modulos_permitidos: ['obra', 'proyectos', 'compras', 'bitacora']
        }))
        break
      case 'cliente':
        setFormData(prev => ({
          ...prev,
          puesto: 'Portal del Cliente (Externo)',
          departamento: 'cliente',
          monto_autorizacion_max: '0',
          modulos_permitidos: ['proyectos', 'arquitectura']
        }))
        break
      case 'csuite':
        setFormData(prev => ({
          ...prev,
          puesto: 'Director de Operaciones / C-Suite',
          departamento: 'direccion',
          monto_autorizacion_max: '10000000',
          modulos_permitidos: TODOS_MODULOS.map(m => m.key)
        }))
        break
    }
    toast.info(`Preset '${preset.toUpperCase()}' aplicado`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim()) {
      toast.error('Nombre de usuario es obligatorio')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold">
          <Plus className="h-4 w-4" /> Nuevo Usuario & Matriz 5 Niveles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Alta de Cuenta & Matriz de Gobierno 5 Niveles
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg space-y-1 text-xs">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Presets Rápidos de Acceso:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={() => aplicarPreset('vendedor')} className="h-6 text-[10px]">📈 Vendedor</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => aplicarPreset('arquitecto')} className="h-6 text-[10px]">📐 Arquitecto 3D</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => aplicarPreset('residente')} className="h-6 text-[10px]">🏗️ Residente Obra</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => aplicarPreset('cliente')} className="h-6 text-[10px] border-blue-500 text-blue-600">🏢 Portal Cliente</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => aplicarPreset('csuite')} className="h-6 text-[10px] bg-purple-600 text-white hover:bg-purple-700">👑 Director / C-Suite</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario (Login) *</Label>
              <Input 
                id="username" 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                placeholder="Ej. roberto.ventas / cliente.valle" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña Inicial</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="432432" 
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre(s)</Label>
              <Input 
                id="first_name" 
                value={formData.first_name} 
                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                placeholder="Carlos" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos</Label>
              <Input 
                id="last_name" 
                value={formData.last_name} 
                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                placeholder="Pérez" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rol">Capa de Acceso / Rol de Seguridad *</Label>
              <select 
                id="rol" 
                value={formData.rol} 
                onChange={e => setFormData({...formData, rol: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-semibold"
                required
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar capa de acceso...</option>
                {rolesOrdenados.map((r: any) => (
                  <option key={r.id} value={r.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento RH</Label>
              <select 
                id="departamento" 
                value={formData.departamento} 
                onChange={e => setFormData({...formData, departamento: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-2 py-1 text-xs shadow-sm font-medium"
              >
                <option value="comercial" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Ventas & CRM</option>
                <option value="arquitectura" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Arquitectura & 3D</option>
                <option value="obra" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Obra & Terreno</option>
                <option value="produccion" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Producción & Taller</option>
                <option value="financiero" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Finanzas & Tesorería</option>
                <option value="compras" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Compras & Suministros</option>
                <option value="legal" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Legal & Licencias</option>
                <option value="rrhh" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Recursos Humanos</option>
                <option value="direccion" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Dirección General</option>
                <option value="cliente" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">🏢 Portal del Cliente (Externo)</option>
              </select>
            </div>
          </div>

          {esClienteExternal && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-900 rounded-lg space-y-2">
              <Label htmlFor="cliente_asociado" className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                <User className="h-4 w-4" /> Asociar a Cliente de la Base de Datos (Nivel 5):
              </Label>
              <select 
                id="cliente_asociado" 
                value={formData.cliente_asociado} 
                onChange={e => setFormData({...formData, cliente_asociado: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 px-3 py-1 text-xs shadow-sm font-semibold"
                required={esClienteExternal}
              >
                <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Seleccionar Cliente Autorizado...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{c.nombre_comercial || c.razon_social}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puesto">Puesto / Cargo Oficial *</Label>
              <Input 
                id="puesto" 
                value={formData.puesto} 
                onChange={e => setFormData({...formData, puesto: e.target.value})} 
                placeholder="Ej. Gerente Comercial" 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_autorizacion">Límite de Firma / Autorización ($ MXN)</Label>
              <Input 
                id="monto_autorizacion" 
                type="number"
                value={formData.monto_autorizacion_max} 
                onChange={e => setFormData({...formData, monto_autorizacion_max: e.target.value})} 
                placeholder="500000" 
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
              <Layers className="h-4 w-4 text-[#c5a059]" /> Matriz de Módulos Autorizados ({formData.modulos_permitidos.length} seleccionados):
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {TODOS_MODULOS.map((mod) => {
                const isSelected = formData.modulos_permitidos.includes(mod.key)
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => handleModuloToggle(mod.key)}
                    className={`p-2 rounded border text-left text-xs font-medium transition-all ${
                      isSelected 
                        ? 'bg-[#c5a059]/20 border-[#c5a059] text-foreground font-bold' 
                        : 'bg-muted/30 border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="block text-[11px] truncate">{mod.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold text-muted-foreground">Empresas Autorizadas del Holding:</Label>
            <div className="flex gap-2">
              {empresas.map((emp: any) => {
                const isSelected = formData.empresas.includes(emp.id)
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
            <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Usuario & Matriz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

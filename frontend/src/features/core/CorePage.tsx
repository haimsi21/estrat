import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Settings, Building2, Users, Shield, Loader2, Search, KeyRound } from 'lucide-react'
import { NuevoClienteModal } from './NuevoClienteModal'
import { NuevoUsuarioModal } from './NuevoUsuarioModal'

export function CorePage() {
  const [activeTab, setActiveTab] = useState<'empresas' | 'clientes' | 'usuarios'>('empresas')
  const [searchClient, setSearchClient] = useState('')
  const [searchUser, setSearchUser] = useState('')

  const queryClient = useQueryClient()

  const { data: empresasData, isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas-core'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/empresas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: clientesData, isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-core'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/clientes/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: usuariosData, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios-core'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/usuarios/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const mutationResetPass = useMutation({
    mutationFn: async (userId: number | string) => {
      const { data } = await api.post(`/core/usuarios/${userId}/resetear_password/`, { password: '432432' })
      return data
    },
    onSuccess: (data) => {
      toast.success(data.mensaje || 'Contraseña restablecida a 432432')
      queryClient.invalidateQueries({ queryKey: ['usuarios-core'] })
    },
    onError: () => {
      toast.error('No se pudo restablecer la contraseña')
    }
  })

  const empresas = Array.isArray(empresasData) ? empresasData : []
  const clientes = Array.isArray(clientesData) ? clientesData : []
  const usuarios = Array.isArray(usuariosData) ? usuariosData : []

  const clientesFiltrados = clientes.filter((c: any) =>
    (c.nombre_comercial || '').toLowerCase().includes(searchClient.toLowerCase()) ||
    (c.razon_social || '').toLowerCase().includes(searchClient.toLowerCase()) ||
    (c.rfc || '').toLowerCase().includes(searchClient.toLowerCase())
  )

  const usuariosFiltrados = usuarios.filter((u: any) =>
    (u.username || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.nombre_completo || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.puesto || '').toLowerCase().includes(searchUser.toLowerCase())
  )

  const isLoading = loadingEmpresas || loadingClientes || loadingUsuarios

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración (Core)</h1>
          <p className="text-muted-foreground">Configuración Global del Holding, Empresas, Clientes y Cuentas de Usuario</p>
        </div>
        <div className="flex items-center gap-3">
          <NuevoClienteModal />
          <NuevoUsuarioModal />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Holding</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{empresas.length}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{clientes.length}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios del Sistema</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{usuarios.length}</div></CardContent>
        </Card>
      </div>

      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'empresas' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('empresas')}
        >
          Empresas Holding ({empresas.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'clientes' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('clientes')}
        >
          Clientes ({clientes.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'usuarios' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('usuarios')}
        >
          Usuarios & Seguridad ({usuarios.length})
        </button>
      </div>

      {activeTab === 'empresas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Líneas de Negocio del Holding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {empresas.map((emp: any) => (
                <div key={emp.id} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{emp.nombre}</h3>
                    <Badge variant={emp.activa ? "success" : "secondary"}>
                      {emp.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{emp.razon_social || 'Razón Social no registrada'}</p>
                  <p className="text-xs font-mono text-muted-foreground bg-muted p-1.5 rounded">RFC: {emp.rfc || 'XAX010101000'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, razón social o RFC..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientesFiltrados.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-base">{c.nombre_comercial || c.razon_social}</h3>
                    <Badge variant={c.activo ? "success" : "secondary"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.razon_social}</p>
                  {c.rfc && <p className="text-xs font-mono text-muted-foreground">RFC: {c.rfc}</p>}
                  
                  {c.contacto_nombre && (
                    <div className="pt-2 border-t text-xs space-y-0.5">
                      <p className="font-medium text-foreground">Contacto: {c.contacto_nombre}</p>
                      {c.contacto_email && <p className="text-muted-foreground">{c.contacto_email}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {clientesFiltrados.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No se encontraron clientes. Haz clic en **"Nuevo Cliente"** para dar de alta.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario por login, nombre o puesto..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {usuariosFiltrados.map((u: any) => (
              <Card key={u.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base">{u.nombre_completo || u.username}</h3>
                      <Badge variant="outline" className="font-mono text-xs">{u.username}</Badge>
                      <Badge variant={u.is_active ? "success" : "secondary"}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.email || 'Sin correo'} • {u.puesto || 'Puesto no asignado'} {u.rol_nombre && `• Rol: ${u.rol_nombre}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={mutationResetPass.isPending}
                      onClick={() => mutationResetPass.mutate(u.id)}
                      className="gap-1.5 text-xs"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-600" /> Resetear Clave (432432)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {usuariosFiltrados.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No se encontraron usuarios. Haz clic en **"Nuevo Usuario"** para crear una cuenta.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

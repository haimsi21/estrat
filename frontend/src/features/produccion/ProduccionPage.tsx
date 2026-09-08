import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Factory, Search, Loader2, Calendar, User, Package, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NuevoPedidoModal } from './NuevoPedidoModal'

interface Pedido {
  id: string
  cliente?: string
  cliente_nombre?: string
  proyecto?: string | null
  proyecto_nombre?: string
  tipo_objeto?: string
  especificaciones?: string
  responsable_taller?: string | null
  responsable_nombre?: string
  fecha_entrega?: string
  estatus?: string
  estatus_display?: string
  creado_en?: string
}

export function ProduccionPage() {
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const navigate = useNavigate()

  const { data: pedidosData, isLoading } = useQuery({
    queryKey: ['pedidos', filtroEstatus],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (filtroEstatus) params.append('estatus', filtroEstatus)
        const { data } = await api.get(`/produccion/pedidos/?${params.toString()}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        console.error("Error cargando pedidos:", err)
        return []
      }
    },
  })

  const pedidos = Array.isArray(pedidosData) ? pedidosData : []

  const pedidosFiltrados = pedidos.filter((p: Pedido) =>
    (p.tipo_objeto || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.proyecto_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPedidos = pedidosFiltrados.length
  const enTaller = pedidosFiltrados.filter((p: Pedido) => p.estatus === 'taller').length
  const porEntregar = pedidosFiltrados.filter((p: Pedido) => {
    if (!p.fecha_entrega) return false
    const hoy = new Date()
    const entrega = new Date(p.fecha_entrega)
    const diasRestantes = Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diasRestantes <= 7 && diasRestantes >= 0 && p.estatus !== 'entregado'
  }).length

  const getEstatusColor = (estatus?: string) => {
    switch (estatus) {
      case 'diseno': return 'secondary'
      case 'taller': return 'warning'
      case 'entrega': return 'default'
      case 'entregado': return 'success'
      default: return 'secondary'
    }
  }

  const getDiasRestantes = (fechaEntrega?: string) => {
    if (!fechaEntrega) return 999
    const hoy = new Date()
    const entrega = new Date(fechaEntrega)
    return Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Producción & Taller</h1>
          <p className="text-muted-foreground">Control de pedidos de muebles/objetos a medida y tickets de taller</p>
        </div>
        <div className="flex items-center gap-3">
          <NuevoPedidoModal />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPedidos}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Fabricación (Taller)</CardTitle>
            <Factory className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{enTaller}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Entregar (Próx 7 días)</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{porEntregar}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por objeto, cliente o proyecto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Todos los estatus</option>
              <option value="diseno">En diseño</option>
              <option value="taller">En taller</option>
              <option value="entrega">En entrega</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido: Pedido) => {
            const diasRestantes = getDiasRestantes(pedido.fecha_entrega)
            const urgente = diasRestantes <= 7 && diasRestantes >= 0 && pedido.estatus !== 'entregado'
            
            return (
              <Card
                key={pedido.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${urgente ? 'border-red-200 dark:border-red-900' : ''}`}
                onClick={() => navigate(`/produccion/${pedido.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{pedido.tipo_objeto || 'Pedido'}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{pedido.cliente_nombre || 'Sin cliente'}</p>
                      {pedido.proyecto_nombre && (
                        <p className="text-xs text-muted-foreground font-medium">
                          Proyecto: {pedido.proyecto_nombre}
                        </p>
                      )}
                    </div>
                    <Badge variant={getEstatusColor(pedido.estatus)}>
                      {pedido.estatus_display || pedido.estatus}
                    </Badge>
                  </div>

                  {pedido.especificaciones && (
                    <div className="mb-4 p-3 bg-muted/60 rounded-md text-sm">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Especificaciones Técnicas:</p>
                      <p className="text-xs">{pedido.especificaciones}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {pedido.responsable_nombre && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {pedido.responsable_nombre}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Entrega: {pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString('es-MX') : 'N/A'}
                      </span>
                    </div>
                    
                    {urgente && (
                      <div className="flex items-center gap-1 text-red-600 font-bold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>¡Urgente! {diasRestantes} días restantes</span>
                      </div>
                    )}
                    
                    {pedido.estatus === 'entregado' && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Entregado</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {pedidosFiltrados.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Factory className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No se encontraron pedidos de producción registrados</p>
                <p className="text-xs text-muted-foreground">Haz clic en **"+ Nuevo Ticket / Pedido de Taller"** para capturar una orden de fabricación.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

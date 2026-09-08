import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { 
  FolderKanban, Search, Loader2, Calendar, TrendingUp, 
  DollarSign, PieChart, Layers, RefreshCw, Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NuevoProyectoModal } from './NuevoProyectoModal'

interface Participacion {
  id: string
  empresa_nombre: string
  monto_presupuesto: number
  porcentaje_avance: number
  estatus_cancha: string
  estatus_cancha_display: string
}

interface Proyecto {
  id: string | number
  nombre?: string
  cliente_nombre?: string
  empresa_nombre?: string
  presupuesto_total?: number
  costo_real?: number
  ganancia_estimada?: number
  margen_porcentaje?: number
  fecha_inicio?: string
  fecha_fin_estimada?: string
  activo?: boolean
  avance_promedio?: number
  participaciones?: Participacion[]
}

export function ProyectosPage() {
  const [search, setSearch] = useState('')
  const [filtroCancha, setFiltroCancha] = useState('')
  const navigate = useNavigate()

  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        console.error("Error cargando proyectos:", err)
        return []
      }
    },
  })

  const proyectosFiltrados = (proyectos || []).filter((p: Proyecto) => {
    const matchSearch = (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.empresa_nombre || '').toLowerCase().includes(search.toLowerCase())

    if (!matchSearch) return false

    if (filtroCancha) {
      return p.participaciones?.some((part: Participacion) => part.estatus_cancha === filtroCancha)
    }
    return true
  })

  const totalProyectos = proyectosFiltrados.length
  const proyectosActivos = proyectosFiltrados.filter((p: Proyecto) => p.activo).length
  const presupuestoTotalAcc = proyectosFiltrados.reduce((acc: number, p: Proyecto) => acc + (Number(p.presupuesto_total) || 0), 0)
  const costoRealTotalAcc = proyectosFiltrados.reduce((acc: number, p: Proyecto) => acc + (Number(p.costo_real) || 0), 0)
  const gananciaTotalAcc = presupuestoTotalAcc - costoRealTotalAcc

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)
  }

  const getEstatusCanchaBadge = (estatus: string) => {
    switch (estatus) {
      case 'en_cancha':
        return <Badge className="bg-blue-600 text-white font-bold text-[10px] gap-1"><Zap className="h-3 w-3" /> Área Responsable</Badge>
      case 'pari_passu':
        return <Badge className="bg-purple-600 text-white font-bold text-[10px] gap-1"><RefreshCw className="h-3 w-3" /> Ejecución Concurrente</Badge>
      case 'completado':
        return <Badge variant="success" className="text-[10px]">✓ Etapa Concluida</Badge>
      case 'detenido':
        return <Badge variant="destructive" className="text-[10px]">En Pausa Estratégica</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">Por Iniciar</Badge>
    }
  }

  const getMargenBadge = (margen?: number) => {
    const m = margen || 0
    if (m >= 20) return <Badge className="bg-green-100 text-green-800 border-green-200">🟢 Margen {m}% (Saludable)</Badge>
    if (m >= 5) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">🟡 Margen {m}% (En Riesgo)</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">🔴 Margen {m}% (Desviación)</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando proyectos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error al cargar los proyectos. Por favor, recarga la página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos & Matriz de Gestión Corporativa</h1>
          <p className="text-muted-foreground">Hub Central, Matriz de Responsabilidad por Filial y Rendimiento Financiero</p>
        </div>
        <NuevoProyectoModal />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proyectosActivos} / {totalProyectos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(presupuestoTotalAcc)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Real Incurrito</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(costoRealTotalAcc)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta Estimada</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(gananciaTotalAcc)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cliente o empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filtroCancha}
              onChange={(e) => setFiltroCancha(e.target.value)}
              className="flex h-9 w-full sm:w-[260px] rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm"
            >
              <option value="">Todas las Áreas / Estatus de Gestión</option>
              <option value="en_cancha">⚡ Área Responsable Principal</option>
              <option value="pari_passu">🔄 Ejecución Concurrente (Pari Passu)</option>
              <option value="completado">✓ Etapa Concluida</option>
              <option value="no_iniciado">Por Iniciar</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {proyectosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron proyectos</p>
            </CardContent>
          </Card>
        ) : (
          proyectosFiltrados.map((proyecto: Proyecto) => {
            const avance = Math.round(Number(proyecto.avance_promedio || 0))
            const participaciones = proyecto.participaciones || []

            return (
              <Card
                key={proyecto.id}
                className="cursor-pointer hover:shadow-lg transition-all border"
                onClick={() => navigate(`/proyectos/${proyecto.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{proyecto.nombre || 'Sin nombre'}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{proyecto.cliente_nombre || 'Sin cliente'}</p>
                      <div className="flex items-center gap-2">
                        {proyecto.empresa_nombre && (
                          <Badge variant="outline">{proyecto.empresa_nombre}</Badge>
                        )}
                        <Badge variant={proyecto.activo ? 'success' : 'secondary'}>
                          {proyecto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {getMargenBadge(proyecto.margen_porcentaje)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4 mb-4 text-xs bg-muted/40 p-3 rounded-lg border">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Presupuesto Venta</p>
                      <p className="font-bold text-sm text-foreground">
                        {formatCurrency(Number(proyecto.presupuesto_total || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Costo Real Incurrito</p>
                      <p className="font-bold text-sm text-amber-600">
                        {formatCurrency(Number(proyecto.costo_real || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Utilidad / Margen</p>
                      <p className="font-bold text-sm text-green-600">
                        {formatCurrency(Number(proyecto.ganancia_estimada || 0))} ({proyecto.margen_porcentaje || 0}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Fecha Inicio</p>
                      <p className="font-semibold flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString('es-MX') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-muted/20 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground border-b pb-1">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-[#c5a059]" />
                        Desglose Operativo por Filial & Estado de Ejecución
                      </span>
                      <span className="text-muted-foreground text-[11px]">Matriz de Responsabilidad & Ejecución Concurrente</span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {participaciones.length > 0 ? (
                        participaciones.map((part: Participacion) => (
                          <div key={part.id} className="p-2 rounded bg-card border text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-card-foreground">{part.empresa_nombre}</span>
                              {getEstatusCanchaBadge(part.estatus_cancha)}
                            </div>
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span>Avance: {part.porcentaje_avance}%</span>
                              <span>Presupuesto: {formatCurrency(Number(part.monto_presupuesto || 0))}</span>
                            </div>
                            <Progress value={part.porcentaje_avance} className="h-1.5" />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center text-xs text-muted-foreground py-1">
                          Filiales del Holding: Arquitectura, Desarrollo y Producción
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">Avance Global Consolidado del Proyecto</span>
                      <span className="font-bold text-card-foreground">{avance}%</span>
                    </div>
                    <Progress value={avance} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

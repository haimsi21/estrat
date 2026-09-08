import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { 
  HardHat, Search, Loader2, Calendar, Users, AlertTriangle, 
  CheckCircle2, TrendingUp, WifiOff, RefreshCw, Package, 
  Image as ImageIcon, FileCheck, Building2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { getQueue, syncOfflineQueue } from '@/lib/offlineQueue'
import { toast } from 'sonner'
import { NuevaBitacoraModal } from './NuevaBitacoraModal'
import { NuevaCuadrillaModal } from './NuevaCuadrillaModal'
import { NuevaEstimacionModal } from './NuevaEstimacionModal'
import { NuevaOrdenIntercompaniaModal } from './NuevaOrdenIntercompaniaModal'

interface BitacoraObra {
  id: string
  proyecto: string
  proyecto_nombre?: string
  fecha: string
  porcentaje_avance: number
  cuadrilla: string | null
  cuadrilla_nombre?: string
  registrado_por: string | null
  registrado_por_nombre?: string
  incidencias?: string
  fotos?: Array<{ id: number; imagen: string }>
  consumos?: Array<{ id: number; material: string; cantidad: number; unidad: string }>
}

export function ObraPage() {
  const [activeTab, setActiveTab] = useState<'bitacoras' | 'estimaciones' | 'inventario' | 'intercompania' | 'cuadrillas'>('bitacoras')
  const [search, setSearch] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  const navigate = useNavigate()
  const isOnline = useNetworkStatus()
  const queryClient = useQueryClient()

  const { data: proyectosData } = useQuery({
    queryKey: ['proyectos-filtro-obra'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/proyectos/proyectos/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const { data: bitacorasData, isLoading: loadingBitacoras } = useQuery({
    queryKey: ['bitacoras', filtroProyecto],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (filtroProyecto) params.append('proyecto', filtroProyecto)
        const { data } = await api.get(`/obra/bitacoras/?${params.toString()}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  const { data: estimacionesData, isLoading: loadingEstimaciones } = useQuery({
    queryKey: ['estimaciones'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/obra/estimaciones/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  const { data: inventarioData, isLoading: loadingInventario } = useQuery({
    queryKey: ['inventario'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/obra/inventario/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  const { data: ordenesICData, isLoading: loadingOrdenesIC } = useQuery({
    queryKey: ['ordenes-intercompania'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/obra/ordenes-intercompania/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  const { data: cuadrillasData } = useQuery({
    queryKey: ['cuadrillas'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/obra/cuadrillas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const proyectos = Array.isArray(proyectosData) ? proyectosData : []
  const bitacoras = Array.isArray(bitacorasData) ? bitacorasData : []
  const estimaciones = Array.isArray(estimacionesData) ? estimacionesData : []
  const inventario = Array.isArray(inventarioData) ? inventarioData : []
  const ordenesIC = Array.isArray(ordenesICData) ? ordenesICData : []
  const cuadrillas = Array.isArray(cuadrillasData) ? cuadrillasData : []

  useEffect(() => {
    setPendingCount(getQueue().length)
  }, [isOnline])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      toast.info('Sincronizando datos pendientes de obra...', { icon: <RefreshCw className="h-4 w-4 animate-spin" /> })
      syncOfflineQueue().then(synced => {
        if (synced > 0) {
          toast.success(`${synced} bitácora(s) de obra sincronizada(s) con el servidor`, { icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> })
          queryClient.invalidateQueries({ queryKey: ['bitacoras'] })
          queryClient.invalidateQueries({ queryKey: ['proyectos'] })
          setPendingCount(getQueue().length)
        }
      })
    }
  }, [isOnline, pendingCount, queryClient])

  const bitacorasFiltradas = bitacoras.filter((b: BitacoraObra) =>
    (b.proyecto_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.incidencias || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.cuadrilla_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalBitacoras = bitacorasFiltradas.length
  const avancePromedio = totalBitacoras > 0 
    ? Math.round(bitacorasFiltradas.reduce((acc: number, b: BitacoraObra) => acc + (b.porcentaje_avance || 0), 0) / totalBitacoras)
    : 0
  const bitacorasHoy = bitacorasFiltradas.filter((b: BitacoraObra) => 
    b.fecha && new Date(b.fecha).toDateString() === new Date().toDateString()
  ).length

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {!isOnline && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-lg flex items-center gap-3 text-xs">
          <WifiOff className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold">Modo sin conexión (PWA / iPad Terreno)</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80">Las bitácoras se guardarán localmente y se sincronizarán al conectar.</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="warning" className="font-bold">
              {pendingCount} pendiente(s)
            </Badge>
          )}
        </div>
      )}

      {/* Header Armónico */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Obra & Operaciones</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Bitácoras diarias, Estimaciones de avance (Progress Billing), Almacén e Intercompañía</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
          <NuevaOrdenIntercompaniaModal />
          <NuevaEstimacionModal />
          <NuevaCuadrillaModal />
          <NuevaBitacoraModal />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Bitácoras</CardTitle>
            <HardHat className="h-4 w-4 text-[#c5a059]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-card-foreground">{totalBitacoras}</div></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Avance Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{avancePromedio}%</div></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Bitácoras Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bitacorasHoy}</div></CardContent>
        </Card>
      </div>

      {/* Tabs Nivel C-Suite */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'bitacoras' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('bitacoras')}
        >
          📋 Bitácoras Diarias ({bitacoras.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'estimaciones' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('estimaciones')}
        >
          📝 Estimaciones de Obra ({estimaciones.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'inventario' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('inventario')}
        >
          📦 Almacén & Kardex ({inventario.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'intercompania' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('intercompania')}
        >
          🔄 Órdenes Intercompañía ({ordenesIC.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'cuadrillas' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('cuadrillas')}
        >
          👥 Cuadrillas ({cuadrillas.length})
        </button>
      </div>

      {/* TAB 1: BITÁCORAS */}
      {activeTab === 'bitacoras' && (
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por proyecto o incidencias..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-9 text-xs" 
                  />
                </div>
                <select 
                  value={filtroProyecto} 
                  onChange={(e) => setFiltroProyecto(e.target.value)} 
                  className="flex h-9 w-full sm:w-[220px] rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm"
                >
                  <option value="">Todos los proyectos</option>
                  {proyectos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {loadingBitacoras ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <div className="space-y-3">
              {bitacorasFiltradas.map((bitacora: any) => (
                <Card key={bitacora.id} className="bg-card border-border hover:border-[#c5a059]/50 cursor-pointer transition-all" onClick={() => navigate(`/obra/${bitacora.id}`)}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-card-foreground mb-1">{bitacora.proyecto_nombre || 'Proyecto Activo'}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {bitacora.fecha ? new Date(bitacora.fecha).toLocaleDateString('es-MX') : 'N/A'}
                          </span>
                          {bitacora.cuadrilla_nombre && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-blue-500" />
                              {bitacora.cuadrilla_nombre}
                            </span>
                          )}
                          {bitacora.fotos && bitacora.fotos.length > 0 && (
                            <span className="flex items-center gap-1 text-[#c5a059] font-medium">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {bitacora.fotos.length} foto(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={(bitacora.porcentaje_avance || 0) >= 100 ? 'success' : 'gold'}>
                        {bitacora.porcentaje_avance || 0}%
                      </Badge>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Avance Físico</span>
                        <span className="font-semibold text-card-foreground">{bitacora.porcentaje_avance || 0}%</span>
                      </div>
                      <Progress value={bitacora.porcentaje_avance || 0} className="h-2" />
                    </div>

                    {bitacora.incidencias && (
                      <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-400 mb-0.5">Observaciones:</p>
                          <p>{bitacora.incidencias}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {bitacorasFiltradas.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 text-center text-muted-foreground text-xs">
                    No se encontraron bitácoras de obra registradas.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ESTIMACIONES */}
      {activeTab === 'estimaciones' && (
        <div className="space-y-3">
          {loadingEstimaciones ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <div className="space-y-3">
              {estimaciones.map((est: any) => (
                <Card key={est.id} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-blue-500" />
                          <h3 className="font-bold text-sm text-card-foreground">Estimación #{est.numero_estimacion} — {est.proyecto_nombre}</h3>
                          <Badge variant={est.estatus === 'facturada' ? 'success' : 'outline'}>
                            {est.estatus_display || est.estatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Avance Certificado: <span className="font-bold text-card-foreground">{est.porcentaje_ejecutado}%</span> • Fecha: {est.fecha_presentacion ? new Date(est.fecha_presentacion).toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-xl font-bold text-[#c5a059]">{formatCurrency(Number(est.monto_ejecutado || 0))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {estimaciones.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 text-center text-muted-foreground text-xs">
                    No hay estimaciones de avance registradas.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTARIO KARDEX */}
      {activeTab === 'inventario' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {inventario.map((inv: any) => (
            <Card key={inv.id} className="bg-card border-border">
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-card-foreground">
                    <Package className="h-4 w-4 text-[#c5a059]" />
                    {inv.material}
                  </h3>
                  {inv.bajo_stock ? (
                    <Badge variant="destructive" className="text-[10px]">Stock Mínimo</Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">OK</Badge>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xl font-bold text-card-foreground">{inv.stock_actual} <span className="text-xs text-muted-foreground font-normal">{inv.unidad}</span></span>
                  <span className="text-xs text-muted-foreground">Mín: {inv.stock_minimo} {inv.unidad}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: INTERCOMPAÑÍA */}
      {activeTab === 'intercompania' && (
        <div className="space-y-3">
          {ordenesIC.map((o: any) => (
            <Card key={o.id} className="bg-card border-border">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#c5a059]" />
                    <h3 className="font-bold text-sm text-card-foreground">{o.empresa_origen_nombre} ➔ {o.empresa_destino_nombre}</h3>
                    <Badge variant="outline">{o.estatus}</Badge>
                  </div>
                  <p className="text-muted-foreground">Proyecto: <span className="font-semibold text-card-foreground">{o.proyecto_nombre}</span></p>
                  <p className="bg-muted p-2 rounded text-muted-foreground">{o.concepto}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#c5a059]">{formatCurrency(Number(o.monto_interno || 0))}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 5: CUADRILLAS */}
      {activeTab === 'cuadrillas' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cuadrillas.map((c: any) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-card-foreground mb-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  {c.nombre}
                </h3>
                <p className="text-xs text-muted-foreground">Proyecto: {c.proyecto_nombre}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

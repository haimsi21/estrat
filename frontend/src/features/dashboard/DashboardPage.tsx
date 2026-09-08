import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  TrendingUp, DollarSign, AlertCircle, Briefcase, Users, Package, 
  ArrowUpRight, ArrowDownRight, Target, Zap, Loader2,
  HardHat, Factory, Palette
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'

const COLORES_EMPRESA = {
  'Desarrollo': '#3b82f6',
  'Arquitectura': '#a855f7',
  'Producción': '#22c55e',
}
const COLORES_PIE = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']
const COLORES_ESTADO = {
  'diseno': '#94a3b8',
  'taller': '#f59e0b',
  'entrega': '#3b82f6',
  'entregado': '#22c55e',
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-MX').format(value)
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'consolidado' | 'areas'>('consolidado')

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: async () => {
      const { data } = await api.get('/direccion/resumen/')
      return data
    },
  })

  const { data: graficas, isLoading: loadingGraficas } = useQuery({
    queryKey: ['dashboard-graficas'],
    queryFn: async () => {
      const { data } = await api.get('/direccion/graficas/')
      return data
    },
  })

  const isLoading = loadingKpis || loadingGraficas

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalFacturado = kpis?.facturacion_total ?? 0
  const totalEmpleados = kpis?.empleados_activos ?? 0
  const pedidosProduccion = kpis?.pedidos_produccion ?? 0

  const kpisEstrategicos = [
    {
      titulo: 'Portafolio Activo',
      valor: kpis?.proyectos_activos ?? 0,
      subtitulo: 'proyectos en ejecución',
      icono: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      tendencia: '+2 vs mes anterior',
      positiva: true
    },
    {
      titulo: 'Avance Global',
      valor: `${kpis?.avance_promedio ?? 0}%`,
      subtitulo: 'del portafolio total',
      icono: Target,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/20',
      tendencia: (kpis?.avance_promedio ?? 0) > 50 ? 'En tiempo' : 'En ejecución',
      positiva: (kpis?.avance_promedio ?? 0) > 50
    },
    {
      titulo: 'CxC Pendiente',
      valor: formatCurrency(kpis?.cxc_pendiente ?? 0),
      subtitulo: 'por cobrar',
      icono: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      tendencia: (kpis?.cxc_pendiente ?? 0) > 0 ? 'Requiere seguimiento' : 'Al corriente',
      positiva: (kpis?.cxc_pendiente ?? 0) === 0
    },
    {
      titulo: 'Alertas Críticas',
      valor: kpis?.alertas_criticas ?? 0,
      subtitulo: 'requieren atención',
      icono: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/20',
      tendencia: `${kpis?.detalle_alertas?.proyectos_vencidos ?? 0} proyectos vencidos`,
      positiva: (kpis?.alertas_criticas ?? 0) === 0
    },
  ]

  const metricasFinancieras = [
    {
      label: 'Facturación Total',
      valor: formatCurrency(totalFacturado),
      icono: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'Proyección Trimestre',
      valor: formatCurrency(kpis?.proyeccion_trimestre || (totalFacturado * 1.2)),
      icono: Zap,
      color: 'text-blue-600'
    },
    {
      label: 'Pedidos en Producción',
      valor: formatNumber(pedidosProduccion),
      icono: Package,
      color: 'text-purple-600'
    },
    {
      label: 'Empleados Activos',
      valor: formatNumber(totalEmpleados),
      icono: Users,
      color: 'text-cyan-600'
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo — Grupo Fiat</h1>
          <p className="text-muted-foreground">Vista consolidada e inteligencia de negocios del Holding en tiempo real</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpisEstrategicos.map((kpi) => (
          <Card key={kpi.titulo} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.titulo}</p>
                  <p className="text-3xl font-bold tracking-tight">{kpi.valor}</p>
                  <p className="text-xs text-muted-foreground">{kpi.subtitulo}</p>
                  <div className={`flex items-center gap-1 text-xs ${kpi.positiva ? 'text-green-600' : 'text-amber-600'}`}>
                    {kpi.positiva ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.tendencia}
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icono className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metricasFinancieras.map((metrica) => (
          <Card key={metrica.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metrica.label}
              </CardTitle>
              <metrica.icono className={`h-4 w-4 ${metrica.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{metrica.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'consolidado' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('consolidado')}
        >
          🌐 Consolidado Holding (Gráficas)
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'areas' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('areas')}
        >
          🔍 Detalle por Área (Exclusivo Dirección General)
        </button>
      </div>

      {activeTab === 'consolidado' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Ingresos por Empresa del Holding
              </CardTitle>
            </CardHeader>
            <CardContent>
              {graficas?.ventas_por_empresa && graficas.ventas_por_empresa.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={graficas.ventas_por_empresa}
                      dataKey="total"
                      nameKey="empresa"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => `${entry.empresa}: ${formatCurrency(entry.total)}`}
                    >
                      {graficas.ventas_por_empresa.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORES_EMPRESA[entry.empresa as keyof typeof COLORES_EMPRESA] || COLORES_PIE[index % COLORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Sin datos de ventas cargados
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Tendencia de Facturación (6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {graficas?.facturacion_mensual && graficas.facturacion_mensual.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={graficas.facturacion_mensual}>
                    <defs>
                      <linearGradient id="colorFact" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFact)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Sin datos de facturación
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Salud del Portafolio - Avance por Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {graficas?.avance_proyectos && graficas.avance_proyectos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={graficas.avance_proyectos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis dataKey="nombre" type="category" width={120} />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Bar dataKey="avance" fill="#a855f7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Sin proyectos activos
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Pipeline de Producción & Taller
              </CardTitle>
            </CardHeader>
            <CardContent>
              {graficas?.pedidos_por_estatus && graficas.pedidos_por_estatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={graficas.pedidos_por_estatus}
                      dataKey="total"
                      nameKey="estatus"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => `${entry.estatus}: ${entry.total}`}
                    >
                      {graficas.pedidos_por_estatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORES_ESTADO[entry.estatus as keyof typeof COLORES_ESTADO] || COLORES_PIE[index % COLORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Sin pedidos registrados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'areas' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-t-4 border-t-blue-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" /> Área Comercial (CRM)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Total Leads Capturados:</span>
                <span className="font-bold text-base">{kpis?.leads_totales || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Leads Ganados:</span>
                <Badge variant="success">{kpis?.leads_ganados || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monto Cotizado:</span>
                <span className="font-bold text-blue-600">{formatCurrency(kpis?.monto_cotizado || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" /> Área Arquitectura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Propuestas de Diseño:</span>
                <span className="font-bold text-base">{kpis?.propuestas_arquitectura || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Modelos 3D & LiDAR:</span>
                <Badge variant="outline">USDZ / GLTF</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-semibold text-green-600">Al día</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HardHat className="h-5 w-5 text-green-600" /> Área Obra & Terreno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Bitácoras Reportadas:</span>
                <span className="font-bold text-base">{kpis?.bitacoras_obra || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Cuadrillas Activas:</span>
                <Badge variant="outline">{kpis?.cuadrillas_activas || 0} equipos</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Modo PWA / Offline:</span>
                <span className="font-semibold text-green-600">Habilitado</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-5 w-5 text-amber-600" /> Área Producción & Taller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Pedidos en Fabricación:</span>
                <span className="font-bold text-base text-amber-600">{pedidosProduccion}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Control de Calidad:</span>
                <Badge variant="warning">En Taller</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Muebles a Medida:</span>
                <span className="font-semibold">Granito / Encino / Acero</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Área Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Facturación Total:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalFacturado)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">CxC Pendiente:</span>
                <span className="font-bold text-amber-600">{formatCurrency(kpis?.cxc_pendiente || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Facturas Vencidas:</span>
                <Badge variant={kpis?.detalle_alertas?.facturas_vencidas > 0 ? "destructive" : "success"}>
                  {kpis?.detalle_alertas?.facturas_vencidas || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-cyan-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" /> Área Recursos Humanos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Plantilla Fija Activa:</span>
                <span className="font-bold text-base">{totalEmpleados} empleados</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Empresas Cubiertas:</span>
                <span className="font-medium">3 / 3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Asistencia Hoy:</span>
                <span className="font-semibold text-blue-600">Al día</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

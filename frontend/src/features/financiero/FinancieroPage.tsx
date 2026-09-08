import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  DollarSign, Search, Loader2, Clock, CheckCircle2, AlertCircle, 
  Building2, FileText, ShoppingBag, PieChart, TrendingUp, Layers, Award, Printer
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NuevaFacturaModal } from './NuevaFacturaModal'
import { NuevaFacturaProveedorModal } from './NuevaFacturaProveedorModal'

export function FinancieroPage() {
  const [activeTab, setActiveTab] = useState<'facturas' | 'cxp' | 'pnl' | 'flujo' | 'inversionistas'>('facturas')
  const [search, setSearch] = useState('')
  const [filtroPagada, setFiltroPagada] = useState('')

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 1. Cargar Facturas Venta (Clientes / CxC)
  const { data: facturasData, isLoading: loadingFacturas } = useQuery({
    queryKey: ['facturas', filtroPagada],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (filtroPagada) params.append('pagada', filtroPagada)
        const { data } = await api.get(`/financiero/facturas/?${params.toString()}`)
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  // 2. Cargar Cuentas por Cobrar (CxC)
  const { data: cxcData } = useQuery({
    queryKey: ['cxc'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/financiero/cxc/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  // 3. Cargar Cuentas por Pagar (CxP Proveedores)
  const { data: cxpData, isLoading: loadingCxP } = useQuery({
    queryKey: ['cxp'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/financiero/cxp/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    },
  })

  // 4. Cargar Estado de Resultados P&L
  const { data: pnlData } = useQuery({
    queryKey: ['pnl'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/financiero/pnl/')
        return data
      } catch {
        return null
      }
    },
  })

  // 5. Cargar Flujo de Caja Proyectado
  const { data: flujoData } = useQuery({
    queryKey: ['flujo-caja'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/financiero/flujo-caja/')
        return data
      } catch {
        return null
      }
    },
  })

  // 6. Cargar Reporte para Inversionistas
  const { data: inversionistasData } = useQuery({
    queryKey: ['reporte-inversionistas'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/financiero/reporte-inversionistas/')
        return data
      } catch {
        return null
      }
    },
  })

  const mutationCambiarCxP = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/financiero/cxp/${id}/cambiar_estado_pago/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxp'] })
      queryClient.invalidateQueries({ queryKey: ['pnl'] })
      queryClient.invalidateQueries({ queryKey: ['flujo-caja'] })
      queryClient.invalidateQueries({ queryKey: ['reporte-inversionistas'] })
      toast.success('Estado de pago a proveedor actualizado')
    }
  })

  const facturas = Array.isArray(facturasData) ? facturasData : []
  const cxc = Array.isArray(cxcData) ? cxcData : []
  const cxp = Array.isArray(cxpData) ? cxpData : []

  const facturasFiltradas = facturas.filter((f: any) =>
    (f.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.folio_fiscal || '').toLowerCase().includes(search.toLowerCase())
  )

  const cxpFiltradas = cxp.filter((c: any) =>
    (c.proveedor_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.concepto || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.empresa_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalFacturado = facturasFiltradas.reduce((acc: number, f: any) => acc + Number(f.total || 0), 0)
  const totalCxC = cxc.reduce((acc: number, c: any) => acc + Number(c.saldo_pendiente || 0), 0)
  const totalCxP = cxp.filter((c: any) => !c.pagada).reduce((acc: number, c: any) => acc + Number(c.saldo_pendiente || 0), 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Armónico */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Finanzas & Tesorería Consolidada</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Estado de Resultados (P&L), Flujo de Caja, CxC Clientes, CxP Proveedores & Reporte Inversionistas</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
          <NuevaFacturaProveedorModal />
          <NuevaFacturaModal />
        </div>
      </div>

      {/* KPIs Economista C-Level */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Facturación Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFacturado)}</div>
            <p className="text-xs text-muted-foreground mt-1">{facturas.length} factura(s) clientes</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">CxC (Por Cobrar)</CardTitle>
            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalCxC)}</div>
            <p className="text-xs text-muted-foreground mt-1">{cxc.length} cuentas por cobrar</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">CxP (Por Pagar Proveedores)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatCurrency(totalCxP)}</div>
            <p className="text-xs text-muted-foreground mt-1">{cxp.filter((c: any) => !c.pagada).length} compromisos proveedores</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Margen Neta Holding</CardTitle>
            <PieChart className="h-4 w-4 text-[#c5a059]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#c5a059]">
              {pnlData ? `${pnlData.margen_neto_pct}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Utilidad neta consolidada</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Economista C-Suite */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'facturas' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('facturas')}
        >
          📄 Facturas Venta & CxC ({facturas.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'cxp' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('cxp')}
        >
          🛍️ Cuentas por Pagar CxP ({cxp.length})
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'pnl' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('pnl')}
        >
          📊 Estado de Resultados (P&L)
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'flujo' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('flujo')}
        >
          💧 Flujo de Caja Proyectado
        </button>
        <button
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === 'inversionistas' ? 'border-[#c5a059] text-[#c5a059] font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('inversionistas')}
        >
          👑 Reporte para Inversionistas & C-Suite
        </button>
      </div>

      {/* TAB 1: FACTURAS VENTA (CxC) */}
      {activeTab === 'facturas' && (
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente o folio fiscal..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
                <select
                  value={filtroPagada}
                  onChange={(e) => setFiltroPagada(e.target.value)}
                  className="flex h-9 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-sm"
                >
                  <option value="">Todas las facturas</option>
                  <option value="true">Pagadas</option>
                  <option value="false">Pendientes</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {loadingFacturas ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <div className="space-y-3">
              {facturasFiltradas.map((factura: any) => (
                <Card
                  key={factura.id}
                  className={`bg-card border-border hover:border-[#c5a059]/50 cursor-pointer transition-all ${!factura.pagada ? 'border-amber-500/40' : ''}`}
                  onClick={() => navigate(`/financiero/${factura.id}`)}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-[#c5a059]" />
                          <h3 className="text-base font-semibold text-card-foreground">
                            Factura #{factura.folio_fiscal ? factura.folio_fiscal.slice(0, 16) : 'CFDI Consolidado'}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{factura.cliente_nombre || 'Cliente'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Emitida: {factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-MX') : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(factura.total || 0))}
                        </p>
                        <Badge variant={factura.pagada ? 'success' : 'warning'} className="mt-1 text-[10px]">
                          {factura.pagada ? 'Pagada' : 'Pendiente CxC'}
                        </Badge>
                      </div>
                    </div>

                    {factura.detalles && factura.detalles.length > 0 && (
                      <div className="border-t border-border pt-2.5 mt-3 space-y-1">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1">Desglose por Empresa del Holding:</p>
                        {factura.detalles.map((det: any) => (
                          <div key={det.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium text-card-foreground">{det.empresa_nombre || 'Empresa'}</span>
                              <span className="text-muted-foreground">— {det.concepto}</span>
                            </div>
                            <span className="font-semibold text-card-foreground">{formatCurrency(Number(det.monto || 0))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {facturasFiltradas.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 text-center text-muted-foreground text-xs">
                    No se encontraron facturas emitidas a clientes.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUENTAS POR PAGAR (CxP PROVEEDORES) */}
      {activeTab === 'cxp' && (
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por proveedor, concepto o empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {loadingCxP ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
          ) : (
            <div className="space-y-3">
              {cxpFiltradas.map((item: any) => (
                <Card key={item.id} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-amber-500" />
                          <h3 className="font-bold text-base text-card-foreground">{item.proveedor_nombre}</h3>
                          <Badge variant={item.pagada ? "success" : "warning"} className="text-[10px]">
                            {item.pagada ? "Pagado" : "Pendiente CxP"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Empresa Pagadora: <span className="font-semibold text-card-foreground">{item.empresa_nombre}</span> {item.proyecto_nombre && `• Proyecto: ${item.proyecto_nombre}`}
                        </p>
                        <p className="text-xs bg-muted border p-2 rounded text-muted-foreground">
                          {item.concepto}
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-500">
                          {formatCurrency(Number(item.monto || 0))}
                        </p>
                        <Button 
                          size="sm" 
                          variant={item.pagada ? "outline" : "default"}
                          disabled={mutationCambiarCxP.isPending}
                          onClick={() => mutationCambiarCxP.mutate(item.id)}
                          className="text-xs h-7"
                        >
                          {item.pagada ? "Marcar Pendiente" : "Marcar como Pagado"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {cxpFiltradas.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 text-center text-muted-foreground text-xs">
                    No se encontraron compromisos registrados con proveedores.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ESTADO DE RESULTADOS CONSOLIDADO (P&L ECONOMISTA) */}
      {activeTab === 'pnl' && pnlData && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border border-t-2 border-t-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Ingresos Totales (Facturados Pagados)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pnlData.ingresos_totales)}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-t-2 border-t-amber-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Egresos Proveedores (COGS)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatCurrency(pnlData.egresos_proveedores)}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-t-2 border-t-[#c5a059]">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground">Utilidad Neta Consolidada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-[#c5a059]">{formatCurrency(pnlData.utilidad_neta)}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">Margen Neto: {pnlData.margen_neto_pct}%</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
                <Layers className="h-5 w-5 text-[#c5a059]" />
                Estado de Resultados Consolidado (P&L) por Filial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm border-b border-border pb-4">
                <div className="flex justify-between font-bold text-sm text-card-foreground">
                  <span>(+) Ingresos Totales por Ventas:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(pnlData.ingresos_totales)}</span>
                </div>
                {Object.entries(pnlData.ingresos_por_empresa || {}).map(([emp, val]) => (
                  <div key={emp} className="flex justify-between text-xs text-muted-foreground pl-4">
                    <span>• {emp}:</span>
                    <span>{formatCurrency(val as number)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-b border-border pb-4">
                <div className="flex justify-between font-bold text-sm text-card-foreground">
                  <span>(-) Costos de Proveedores e Insumos (COGS):</span>
                  <span className="text-amber-600 dark:text-amber-500">-{formatCurrency(pnlData.egresos_proveedores)}</span>
                </div>
                {Object.entries(pnlData.egresos_por_empresa || {}).map(([emp, val]) => (
                  <div key={emp} className="flex justify-between text-xs text-muted-foreground pl-4">
                    <span>• {emp}:</span>
                    <span>-{formatCurrency(val as number)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-b border-border pb-4">
                <div className="flex justify-between font-bold text-sm text-card-foreground">
                  <span>(-) Gastos de Nómina Fija RH (OPEX):</span>
                  <span className="text-red-500">-{formatCurrency(pnlData.nomina_mensual_rh)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg pt-1 text-card-foreground">
                <span>(=) Utilidad Neta Consolidada Holding:</span>
                <span className="text-[#c5a059]">{formatCurrency(pnlData.utilidad_neta)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: FLUJO DE CAJA PROYECTADO */}
      {activeTab === 'flujo' && flujoData && (
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Proyección de Flujo de Caja & Liquidez Cascada (Waterfall)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {(flujoData.periodos || []).map((p: any) => (
                  <Card key={p.dias} className="bg-muted/40 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-[#c5a059]">{p.dias}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">(+) Entradas CxC:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.entradas_cxc)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">(-) Salidas CxP Proveedores:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-500">-{formatCurrency(p.salidas_cxp)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-muted-foreground">(-) Compromisos Nómina:</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(p.nomina)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold pt-1 text-card-foreground">
                        <span>(=) Flujo Neto Proyectado:</span>
                        <span className={p.flujo_neto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                          {formatCurrency(p.flujo_neto)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: REPORTE PARA INVERSIONISTAS & C-SUITE (Light/Dark Dynamic) */}
      {activeTab === 'inversionistas' && inversionistasData && (
        <div className="space-y-6">
          <Card className="bg-card border-border border-t-2 border-t-[#c5a059]">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-card-foreground">
                  <Award className="h-5 w-5 text-[#c5a059]" />
                  Estado de Cuenta & Reporte C-Suite para Inversionistas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Corte al {inversionistasData.fecha_corte} • Consolidado Holding Ro
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs">
                <Printer className="h-3.5 w-3.5" /> Imprimir Reporte C-Suite
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recuadros Dinámicos Armónicos (Light / Dark Adaptive) */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold">Retorno Estimado sobre Inversión (ROI)</p>
                  <p className="text-3xl font-bold text-[#c5a059] mt-1">{inversionistasData.roi_estimado_pct}%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Rendimiento sobre portafolio activo</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold">Capital de Trabajo Neto (Working Capital)</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(inversionistasData.capital_trabajo)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Cartera CxC menos compromisos CxP</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground font-semibold">Valor Total del Portafolio Activo</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(inversionistasData.presupuesto_portafolio)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Suma de proyectos contratados</p>
                </div>
              </div>

              {/* Desglose de Estado de Cuenta */}
              <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3 text-sm">
                <h3 className="font-bold text-sm text-card-foreground border-b border-border pb-2">Resumen Ejecutivo de Rendición de Cuentas</h3>
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">(+) Ingresos Liquidados Recaudados:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(inversionistasData.ingresos_liquidados)}</span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">(-) Egresos Totales de Operación (Proveedores + Nómina):</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-500">-{formatCurrency(inversionistasData.egresos_operacion)}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-border font-bold text-sm sm:text-base text-card-foreground">
                  <span>(=) Utilidad Neta Consolidada Holding:</span>
                  <span className="text-[#c5a059]">{formatCurrency(inversionistasData.utilidad_neta_holding)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

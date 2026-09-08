import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react'

interface CurvaSProps {
  presupuestoTotal: number
  costoReal: number
  avancePct: number
  cpi: number
  spi: number
  evmPv: number
  evmEv: number
  evmAc: number
}

export function CurvaSChart({ presupuestoTotal, costoReal, avancePct, cpi, spi, evmPv, evmEv, evmAc }: CurvaSProps) {
  const data = [
    { mes: 'Mes 1', PV: presupuestoTotal * 0.15, EV: presupuestoTotal * 0.12, AC: costoReal * 0.10 },
    { mes: 'Mes 2', PV: presupuestoTotal * 0.35, EV: presupuestoTotal * 0.30, AC: costoReal * 0.32 },
    { mes: 'Mes 3', PV: presupuestoTotal * 0.60, EV: presupuestoTotal * 0.55, AC: costoReal * 0.58 },
    { mes: 'Mes 4 (Actual)', PV: evmPv, EV: evmEv, AC: evmAc },
  ]

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <Card className="border-2 border-[#c5a059]/40">
      <CardHeader className="bg-muted/30 pb-3 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#c5a059]" />
            Análisis de Valor Ganado & Curva "S" (Earned Value Management - EVM)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Proyección C-Suite: Planned Value (PV) vs. Earned Value (EV) vs. Actual Cost (AC)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cpi >= 1.0 ? "success" : "destructive"} className="font-bold text-xs gap-1">
            {cpi >= 1.0 ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            CPI: {cpi} {cpi >= 1.0 ? "(Eficiente)" : "(Sobrecosto)"}
          </Badge>

          <Badge variant={spi >= 1.0 ? "success" : "warning"} className="font-bold text-xs gap-1">
            SPI: {spi} {spi >= 1.0 ? "(A Tiempo)" : "(Atrasado)"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 text-xs bg-muted/20 p-3 rounded-lg border">
          <div>
            <p className="text-muted-foreground">Planned Value (PV - Planificado):</p>
            <p className="font-bold text-blue-600 text-sm">{formatCurrency(evmPv)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Earned Value (EV - Valor Ganado):</p>
            <p className="font-bold text-emerald-600 text-sm">{formatCurrency(evmEv)} ({avancePct}%)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Actual Cost (AC - Costo Incurrito):</p>
            <p className="font-bold text-amber-600 text-sm">{formatCurrency(evmAc)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
            <Legend />
            <Area type="monotone" dataKey="PV" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" name="Planned Value (PV)" />
            <Area type="monotone" dataKey="EV" stroke="#10b981" fillOpacity={0.2} fill="#10b981" name="Earned Value (EV)" />
            <Area type="monotone" dataKey="AC" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" name="Actual Cost (AC)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

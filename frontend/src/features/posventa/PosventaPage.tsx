import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Search, Loader2, Wrench, Calendar } from 'lucide-react'

export function PosventaPage() {
  const [search, setSearch] = useState('')

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets-posventa'],
    queryFn: async () => {
      const { data } = await api.get('/core/tickets-posventa/')
      return Array.isArray(data) ? data : (data.results || [])
    }
  })

  const tickets = Array.isArray(ticketsData) ? ticketsData : []
  const filtrados = tickets.filter(t => 
    t.folio.toLowerCase().includes(search.toLowerCase()) ||
    t.proyecto_nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.descripcion_falla.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posventa & Servicio de Garantías</h1>
          <p className="text-muted-foreground">Atención a Clientes Post-Entrega e Impacto Financiero en Margen</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio o proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#c5a059]" /></div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((t: any) => (
            <Card key={t.id} className="bg-card border-border">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <h3 className="font-bold text-base">{t.folio} — {t.proyecto_nombre || 'Cliente'}</h3>
                    <Badge variant="outline">{t.estatus_display}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Filial Responsable: <span className="font-semibold text-foreground">{t.empresa_nombre}</span> • Cliente: {t.cliente_nombre}
                  </p>
                  <p className="text-xs bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-amber-900 dark:text-amber-300">
                    Reporte: {t.descripcion_falla}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xl font-bold text-amber-600">Coste Reparación: {formatCurrency(Number(t.costo_reparacion || 0))}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" /> Solución Estimada: {t.fecha_solucion_estimada}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

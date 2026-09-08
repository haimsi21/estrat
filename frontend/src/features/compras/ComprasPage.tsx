import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { ShoppingCart, Search, Loader2, Calendar } from 'lucide-react'

export function ComprasPage() {
  const [search, setSearch] = useState('')

  const { data: ordenesData, isLoading } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: async () => {
      const { data } = await api.get('/core/ordenes-compra/')
      return Array.isArray(data) ? data : (data.results || [])
    }
  })

  const ordenes = Array.isArray(ordenesData) ? ordenesData : []
  const ordenesFiltradas = ordenes.filter(o => 
    o.proveedor_nombre.toLowerCase().includes(search.toLowerCase()) ||
    o.concepto.toLowerCase().includes(search.toLowerCase()) ||
    o.folio.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras & Suministros (Procurement)</h1>
          <p className="text-muted-foreground">Requisiciones, Órdenes de Compra y Recepción de Insumos para Obra y Taller</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, proveedor o insumos..."
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
          {ordenesFiltradas.map((ord: any) => (
            <Card key={ord.id} className="bg-card border-border">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-[#c5a059]" />
                    <h3 className="font-bold text-base">{ord.folio} — {ord.proveedor_nombre}</h3>
                    <Badge variant="outline">{ord.estatus_display}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Empresa: <span className="font-semibold text-foreground">{ord.empresa_nombre}</span> • Proyecto: {ord.proyecto_nombre || 'General'}
                  </p>
                  <p className="text-xs bg-muted/40 p-2 rounded text-muted-foreground">{ord.concepto}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(Number(ord.monto_total || 0))}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" /> Entrega: {ord.fecha_entrega_esperada}
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

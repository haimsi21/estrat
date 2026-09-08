import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Scale, Search, Loader2, Calendar } from 'lucide-react'

export function LegalPage() {
  const [search, setSearch] = useState('')

  const { data: expedienteData, isLoading } = useQuery({
    queryKey: ['expedientes-legales'],
    queryFn: async () => {
      const { data } = await api.get('/core/expedientes-legales/')
      return Array.isArray(data) ? data : (data.results || [])
    }
  })

  const expedientes = Array.isArray(expedienteData) ? expedienteData : []
  const filtrados = expedientes.filter(e => 
    e.titulo.toLowerCase().includes(search.toLowerCase()) ||
    e.abogado_responsable.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Legal & Contratos Corporativos</h1>
          <p className="text-muted-foreground">Expedientes Jurídicos, Licencias de Construcción, Fianzas y Control de Vencimientos</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contrato o expediente legal..."
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
          {filtrados.map((exp: any) => (
            <Card key={exp.id} className="bg-card border-border">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-600" />
                    <h3 className="font-bold text-base">{exp.titulo}</h3>
                    <Badge variant="outline">{exp.estatus_display}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Empresa: <span className="font-semibold text-foreground">{exp.empresa_nombre}</span> • Abogado Responsable: {exp.abogado_responsable || 'Despacho Externo'}
                  </p>
                  {exp.clausulas_clave && (
                    <p className="text-xs bg-purple-50 dark:bg-purple-950/20 p-2 rounded text-purple-900 dark:text-purple-300">
                      Cláusulas: {exp.clausulas_clave}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xl font-bold text-foreground">{formatCurrency(Number(exp.monto_contrato || 0))}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" /> Vence: {exp.fecha_vencimiento || 'Indefinido'}
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

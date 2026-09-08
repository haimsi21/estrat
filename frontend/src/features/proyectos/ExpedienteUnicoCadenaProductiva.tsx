import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target, FileText, Scale, ShoppingCart, 
  HardHat, DollarSign, Wrench, CheckCircle2, ArrowRight
} from 'lucide-react'

interface ExpedienteProps {
  proyectoNombre: string
  clienteNombre: string
  presupuestoTotal: number
}

export function ExpedienteUnicoCadenaProductiva({ proyectoNombre, clienteNombre, presupuestoTotal }: ExpedienteProps) {
  const etapas = [
    {
      etapa: "1. Comercial (CRM)",
      icono: Target,
      color: "text-blue-500",
      detalles: "Lead capturado vía Referido. Cotización v2 Aprobada ($35,000,000 MXN)",
      estatus: "Completado",
      badge: "success"
    },
    {
      etapa: "2. Arquitectura & 3D",
      icono: FileText,
      color: "text-purple-500",
      detalles: "Plano Estructural v2 Visto (Acuse OK). Modelo 3D LiDAR inspeccionado.",
      estatus: "Aprobado",
      badge: "success"
    },
    {
      etapa: "3. Legal & Licencias",
      icono: Scale,
      color: "text-indigo-500",
      detalles: "Contrato Marco firmado. Licencia de Construcción #LC-2026-90 vigente.",
      estatus: "Firmado",
      badge: "gold"
    },
    {
      etapa: "4. Compras (Suministros)",
      icono: ShoppingCart,
      color: "text-amber-500",
      detalles: "Orden OC-2026-001 (Acero y Varilla) en tránsito. Entrega estimada 10 días.",
      estatus: "En Proceso",
      badge: "warning"
    },
    {
      etapa: "5. Obra & Taller",
      icono: HardHat,
      color: "text-green-500",
      detalles: "Bitácora diaria al día (60% avance). Cocinas en taller en acabado.",
      estatus: "En Ejecución",
      badge: "gold"
    },
    {
      etapa: "6. Financiero (Facturación)",
      icono: DollarSign,
      color: "text-emerald-500",
      detalles: "Factura CFDI-2026-891 liquidada ($28,000,000). CxC Pendiente: $7,000,000.",
      estatus: "75% Cobrado",
      badge: "success"
    },
    {
      etapa: "7. Posventa & Garantía",
      icono: Wrench,
      color: "text-red-500",
      detalles: "Garantía de 12 meses activa. 1 ticket de pintura en atención ($12,500).",
      estatus: "Activo",
      badge: "outline"
    },
  ]

  return (
    <Card className="border-2 border-[#c5a059]/40">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center justify-between text-base font-bold">
          <span className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-[#c5a059]" />
            Expediente Único & Trazabilidad de la Cadena Productiva
          </span>
          <Badge variant="outline" className="font-mono text-xs">Lineaje Completo de Proyecto</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="space-y-2">
          {etapas.map((item, idx) => {
            const Icono = item.icono
            return (
              <div key={idx} className="p-3 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-muted ${item.color}`}>
                    <Icono className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{item.etapa}</p>
                    <p className="text-muted-foreground">{item.detalles}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Badge variant={item.badge as any}>{item.estatus}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

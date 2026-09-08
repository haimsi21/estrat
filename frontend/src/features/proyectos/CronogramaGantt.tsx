import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, AlertTriangle, CheckCircle2, Flame } from 'lucide-react'

interface Fase {
  id: number
  nombre: string
  porcentaje_avance: number
  fecha_inicio?: string
  fecha_compromiso: string
  completada: boolean
  es_ruta_critica?: boolean
  dias_retraso?: number
}

interface CronogramaGanttProps {
  fases: Fase[]
}

export function CronogramaGantt({ fases }: CronogramaGanttProps) {
  if (!fases || fases.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
          No hay fases de cronograma registradas para este proyecto.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Cronograma Gantt & Análisis de Ruta Crítica (Critical Path)
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="flex items-center gap-1 border-red-500 text-red-600">
              <Flame className="h-3 w-3" /> Ruta Crítica
            </Badge>
            <Badge variant="success">Completado</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {fases.map((fase, index) => {
          const avance = Math.min(100, Math.max(0, fase.porcentaje_avance || 0))
          const retraso = fase.dias_retraso || 0
          const esCritica = fase.es_ruta_critica || index === fases.length - 1

          return (
            <div 
              key={fase.id} 
              className={`p-3 rounded-lg border transition-all ${
                retraso > 0 ? 'border-red-300 bg-red-50/40 dark:bg-red-950/20' : 
                fase.completada ? 'border-green-200 bg-green-50/30 dark:bg-green-950/20' : 
                esCritica ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/20' : 'bg-card'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground w-6 font-bold">#{index + 1}</span>
                  <h4 className="font-semibold text-sm">{fase.nombre}</h4>

                  {esCritica && (
                    <Badge variant="destructive" className="text-[10px] py-0 gap-1">
                      <Flame className="h-2.5 w-2.5" /> Ruta Crítica
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Compromiso: {fase.fecha_compromiso ? new Date(fase.fecha_compromiso).toLocaleDateString('es-MX') : 'N/A'}
                  </span>

                  {retraso > 0 && (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      +{retraso} días retraso
                    </span>
                  )}

                  {fase.completada ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completada
                    </span>
                  ) : (
                    <Badge variant={avance > 0 ? 'warning' : 'secondary'} className="text-xs">
                      {avance}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Progress value={avance} className="h-2.5" />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

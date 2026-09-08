import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { CalendarCheck, Loader2 } from 'lucide-react'

export function NuevaAsistenciaModal() {
  const [open, setOpen] = useState(false)
  const [empleadoId, setEmpleadoId] = useState('')

  const queryClient = useQueryClient()

  const { data: empleadosData } = useQuery({
    queryKey: ['empleados-asistencia-modal'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/rrhh/empleados/?activo=true')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const empleados = Array.isArray(empleadosData) ? empleadosData : []

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post('/rrhh/asistencias/registrar_hoy/', { empleado: id })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencias-hoy'] })
      queryClient.invalidateQueries({ queryKey: ['asistencias'] })
      toast.success('Asistencia registrada correctamente para el día de hoy')
      setOpen(false)
      setEmpleadoId('')
    },
    onError: (error: any) => {
      toast.error('Error al registrar asistencia', {
        description: error.response?.data?.error || 'No se pudo registrar la entrada/salida.'
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!empleadoId) {
      toast.error('Selecciona un empleado')
      return
    }
    mutation.mutate(empleadoId)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-[#c5a059]/40 text-[#e0b868] hover:bg-[#c5a059]/10">
          <CalendarCheck className="h-4 w-4" /> Registrar Asistencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CalendarCheck className="h-5 w-5 text-emerald-500" />
            Check-In / Check-Out de Asistencia Diaria
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="empleado">Empleado *</Label>
            <select 
              id="empleado" 
              value={empleadoId} 
              onChange={e => setEmpleadoId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">Seleccionar empleado de plantilla...</option>
              {empleados.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre_completo} ({emp.empresa_nombre || 'Holding'}) — {emp.puesto}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Marcaje
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

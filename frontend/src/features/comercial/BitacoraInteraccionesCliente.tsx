import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Phone, MessageSquare, Mail, Users, Calendar, Clock, Check, UserCheck, Flame, ThermometerSnowflake, FileText } from 'lucide-react'

interface Interaccion {
  id: string
  usuario_nombre: string
  tipo_display: string
  resultado_notas: string
  proximo_seguimiento: string | null
  fecha_contacto: string
}

interface BitacoraProps {
  leadId: string
  clienteNombre: string
  telefono?: string
  email?: string
  interacciones: Interaccion[]
}

export function BitacoraInteraccionesCliente({ leadId, clienteNombre, telefono, email, interacciones }: BitacoraProps) {
  const [tipoAccion, setTipoAccion] = useState<'llamada' | 'whatsapp' | 'correo' | 'reunion'>('llamada')
  const [temperatura, setTemperatura] = useState<'caliente' | 'tibio' | 'frio'>('caliente')
  const [notas, setNotas] = useState('')
  const [proximo, setProximo] = useState('')
  const [responsableSeguimiento, setResponsableSeguimiento] = useState('')
  const [listaInteracciones, setListaInteracciones] = useState<Interaccion[]>(interacciones)

  const queryClient = useQueryClient()

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-select'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/core/usuarios/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch {
        return []
      }
    }
  })

  const usuarios = Array.isArray(usuariosData) ? usuariosData : []

  useEffect(() => {
    setListaInteracciones(interacciones)
  }, [interacciones])

  const mutationRegistrar = useMutation({
    mutationFn: async () => {
      const notaCompleta = `[${temperatura.toUpperCase()}] ${notas}`
      const { data } = await api.post(`/comercial/leads/${leadId}/registrar_contacto/`, {
        tipo: tipoAccion,
        resultado_notas: notaCompleta,
        proximo_seguimiento: proximo || null,
        responsable_seguimiento: responsableSeguimiento || null
      })
      return data
    },
    onSuccess: (nuevaInteraccion) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['bitacora-personal'] })
      queryClient.invalidateQueries({ queryKey: ['metricas-desempeno'] })
      
      setListaInteracciones(prev => [nuevaInteraccion, ...prev])
      toast.success('Interacción y compromiso guardados en la Bitácora Comercial')
      setNotas('')
      setProximo('')
    }
  })

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
          <Clock className="h-4 w-4 text-[#c5a059]" />
          Bitácora Comercial & Registro Diario
        </h4>
        <span className="text-[11px] text-muted-foreground">{listaInteracciones.length} interacción(es)</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground">1. Canal de Interacción:</Label>
          <div className="grid grid-cols-4 gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant={tipoAccion === 'llamada' ? 'default' : 'outline'}
              onClick={() => setTipoAccion('llamada')}
              className={`text-[10px] h-7 gap-1 ${tipoAccion === 'llamada' ? 'bg-blue-600 text-white font-bold' : ''}`}
            >
              <Phone className="h-3 w-3" /> Llamada
            </Button>

            <Button 
              type="button" 
              size="sm" 
              variant={tipoAccion === 'whatsapp' ? 'default' : 'outline'}
              onClick={() => setTipoAccion('whatsapp')}
              className={`text-[10px] h-7 gap-1 ${tipoAccion === 'whatsapp' ? 'bg-green-600 text-white font-bold' : 'border-green-600 text-green-600'}`}
            >
              <MessageSquare className="h-3 w-3" /> WA
            </Button>

            <Button 
              type="button" 
              size="sm" 
              variant={tipoAccion === 'correo' ? 'default' : 'outline'}
              onClick={() => setTipoAccion('correo')}
              className={`text-[10px] h-7 gap-1 ${tipoAccion === 'correo' ? 'bg-purple-600 text-white font-bold' : ''}`}
            >
              <Mail className="h-3 w-3" /> Email
            </Button>

            <Button 
              type="button" 
              size="sm" 
              variant={tipoAccion === 'reunion' ? 'default' : 'outline'}
              onClick={() => setTipoAccion('reunion')}
              className={`text-[10px] h-7 gap-1 ${tipoAccion === 'reunion' ? 'bg-amber-600 text-white font-bold' : ''}`}
            >
              <Users className="h-3 w-3" /> Visita
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground">2. Disposición / Temperatura Prospecto:</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              type="button" 
              size="sm" 
              variant={temperatura === 'caliente' ? 'default' : 'outline'}
              onClick={() => setTemperatura('caliente')}
              className={`text-[10px] h-7 gap-1 ${temperatura === 'caliente' ? 'bg-red-600 text-white font-bold' : 'border-red-500 text-red-600'}`}
            >
              <Flame className="h-3 w-3" /> Caliente
            </Button>

            <Button 
              type="button" 
              size="sm" 
              variant={temperatura === 'tibio' ? 'default' : 'outline'}
              onClick={() => setTemperatura('tibio')}
              className={`text-[10px] h-7 gap-1 ${temperatura === 'tibio' ? 'bg-amber-500 text-white font-bold' : 'border-amber-500 text-amber-600'}`}
            >
              Tibio
            </Button>

            <Button 
              type="button" 
              size="sm" 
              variant={temperatura === 'frio' ? 'default' : 'outline'}
              onClick={() => setTemperatura('frio')}
              className={`text-[10px] h-7 gap-1 ${temperatura === 'frio' ? 'bg-blue-500 text-white font-bold' : ''}`}
            >
              <ThermometerSnowflake className="h-3 w-3" /> Frío
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/30 rounded-lg border space-y-2 text-xs">
        <div className="space-y-1">
          <Label className="text-[11px] font-bold">Acuerdos Clave & Minuta de la Interacción:</Label>
          <Input 
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder={`Detallar acuerdos o avances en la ${tipoAccion}...`}
            className="h-8 text-xs bg-background"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Próximo Seguimiento (SLA):</Label>
            <Input 
              type="date"
              value={proximo}
              onChange={e => setProximo(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-blue-500" /> Delegar Seguimiento A:
            </Label>
            <select
              value={responsableSeguimiento}
              onChange={e => setResponsableSeguimiento(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
            >
              <option value="">A mí mismo / Responsables</option>
              {usuarios.map((u: any) => (
                <option key={u.id} value={u.id}>{u.nombre_completo} ({u.puesto || u.username})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button 
            type="button"
            size="sm"
            disabled={!notas.trim() || mutationRegistrar.isPending}
            onClick={() => mutationRegistrar.mutate()}
            className="bg-[#c5a059] hover:bg-[#b38f46] text-black font-bold h-8 text-xs gap-1"
          >
            <Check className="h-3.5 w-3.5" /> Registrar Interacción
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {listaInteracciones.map((item) => (
          <div key={item.id} className="p-2.5 rounded border bg-card text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-foreground">{item.tipo_display} — {item.usuario_nombre}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(item.fecha_contacto).toLocaleString('es-MX')}</span>
            </div>
            <p className="text-muted-foreground">{item.resultado_notas}</p>
            {item.proximo_seguimiento && (
              <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> SLA Compromiso: {item.proximo_seguimiento}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

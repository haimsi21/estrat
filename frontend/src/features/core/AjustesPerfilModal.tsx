import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { User, KeyRound, Shield, Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

export function AjustesPerfilModal() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passConfirm, setPassConfirm] = useState('')

  const queryClient = useQueryClient()

  const mutationPass = useMutation({
    mutationFn: async () => {
      if (passNueva !== passConfirm) {
        throw new Error('La nueva contraseña y su confirmación no coinciden.')
      }
      const { data } = await api.post('/core/me/cambiar_password/', {
        password_actual: passActual,
        password_nueva: passNueva
      })
      return data
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente')
      setPassActual('')
      setPassNueva('')
      setPassConfirm('')
      setOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || error.response?.data?.error || 'Error al cambiar contraseña')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passNueva || passNueva.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres')
      return
    }
    mutationPass.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-left w-full hover:opacity-80 transition-opacity">
          <div className="border-b border-border px-5 py-3.5 bg-muted/40 transition-all flex items-center justify-between">
            <div className="truncate">
              <p className="font-semibold text-xs tracking-wide text-foreground uppercase truncate">
                {user?.nombre || user?.username || 'USUARIO'}
              </p>
              <p className="text-[10px] text-[#c5a059] tracking-wider uppercase font-mono font-bold truncate">
                {user?.puesto || 'COLABORADOR'}
              </p>
            </div>
            <KeyRound className="h-4 w-4 text-[#c5a059] flex-shrink-0 ml-2" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <User className="h-5 w-5 text-[#c5a059]" />
            Mi Perfil & Ajustes de Seguridad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs mt-2">
          {/* TARJETA DE RESUMEN DE PERFIL */}
          <div className="p-3 bg-muted/30 border rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-foreground">{user?.nombre_completo || user?.username}</span>
              <Badge variant="gold" className="text-[10px] font-bold">{user?.puesto || 'Colaborador'}</Badge>
            </div>
            <p className="text-muted-foreground">Correo: <span className="font-semibold text-foreground">{user?.email || 'Sin correo registrado'}</span></p>
            <p className="text-muted-foreground">Login ID: <span className="font-mono text-foreground font-bold">{user?.username}</span></p>
          </div>

          {/* FORMULARIO PARA CAMBIAR CONTRASEÑA */}
          <form onSubmit={handleSubmit} className="p-3 bg-card border rounded-lg space-y-3">
            <p className="font-bold text-xs text-[#c5a059] flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Cambiar Contraseña de Acceso
            </p>

            <div className="space-y-1">
              <Label className="text-[11px]">Contraseña Actual:</Label>
              <Input 
                type="password"
                value={passActual}
                onChange={e => setPassActual(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Nueva Contraseña:</Label>
                <Input 
                  type="password"
                  value={passNueva}
                  onChange={e => setPassNueva(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="h-8 text-xs bg-background font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Confirmar Nueva Contraseña:</Label>
                <Input 
                  type="password"
                  value={passConfirm}
                  onChange={e => setPassConfirm(e.target.value)}
                  placeholder="Repetir clave"
                  className="h-8 text-xs bg-background font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutationPass.isPending} className="bg-[#c5a059] hover:bg-[#b38f46] text-black font-bold h-8 text-xs gap-1">
                {mutationPass.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Guardar Nueva Contraseña
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

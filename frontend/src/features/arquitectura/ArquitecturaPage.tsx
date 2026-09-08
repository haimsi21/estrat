import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Search, Loader2, Box, FileText, ArrowLeft, Eye, Download, Image as ImageIcon, Building2 } from 'lucide-react'
import { NuevaPropuestaModal } from './NuevaPropuestaModal'
import { FileUpload } from '@/components/ui/FileUpload'

interface ArchivoDiseno {
  id: number
  tipo: string
  tipo_display?: string
  archivo: string
}

interface PropuestaDiseno {
  id: string
  cliente_nombre?: string
  proyecto_nombre?: string
  version: number
  estatus: string
  creado_en?: string
  archivos?: ArchivoDiseno[]
}

export function ArquitecturaPage() {
  const [search, setSearch] = useState('')
  const [propuestaSeleccionada, setPropuestaSeleccionada] = useState<PropuestaDiseno | null>(null)
  const [showViewer, setShowViewer] = useState(false)

  const queryClient = useQueryClient()

  const { data: propuestasData, isLoading } = useQuery({
    queryKey: ['propuestas'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/arquitectura/propuestas/')
        return Array.isArray(data) ? data : (data.results || [])
      } catch (err) {
        console.error("Error cargando propuestas de arquitectura:", err)
        return []
      }
    },
  })

  useEffect(() => {
    if (showViewer && !document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
      document.head.appendChild(script)
    }
  }, [showViewer])

  const propuestas = Array.isArray(propuestasData) ? propuestasData : []

  const propuestasFiltradas = propuestas.filter((p: PropuestaDiseno) =>
    (p.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.proyecto_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const mutationAgregarArchivo = useMutation({
    mutationFn: async ({ propuestaId, tipo, archivoPath }: { propuestaId: string; tipo: string; archivoPath: string }) => {
      const { data } = await api.post(`/arquitectura/propuestas/${propuestaId}/agregar_archivo/`, {
        tipo,
        archivo: archivoPath
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propuestas'] })
      toast.success('Archivo adjuntado a la propuesta')
    }
  })

  const handleVerDetalle = (propuesta: PropuestaDiseno) => {
    setPropuestaSeleccionada(propuesta)
    setShowViewer(true)
  }

  const handleVolver = () => {
    setShowViewer(false)
    setPropuestaSeleccionada(null)
  }

  if (showViewer && propuestaSeleccionada) {
    const archivos = propuestaSeleccionada.archivos || []
    const modelo3D = archivos.find(a => a.tipo === 'modelo_3d')
    const planos = archivos.filter(a => a.tipo === 'plano' || a.tipo === 'documento')
    const renders = archivos.filter(a => a.tipo === 'render' || a.tipo === 'foto')

    const modeloUrl = modelo3D?.archivo ? (
      modelo3D.archivo.startsWith('http') ? modelo3D.archivo : `/media/${modelo3D.archivo}`
    ) : "https://modelviewer.dev/shared-assets/models/Astronaut.usdz"

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{propuestaSeleccionada.proyecto_nombre || 'Propuesta de Diseño Arquitectónico'}</h1>
            <p className="text-muted-foreground">{propuestaSeleccionada.cliente_nombre || 'Cliente'} • Versión v{propuestaSeleccionada.version}</p>
          </div>
          <Badge className="ml-auto" variant={propuestaSeleccionada.estatus === 'aprobado' ? 'success' : 'secondary'}>
            {propuestaSeleccionada.estatus}
          </Badge>
        </div>

        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/40 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Box className="h-5 w-5 text-purple-600" />
              Visor 3D LiDAR Interactivo (USDZ / GLTF)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[480px] w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* @ts-ignore */}
              <model-viewer
                src={modeloUrl}
                alt="Modelo 3D Arquitectónico"
                auto-rotate
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                exposure="1"
                style={{ width: '100%', height: '100%' }}
                ar
                ar-modes="webxr scene-viewer quick-look"
              >
                <button slot="ar-button" className="absolute bottom-4 right-4 rounded-full bg-blue-600 px-5 py-2.5 text-white text-xs font-semibold shadow-lg hover:bg-blue-700">
                  👁️ Ver en Realidad Aumentada (AR)
                </button>
              {/* @ts-ignore */}
              </model-viewer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-blue-600" />
                Planos Arquitectónicos (AutoCAD / DWG / PDF)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planos.length > 0 ? (
                planos.map((plano) => (
                  <div key={plano.id} className="flex items-center justify-between p-3 rounded-md border bg-card text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate font-medium">{plano.archivo.split('/').pop()}</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={plano.archivo.startsWith('http') ? plano.archivo : `/media/${plano.archivo}`} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5 mr-1" /> Abrir / Descargar
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No hay planos AutoCAD/PDF adjuntos aún.</p>
              )}

              <div className="pt-2 border-t">
                <Label className="text-xs font-semibold mb-1 block">Subir Nuevo Plano (DWG / PDF):</Label>
                <FileUpload 
                  fileType="documento"
                  accept=".dwg,.dxf,.pdf"
                  onUploadComplete={(file) => {
                    mutationAgregarArchivo.mutate({
                      propuestaId: propuestaSeleccionada.id,
                      tipo: 'plano',
                      archivoPath: file.file_path
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-5 w-5 text-green-600" />
                Renders & Visuales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renders.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {renders.map((ren) => (
                    <div key={ren.id} className="aspect-video relative rounded-md overflow-hidden border bg-muted">
                      <img 
                        src={ren.archivo.startsWith('http') ? ren.archivo : `/media/${ren.archivo}`} 
                        alt="Render" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No hay renders fotorrealistas adjuntos aún.</p>
              )}

              <div className="pt-2 border-t">
                <Label className="text-xs font-semibold mb-1 block">Subir Nuevo Render (JPG / PNG):</Label>
                <FileUpload 
                  fileType="foto"
                  accept="image/*"
                  onUploadComplete={(file) => {
                    mutationAgregarArchivo.mutate({
                      propuestaId: propuestaSeleccionada.id,
                      tipo: 'render',
                      archivoPath: file.file_path
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arquitectura</h1>
          <p className="text-muted-foreground">Propuestas de diseño, planos AutoCAD (DWG/PDF) y Modelos 3D LiDAR (USDZ)</p>
        </div>
        <NuevaPropuestaModal />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {propuestasFiltradas.map((propuesta: PropuestaDiseno) => (
            <Card 
              key={propuesta.id} 
              className="cursor-pointer hover:shadow-lg hover:border-purple-500/50 transition-all border group"
              onClick={() => handleVerDetalle(propuesta)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                    {propuesta.proyecto_nombre || 'Propuesta Arquitectónica'}
                  </CardTitle>
                  <Badge variant={propuesta.estatus === 'aprobado' ? 'success' : 'secondary'}>
                    {propuesta.estatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{propuesta.cliente_nombre || 'Sin cliente'}</span>
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Versión v{propuesta.version}</span>
                  </div>
                  <span className="text-purple-600 font-medium flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> Ver 3D & Planos ➔
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {propuestasFiltradas.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <Box className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No se encontraron propuestas de arquitectura registradas</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

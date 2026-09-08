import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/ui/FileUpload'
import { toast } from 'sonner'
import { 
  FolderUp, FileText, Box, Image as ImageIcon, Scale, 
  DollarSign, Download, Eye, Clock, User, Layers, X
} from 'lucide-react'

interface ArchivoBoveda {
  id: string
  categoria: 'planos' | 'modelos_3d' | 'renders' | 'contratos' | 'cotizaciones'
  file_name: string
  file_url: string
  file_path: string
  file_size: number
  version: number
  subido_por: string
  subido_en: string
}

interface BovedaProps {
  proyectoId: string
  proyectoNombre: string
}

const CATEGORIAS = [
  { key: 'todos', label: 'Todos los Archivos', icon: Layers, color: 'text-[#c5a059]' },
  { key: 'planos', label: '📄 Planos & Diseños (.pdf, .dwg)', icon: FileText, color: 'text-blue-500' },
  { key: 'modelos_3d', label: '📐 Modelos 3D & LiDAR (.usdz, .gltf)', icon: Box, color: 'text-purple-500' },
  { key: 'renders', label: '🖼️ Renders & Fotos (.jpg, .png)', icon: ImageIcon, color: 'text-green-500' },
  { key: 'contratos', label: '📝 Contratos & Licencias (.pdf, .doc)', icon: Scale, color: 'text-indigo-500' },
  { key: 'cotizaciones', label: '💰 Cotizaciones & Presupuestos (.xlsx)', icon: DollarSign, color: 'text-amber-500' },
]

export function BovedaDocumentalInHouse({ proyectoId, proyectoNombre }: BovedaProps) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [categoriaUpload, setCategoriaUpload] = useState<'planos' | 'modelos_3d' | 'renders' | 'contratos' | 'cotizaciones'>('planos')
  const [previewImagenUrl, setPreviewImagenUrl] = useState<string | null>(null)

  const [archivos, setArchivos] = useState<ArchivoBoveda[]>([
    {
      id: '1',
      categoria: 'modelos_3d',
      file_name: 'Modelo_Residencial_LiDAR_v2.usdz',
      file_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      file_path: 'arquitectura/modelos/Modelo_v2.usdz',
      file_size: 15420000,
      version: 2,
      subido_por: 'Arq. Sofía Martínez',
      subido_en: '20/08/2026 18:30'
    },
    {
      id: '2',
      categoria: 'planos',
      file_name: 'Plano_Estructural_Cimentacion_v1.pdf',
      file_url: '/media/documentos/Plano_v1.pdf',
      file_path: 'documentos/Plano_v1.pdf',
      file_size: 4250000,
      version: 1,
      subido_por: 'Ing. Miguel Hernández',
      subido_en: '18/08/2026 11:15'
    }
  ])

  const handleFileUploadComplete = (fileData: any) => {
    const ext = (fileData.file_name || '').split('.').pop()?.toLowerCase()
    let catAuto: 'planos' | 'modelos_3d' | 'renders' | 'contratos' | 'cotizaciones' = categoriaUpload

    if (['usdz', 'gltf', 'glb', 'obj'].includes(ext || '')) catAuto = 'modelos_3d'
    else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) catAuto = 'renders'
    else if (['xlsx', 'xls', 'csv'].includes(ext || '')) catAuto = 'cotizaciones'
    else if (['dwg', 'dxf'].includes(ext || '')) catAuto = 'planos'

    const nuevaVersion = archivos.filter(a => a.categoria === catAuto).length + 1

    const nuevoArchivo: ArchivoBoveda = {
      id: String(Date.now()),
      categoria: catAuto,
      file_name: fileData.file_name,
      file_url: fileData.file_url,
      file_path: fileData.file_path,
      file_size: fileData.file_size || 1024000,
      version: nuevaVersion,
      subido_por: 'Director General',
      subido_en: new Date().toLocaleString('es-MX')
    }

    setArchivos(prev => [nuevoArchivo, ...prev])
    toast.success(`Archivo "${fileData.file_name}" subido e integrado al Expediente!`)
  }

  const handlePrevisualizar = (item: ArchivoBoveda) => {
    const ext = item.file_name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      setPreviewImagenUrl(item.file_url)
    } else {
      window.open(item.file_url, '_blank')
    }
  }

  const archivosFiltrados = categoriaFiltro === 'todos' 
    ? archivos 
    : archivos.filter(a => a.categoria === categoriaFiltro)

  const getCategoriaBadge = (cat: string) => {
    switch (cat) {
      case 'planos': return <Badge className="bg-blue-600 text-white text-[10px]">📄 Planos & Diseños</Badge>
      case 'modelos_3d': return <Badge className="bg-purple-600 text-white text-[10px]">📐 Modelo 3D / LiDAR</Badge>
      case 'renders': return <Badge className="bg-green-600 text-white text-[10px]">🖼️ Render / Foto</Badge>
      case 'contratos': return <Badge className="bg-indigo-600 text-white text-[10px]">📝 Contrato / Legal</Badge>
      case 'cotizaciones': return <Badge className="bg-amber-600 text-white text-[10px]">💰 Cotización / Excel</Badge>
      default: return <Badge variant="outline" className="text-[10px]">Documento</Badge>
    }
  }

  return (
    <Card className="border-2 border-[#c5a059]/40">
      <CardHeader className="bg-muted/30 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <FolderUp className="h-5 w-5 text-[#c5a059]" />
            Bóveda Documental In-House & Control de Versiones ($v_1, v_2, v_3$)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión interna de expedientes por categoría (Cero Drive / Enlaces Externos)</p>
        </div>

        <Badge variant="outline" className="font-mono text-xs w-fit">
          {archivos.length} Archivo(s) en Expediente
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">

        <div className="p-3 bg-muted/20 border rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="font-bold text-xs text-[#c5a059] flex items-center gap-1">
              <FolderUp className="h-4 w-4" /> Subir Nuevo Archivo al Expediente de {proyectoNombre}:
            </Label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Categoría de Destino:</span>
              <select
                value={categoriaUpload}
                onChange={e => setCategoriaUpload(e.target.value as any)}
                className="flex h-7 rounded-md border border-input bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 text-xs font-semibold px-2 py-0"
              >
                <option value="planos" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">📄 Planos & Diseños (.pdf, .dwg)</option>
                <option value="modelos_3d" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">📐 Modelos 3D & LiDAR (.usdz, .gltf)</option>
                <option value="renders" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">🖼️ Renders & Fotografías (.jpg, .png)</option>
                <option value="contratos" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">📝 Contratos & Licencias (.pdf, .doc)</option>
                <option value="cotizaciones" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">💰 Cotizaciones & Presupuestos (.xlsx)</option>
              </select>
            </div>
          </div>

          <FileUpload
            fileType="documento"
            accept="*/*"
            maxFiles={10}
            projectId={proyectoId}
            onUploadComplete={handleFileUploadComplete}
            label=""
            description="Haz clic o arrastra aquí planos, modelos 3D USDZ, renders, contratos o tablas Excel."
          />
        </div>

        <div className="flex border-b overflow-x-auto gap-1">
          {CATEGORIAS.map((cat) => {
            const active = categoriaFiltro === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setCategoriaFiltro(cat.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active 
                    ? 'border-[#c5a059] text-[#c5a059] font-bold' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                {cat.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          {archivosFiltrados.map((item) => (
            <div key={item.id} className="p-3 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#c5a059]/40 transition-colors">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getCategoriaBadge(item.categoria)}
                  <span className="font-bold text-sm text-foreground truncate">{item.file_name}</span>
                  <Badge variant="gold" className="text-[10px] font-mono font-bold">v{item.version}</Badge>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-purple-500" /> {item.subido_por}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" /> {item.subido_en}
                  </span>
                  <span>{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handlePrevisualizar(item)}
                  className="h-7 text-xs gap-1"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-500" /> Ver / Previsualizar
                </Button>

                <Button 
                  size="sm" 
                  variant="outline"
                  asChild
                  className="h-7 text-xs gap-1 border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10"
                >
                  <a href={item.file_url} download target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5" /> Descargar
                  </a>
                </Button>
              </div>
            </div>
          ))}

          {archivosFiltrados.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
              No hay archivos cargados en esta categoría para este expediente.
            </div>
          )}
        </div>
      </CardContent>

      {previewImagenUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImagenUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-card p-2 rounded-lg border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImagenUrl(null)} 
              className="absolute top-3 right-3 bg-black/70 text-white rounded-full p-1 hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewImagenUrl} alt="Previsualización Render/Foto" className="max-w-full max-h-[85vh] object-contain rounded" />
          </div>
        </div>
      )}
    </Card>
  )
}

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X, File, Image, FileText, Box, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface FileUploadProps {
  accept?: string
  fileType: 'foto' | 'modelo_3d' | 'pdf' | 'documento'
  maxFiles?: number
  onUploadComplete?: (fileData: FileData) => void
  onUploadError?: (error: string) => void
  projectId?: string
  label?: string
  description?: string
}

interface FileData {
  file_url: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  uploaded_at: string
}

export function FileUpload({
  accept,
  fileType,
  maxFiles = 1,
  onUploadComplete,
  onUploadError,
  projectId,
  label,
  description
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    
    if (uploadedFiles.length + filesArray.length > maxFiles) {
      toast.error(`Solo se permiten ${maxFiles} archivo(s)`, {
        description: `Ya tienes ${uploadedFiles.length} archivo(s) subido(s)`
      })
      return
    }

    setUploading(true)
    setProgress(0)

    for (const file of filesArray) {
      try {
        // LÍMITE DE TAMAÑO AMPLIADO A 100MB (100 * 1024 * 1024)
        const maxSize = 100 * 1024 * 1024
        if (file.size > maxSize) {
          toast.error(`Archivo muy grande: ${file.name}`, {
            description: `El tamaño máximo permitido es 100MB`
          })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', fileType)
        if (projectId) {
          formData.append('project_id', projectId)
        }

        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 150)

        const response = await api.post('/core/upload/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        clearInterval(progressInterval)
        setProgress(100)

        if (response.data.success) {
          const fileData: FileData = response.data
          setUploadedFiles(prev => [...prev, fileData])
          toast.success('Archivo guardado en la Bóveda In-House', {
            description: file.name
          })
          onUploadComplete?.(fileData)
        }

        setTimeout(() => setProgress(0), 400)

      } catch (error: any) {
        console.error('Error uploading file:', error)
        const errorMessage = error.response?.data?.error || 'Error al subir el archivo'
        toast.error(errorMessage)
        onUploadError?.(errorMessage)
      }
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = async (fileData: FileData) => {
    try {
      await api.delete('/core/upload/delete/', {
        data: { file_path: fileData.file_path }
      })
      setUploadedFiles(prev => prev.filter(f => f.file_path !== fileData.file_path))
      toast.success('Archivo eliminado')
    } catch {
      toast.error('Error al eliminar el archivo')
    }
  }

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
          ${uploading ? 'border-[#c5a059] bg-[#c5a059]/5' : 'border-muted-foreground/25 hover:border-[#c5a059] hover:bg-[#c5a059]/5'}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || '*/*'}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#c5a059]" />
            <p className="text-xs font-semibold text-muted-foreground">Subiendo archivo a Bóveda In-House...</p>
            <Progress value={progress} className="w-full max-w-xs mx-auto h-2" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="h-7 w-7 mx-auto text-[#c5a059]" />
            <p className="text-xs font-bold text-foreground">
              Haz clic o arrastra planos, modelos 3D o documentos aquí
            </p>
            <p className="text-[11px] text-muted-foreground">
              Soporta PDF, DWG, USDZ, GLTF, JPG, PNG, XLSX (Máximo 100 MB)
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2.5 bg-card rounded-lg border text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="h-4 w-4 text-[#c5a059]" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{file.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFile(file)
                }}
                className="h-7 w-7 text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

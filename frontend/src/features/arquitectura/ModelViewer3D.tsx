import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Box } from 'lucide-react'

interface ModelViewer3DProps {
  src: string
  title?: string
  alt?: string
}

export function ModelViewer3D({ src, title = 'Modelo 3D Interactivo', alt = 'Modelo 3D' }: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
      document.head.appendChild(script)
    }
  }, [])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 mr-1" /> Recargar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
        >
          {/* @ts-ignore */}
          <model-viewer
            src={src}
            alt={alt}
            auto-rotate
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="1"
            environment-image="neutral"
            style={{ width: '100%', height: '100%' }}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
          >
            <div slot="progress-bar" className="absolute inset-0 flex items-center justify-center bg-background/80">
              <p className="text-sm text-muted-foreground">Cargando visor 3D (USDZ/GLTF)...</p>
            </div>
          {/* @ts-ignore */}
          </model-viewer>
        </div>
      </CardContent>
    </Card>
  )
}

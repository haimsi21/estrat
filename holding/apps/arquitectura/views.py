from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import PropuestaDiseno, ArchivoDiseno
from .serializers import PropuestaDisenoSerializer, PropuestaDisenoListSerializer, ArchivoDisenoSerializer
from apps.core.models import Cliente


class PropuestaDisenoViewSet(viewsets.ModelViewSet):
    serializer_class = PropuestaDisenoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'proyecto', 'estatus', 'arquitecto_responsable']
    search_fields = ['cliente__razon_social', 'cliente__nombre_comercial', 'proyecto__nombre', 'version']
    ordering = ['-creado_en']

    def get_queryset(self):
        return PropuestaDiseno.objects.select_related(
            'cliente', 'proyecto', 'arquitecto_responsable'
        ).prefetch_related('archivos').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return PropuestaDisenoListSerializer
        return PropuestaDisenoSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Flujo Cero Fricción: si escriben nombre del prospecto
        nombre_prospecto = data.get('nombre_prospecto', '').strip()
        if not data.get('cliente') and nombre_prospecto:
            cliente_obj, _ = Cliente.objects.get_or_create(
                nombre_comercial=nombre_prospecto,
                defaults={
                    'razon_social': nombre_prospecto,
                    'activo': True
                }
            )
            data['cliente'] = str(cliente_obj.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        propuesta = serializer.save()

        # Procesar archivos adjuntos si vienen en el payload (planos, modelos_3d, renders)
        archivos_input = request.data.get('archivos_input', [])
        if isinstance(archivos_input, list):
            for item in archivos_input:
                tipo = item.get('tipo', 'plano')
                archivo_path = item.get('archivo', '')
                if archivo_path:
                    ArchivoDiseno.objects.create(
                        propuesta=propuesta,
                        tipo=tipo,
                        archivo=archivo_path
                    )

        headers = self.get_success_headers(serializer.data)
        return Response(PropuestaDisenoSerializer(propuesta).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def agregar_archivo(self, request, pk=None):
        propuesta = self.get_object()
        tipo = request.data.get('tipo', 'plano')
        archivo_path = request.data.get('archivo', '')

        if not archivo_path:
            return Response({'error': 'Debes enviar la ruta del archivo'}, status=status.HTTP_400_BAD_REQUEST)

        nuevo_archivo = ArchivoDiseno.objects.create(
            propuesta=propuesta,
            tipo=tipo,
            archivo=archivo_path
        )
        return Response(ArchivoDisenoSerializer(nuevo_archivo).data, status=status.HTTP_201_CREATED)


class ArchivoDisenoViewSet(viewsets.ModelViewSet):
    queryset = ArchivoDiseno.objects.select_related('propuesta').all()
    serializer_class = ArchivoDisenoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['propuesta', 'tipo']
    ordering = ['-subido_en']

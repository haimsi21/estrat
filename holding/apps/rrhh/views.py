from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Empleado, Asistencia
from .serializers import EmpleadoSerializer, AsistenciaSerializer

class EmpleadoViewSet(viewsets.ModelViewSet):
    serializer_class = EmpleadoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'activo', 'cuadrilla']
    search_fields = ['nombre_completo', 'puesto']
    ordering = ['nombre_completo']
    
    def get_queryset(self):
        return Empleado.objects.select_related(
            'empresa', 'cuadrilla__proyecto'
        ).all()

class AsistenciaViewSet(viewsets.ModelViewSet):
    serializer_class = AsistenciaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empleado', 'fecha', 'pedido_produccion']
    search_fields = ['empleado__nombre_completo']
    ordering = ['-fecha']
    
    def get_queryset(self):
        return Asistencia.objects.select_related(
            'empleado__empresa', 'pedido_produccion'
        ).all()

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from .models import Proyecto, Fase, ParticipacionEmpresa
from .serializers import ProyectoSerializer, ProyectoListSerializer, FaseSerializer, ParticipacionEmpresaSerializer


class ProyectoViewSet(viewsets.ModelViewSet):
    serializer_class = ProyectoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'cliente', 'activo', 'responsable']
    search_fields = ['nombre', 'cliente__razon_social']
    ordering = ['-creado_en']
    
    def get_queryset(self):
        return Proyecto.objects.select_related(
            'cliente', 'empresa', 'responsable', 'contrato'
        ).prefetch_related('fases', 'participaciones__empresa').all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProyectoListSerializer
        return ProyectoSerializer

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def actualizar_cancha(self, request, pk=None):
        proyecto = self.get_object()
        participacion_id = request.data.get('participacion_id')
        estatus_cancha = request.data.get('estatus_cancha')
        porcentaje_avance = request.data.get('porcentaje_avance')

        try:
            part = ParticipacionEmpresa.objects.get(id=participacion_id, proyecto=proyecto)
            if estatus_cancha:
                part.estatus_cancha = estatus_cancha
            if porcentaje_avance is not None:
                part.porcentaje_avance = int(porcentaje_avance)
            part.save()

            return Response(ProyectoSerializer(proyecto).data, status=status.HTTP_200_OK)
        except ParticipacionEmpresa.DoesNotExist:
            return Response({'error': 'Participación de empresa no encontrada'}, status=status.HTTP_404_NOT_FOUND)


class FaseViewSet(viewsets.ModelViewSet):
    queryset = Fase.objects.select_related('proyecto').all()
    serializer_class = FaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto', 'completada']
    ordering = ['fecha_compromiso']


class ParticipacionEmpresaViewSet(viewsets.ModelViewSet):
    queryset = ParticipacionEmpresa.objects.select_related('proyecto', 'empresa').all()
    serializer_class = ParticipacionEmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto', 'empresa', 'estatus_cancha']
    ordering = ['empresa__nombre']

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta, datetime

from .models import Lead, Cotizacion, Contrato, InteraccionCliente
from .serializers import LeadSerializer, CotizacionSerializer, ContratoSerializer, InteraccionClienteSerializer
from apps.core.models import Cliente, Empresa, Usuario, EventoAuditoria, DocumentoAutorizacion
from apps.proyectos.models import Proyecto, Fase, ParticipacionEmpresa


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'estatus', 'origen']
    search_fields = ['cliente__razon_social', 'cliente__nombre_comercial', 'notas', 'nombre_proyecto']
    ordering = ['-creado_en']

    def get_queryset(self):
        user = self.request.user
        qs = Lead.objects.select_related(
            'cliente', 'empresa', 'responsable', 'siguiente_accion_responsable'
        ).prefetch_related('interacciones__usuario').all()

        if (
            user.is_superuser or 
            user.username.lower() in ['director', 'admin', 'master'] or 
            getattr(user, 'capa_acceso', '') == 'direccion' or 
            getattr(user, 'departamento', '') == 'direccion'
        ):
            return qs

        return qs.filter(
            Q(responsable=user) | 
            Q(siguiente_accion_responsable=user) | 
            Q(interacciones__usuario=user)
        ).distinct()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if not data.get('responsable'):
            data['responsable'] = str(request.user.id)

        tipos_detalle = data.pop('tipos_proyecto_detalle', [])

        nombre_prospecto = data.get('nombre_prospecto', '').strip()
        cliente_id = data.get('cliente')

        estado = data.get('estado_republica', 'CDMX')
        ciudad = data.get('ciudad_municipio', '').strip()
        cp = data.get('codigo_postal', '').strip()
        ubicacion_completa = f"{ciudad}, {estado}".strip(", ")
        if cp:
            ubicacion_completa += f" (CP: {cp})"

        if (not cliente_id or str(cliente_id).strip() == '') and nombre_prospecto:
            cliente_obj, _ = Cliente.objects.get_or_create(
                nombre_comercial=nombre_prospecto,
                defaults={
                    'razon_social': nombre_prospecto,
                    'contacto_nombre': data.get('contacto_nombre', nombre_prospecto),
                    'contacto_email': data.get('contacto_email', ''),
                    'contacto_telefono': data.get('contacto_telefono', ''),
                    'codigo_postal': cp,
                    'estado_republica': estado,
                    'ciudad_municipio': ciudad,
                    'ubicacion': ubicacion_completa,
                    'tipo_propiedad': data.get('tipo_propiedad', 'residencial'),
                    'superficie_m2': float(data.get('superficie_m2', 0) or 0),
                    'presupuesto_estimado': float(data.get('presupuesto_estimado', 0) or 0),
                    'nivel_urgencia': data.get('nivel_urgencia', 'media'),
                    'especificaciones_brief': data.get('especificaciones_brief', ''),
                    'activo': True
                }
            )
            data['cliente'] = str(cliente_obj.id)

        data['sucursal_ubicacion'] = ubicacion_completa

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()

        tipos_str = ", ".join(lead.tipos_proyecto) if lead.tipos_proyecto else "General"

        EventoAuditoria.objects.create(
            usuario=request.user,
            accion='creado',
            modulo='comercial',
            objeto_id=str(lead.id),
            objeto_repr=f"Brief Prospecto v1: {lead.nombre_proyecto or lead.cliente.nombre_comercial}",
            detalles={'cliente': lead.cliente.nombre_comercial, 'tipos_proyecto': lead.tipos_proyecto}
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # INCREMENTAR CONTROL DE VERSIONES v1 -> v2 -> v3
        vers_actual = getattr(instance, 'version', 1) or 1
        request.data['version'] = vers_actual + 1

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()

        # REGISTRAR EN BITÁCORA DE VERSIONES
        EventoAuditoria.objects.create(
            usuario=request.user,
            accion='modificado',
            modulo='comercial',
            objeto_id=str(lead.id),
            objeto_repr=f"Brief Prospecto Actualizado a v{lead.version}: {lead.cliente.nombre_comercial}",
            detalles={'editor': request.user.nombre_completo, 'version': lead.version}
        )

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def registrar_contacto(self, request, pk=None):
        lead = self.get_object()
        interaccion = InteraccionCliente.objects.create(
            lead=lead,
            cliente=lead.cliente,
            usuario=request.user,
            tipo=request.data.get('tipo', 'llamada'),
            resultado_notas=request.data.get('resultado_notas', ''),
            proximo_seguimiento=request.data.get('proximo_seguimiento')
        )
        return Response(InteraccionClienteSerializer(interaccion).data, status=status.HTTP_201_CREATED)


class CotizacionViewSet(viewsets.ModelViewSet):
    queryset = Cotizacion.objects.select_related('lead__cliente', 'lead__empresa').all()
    serializer_class = CotizacionSerializer
    permission_classes = [permissions.IsAuthenticated]


class ContratoViewSet(viewsets.ModelViewSet):
    queryset = Contrato.objects.select_related('cotizacion__lead__cliente').all()
    serializer_class = ContratoSerializer
    permission_classes = [permissions.IsAuthenticated]


class InteraccionClienteViewSet(viewsets.ModelViewSet):
    queryset = InteraccionCliente.objects.select_related('usuario', 'cliente', 'lead').all()
    serializer_class = InteraccionClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'cliente', 'usuario', 'tipo']
    ordering = ['-fecha_contacto']

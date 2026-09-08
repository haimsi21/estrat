from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from .models import (
    Cuadrilla, BitacoraObra, FotoAvance, ConsumoMaterial,
    EstimacionObra, InventarioMaterial, OrdenIntercompania
)
from .serializers import (
    CuadrillaSerializer, BitacoraObraSerializer, 
    FotoAvanceSerializer, ConsumoMaterialSerializer,
    EstimacionObraSerializer, InventarioMaterialSerializer,
    OrdenIntercompaniaSerializer
)
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar


class CuadrillaViewSet(viewsets.ModelViewSet):
    queryset = Cuadrilla.objects.select_related('proyecto').all()
    serializer_class = CuadrillaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['proyecto']
    ordering = ['nombre']


class BitacoraObraViewSet(viewsets.ModelViewSet):
    serializer_class = BitacoraObraSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'cuadrilla', 'fecha']
    search_fields = ['proyecto__nombre', 'incidencias', 'cuadrilla__nombre']
    ordering = ['-fecha']

    def get_queryset(self):
        return BitacoraObra.objects.select_related(
            'proyecto', 'cuadrilla', 'registrado_por'
        ).prefetch_related('fotos', 'consumos').all()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        fotos_input = data.pop('fotos', [])
        consumos_input = data.pop('consumos', [])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        bitacora = serializer.save(registrado_por=request.user)

        if isinstance(fotos_input, list):
            for foto in fotos_input:
                archivo_path = foto.get('archivo') or foto.get('imagen')
                if archivo_path:
                    FotoAvance.objects.create(bitacora=bitacora, imagen=archivo_path)

        if isinstance(consumos_input, list):
            for consumo in consumos_input:
                material = consumo.get('material', '').strip()
                cantidad = float(consumo.get('cantidad', 0) or 0)
                unidad = consumo.get('unidad', 'pza')
                if material and cantidad > 0:
                    ConsumoMaterial.objects.create(
                        bitacora=bitacora,
                        material=material,
                        cantidad=cantidad,
                        unidad=unidad
                    )
                    try:
                        item_inv = InventarioMaterial.objects.filter(material__iexact=material).first()
                        if item_inv:
                            item_inv.stock_actual = max(0, float(item_inv.stock_actual) - cantidad)
                            item_inv.save()
                    except Exception as e:
                        print(f"Error descuento inventario: {e}")

        if bitacora.proyecto and bitacora.porcentaje_avance:
            fases = bitacora.proyecto.fases.all()
            if fases.exists():
                fase_actual = fases.filter(completada=False).first()
                if fase_actual:
                    fase_actual.porcentaje_avance = bitacora.porcentaje_avance
                    if bitacora.porcentaje_avance >= 100:
                        fase_actual.completada = True
                    fase_actual.save()

        return Response(
            BitacoraObraSerializer(bitacora).data, 
            status=status.HTTP_201_CREATED
        )


class EstimacionObraViewSet(viewsets.ModelViewSet):
    serializer_class = EstimacionObraSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'estatus']
    search_fields = ['proyecto__nombre', 'notas']
    ordering = ['-numero_estimacion']

    def get_queryset(self):
        return EstimacionObra.objects.select_related('proyecto__cliente').all()

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def generar_factura(self, request, pk=None):
        estimacion = self.get_object()
        if estimacion.estatus == 'facturada':
            return Response({'error': 'La estimación ya ha sido facturada previamente.'}, status=status.HTTP_400_BAD_REQUEST)

        proyecto = estimacion.proyecto

        nueva_factura = Factura.objects.create(
            cliente=proyecto.cliente,
            fecha=timezone.now().date(),
            folio_fiscal=f"ESTIMACION-{estimacion.numero_estimacion}-{proyecto.nombre[:10]}",
            pagada=False
        )

        FacturaDetalle.objects.create(
            factura=nueva_factura,
            concepto=f"Estimación de Obra #{estimacion.numero_estimacion} — {proyecto.nombre} ({estimacion.porcentaje_ejecutado}% Avance)",
            monto=estimacion.monto_ejecutado,
            empresa=proyecto.empresa,
            modulo_origen="proyecto",
            proyecto=proyecto
        )

        CuentaPorCobrar.objects.create(
            factura=nueva_factura,
            fecha_vencimiento=timezone.now().date() + timezone.timedelta(days=30),
            saldo_pendiente=estimacion.monto_ejecutado
        )

        estimacion.estatus = 'facturada'
        estimacion.save()

        return Response({
            'success': True,
            'factura_id': str(nueva_factura.id),
            'mensaje': f'Factura de Estimación #{estimacion.numero_estimacion} generada exitosamente en Financiero.'
        }, status=status.HTTP_201_CREATED)


class InventarioMaterialViewSet(viewsets.ModelViewSet):
    queryset = InventarioMaterial.objects.select_related('empresa').all()
    serializer_class = InventarioMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa']
    search_fields = ['material', 'empresa__nombre']
    ordering = ['material']

    @action(detail=True, methods=['post'])
    def entrada_stock(self, request, pk=None):
        item = self.get_object()
        cantidad = float(request.data.get('cantidad', 0))
        if cantidad <= 0:
            return Response({'error': 'La cantidad debe ser mayor a 0'}, status=status.HTTP_400_BAD_REQUEST)

        item.stock_actual = float(item.stock_actual) + cantidad
        item.save()
        return Response(InventarioMaterialSerializer(item).data, status=status.HTTP_200_OK)


class OrdenIntercompaniaViewSet(viewsets.ModelViewSet):
    serializer_class = OrdenIntercompaniaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['proyecto', 'empresa_origen', 'empresa_destino', 'estatus']
    search_fields = ['concepto', 'proyecto__nombre']
    ordering = ['-fecha_solicitud']

    def get_queryset(self):
        return OrdenIntercompania.objects.select_related(
            'proyecto', 'empresa_origen', 'empresa_destino'
        ).all()


class FotoAvanceViewSet(viewsets.ModelViewSet):
    queryset = FotoAvance.objects.select_related('bitacora').all()
    serializer_class = FotoAvanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConsumoMaterialViewSet(viewsets.ModelViewSet):
    queryset = ConsumoMaterial.objects.select_related('bitacora').all()
    serializer_class = ConsumoMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

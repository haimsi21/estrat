from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from .models import Factura, FacturaDetalle, CuentaPorCobrar, FacturaProveedor
from .serializers import (
    FacturaSerializer, FacturaDetalleSerializer, 
    CuentaPorCobrarSerializer, FacturaProveedorSerializer
)
from apps.core.models import Cliente, Empresa
from apps.rrhh.models import Empleado


class FacturaViewSet(viewsets.ModelViewSet):
    serializer_class = FacturaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'pagada']
    search_fields = ['cliente__razon_social', 'cliente__nombre_comercial', 'folio_fiscal']
    ordering = ['-fecha']

    def get_queryset(self):
        return Factura.objects.select_related(
            'cliente'
        ).prefetch_related('detalles__empresa').all()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        nombre_prospecto = data.get('nombre_prospecto', '').strip()
        if not data.get('cliente') and nombre_prospecto:
            cliente_obj, _ = Cliente.objects.get_or_create(
                nombre_comercial=nombre_prospecto,
                defaults={'razon_social': nombre_prospecto, 'activo': True}
            )
            data['cliente'] = str(cliente_obj.id)

        detalles_input = data.pop('detalles', [])
        fecha_vencimiento = data.pop('fecha_vencimiento', None)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        factura = serializer.save()

        monto_total = 0
        if isinstance(detalles_input, list):
            for det in detalles_input:
                concepto = det.get('concepto', 'Servicios Consolidados del Holding')
                monto = float(det.get('monto') or 0)
                empresa_id = det.get('empresa')
                if monto > 0 and empresa_id:
                    monto_total += monto
                    FacturaDetalle.objects.create(
                        factura=factura,
                        concepto=concepto,
                        monto=monto,
                        empresa_id=empresa_id,
                        modulo_origen=det.get('modulo_origen', 'otro')
                    )

        if not factura.pagada and fecha_vencimiento and monto_total > 0:
            CuentaPorCobrar.objects.get_or_create(
                factura=factura,
                defaults={
                    'fecha_vencimiento': fecha_vencimiento,
                    'saldo_pendiente': monto_total
                }
            )

        return Response(FacturaSerializer(factura).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cambiar_estado_pago(self, request, pk=None):
        factura = self.get_object()
        pagada = request.data.get('pagada', not factura.pagada)
        factura.pagada = pagada
        factura.save()

        if pagada and hasattr(factura, 'cuenta_por_cobrar'):
            cxc = factura.cuenta_por_cobrar
            cxc.saldo_pendiente = 0
            cxc.save()

        return Response(FacturaSerializer(factura).data, status=status.OK)


class FacturaProveedorViewSet(viewsets.ModelViewSet):
    serializer_class = FacturaProveedorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'proyecto', 'pagada']
    search_fields = ['proveedor_nombre', 'concepto', 'empresa__nombre']
    ordering = ['-fecha_emision']

    def get_queryset(self):
        return FacturaProveedor.objects.select_related('empresa', 'proyecto').all()

    @action(detail=True, methods=['post'])
    def cambiar_estado_pago(self, request, pk=None):
        cxp = self.get_object()
        pagada = request.data.get('pagada', not cxp.pagada)
        cxp.pagada = pagada
        cxp.saldo_pendiente = 0 if pagada else cxp.monto
        cxp.save()
        return Response(FacturaProveedorSerializer(cxp).data, status=status.OK)


class FacturaDetalleViewSet(viewsets.ModelViewSet):
    queryset = FacturaDetalle.objects.select_related('factura', 'empresa').all()
    serializer_class = FacturaDetalleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['factura', 'empresa', 'modulo_origen']
    ordering = ['-id']


class CuentaPorCobrarViewSet(viewsets.ModelViewSet):
    serializer_class = CuentaPorCobrarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['factura']
    ordering = ['fecha_vencimiento']

    def get_queryset(self):
        return CuentaPorCobrar.objects.select_related(
            'factura__cliente'
        ).all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estado_resultados_consolidado(request):
    try:
        ingresos_totales = FacturaDetalle.objects.filter(
            factura__pagada=True
        ).aggregate(t=Sum('monto'))['t'] or 0.0

        ingresos_por_empresa = {}
        for emp in Empresa.objects.all():
            val = FacturaDetalle.objects.filter(
                empresa=emp, factura__pagada=True
            ).aggregate(t=Sum('monto'))['t'] or 0.0
            ingresos_por_empresa[emp.nombre] = float(val)

        egresos_proveedores = FacturaProveedor.objects.filter(
            pagada=True
        ).aggregate(t=Sum('monto'))['t'] or 0.0

        egresos_por_empresa = {}
        for emp in Empresa.objects.all():
            val = FacturaProveedor.objects.filter(
                empresa=emp, pagada=True
            ).aggregate(t=Sum('monto'))['t'] or 0.0
            egresos_por_empresa[emp.nombre] = float(val)

        nomina_mensual = Empleado.objects.filter(
            activo=True
        ).aggregate(t=Sum('salario'))['t'] or 0.0

        costo_total_operacion = float(egresos_proveedores) + float(nomina_mensual)
        utilidad_bruta = float(ingresos_totales) - float(egresos_proveedores)
        utilidad_neta = float(ingresos_totales) - costo_total_operacion
        margen_neto_pct = round((utilidad_neta / float(ingresos_totales)) * 100, 1) if ingresos_totales > 0 else 0.0

        return Response({
            'ingresos_totales': float(ingresos_totales),
            'ingresos_por_empresa': ingresos_por_empresa,
            'egresos_proveedores': float(egresos_proveedores),
            'egresos_por_empresa': egresos_por_empresa,
            'nomina_mensual_rh': float(nomina_mensual),
            'costo_total_operacion': costo_total_operacion,
            'utilidad_bruta': utilidad_bruta,
            'utilidad_neta': utilidad_neta,
            'margen_neto_pct': margen_neto_pct,
        })
    except Exception as e:
        print(f"Error P&L: {e}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def flujo_caja_proyectado(request):
    try:
        hoy = timezone.now().date()
        
        cxc_30 = CuentaPorCobrar.objects.filter(
            factura__pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=30)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        cxc_60 = CuentaPorCobrar.objects.filter(
            factura__pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=60)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        cxc_90 = CuentaPorCobrar.objects.filter(
            factura__pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=90)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        cxp_30 = FacturaProveedor.objects.filter(
            pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=30)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        cxp_60 = FacturaProveedor.objects.filter(
            pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=60)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        cxp_90 = FacturaProveedor.objects.filter(
            pagada=False,
            fecha_vencimiento__lte=hoy + timedelta(days=90)
        ).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0

        nomina_mensual = Empleado.objects.filter(activo=True).aggregate(t=Sum('salario'))['t'] or 0.0

        flujo_30 = float(cxc_30) - float(cxp_30) - float(nomina_mensual)
        flujo_60 = float(cxc_60) - float(cxp_60) - (float(nomina_mensual) * 2)
        flujo_90 = float(cxc_90) - float(cxp_90) - (float(nomina_mensual) * 3)

        return Response({
            'periodos': [
                {'dias': '30 Días', 'entradas_cxc': float(cxc_30), 'salidas_cxp': float(cxp_30), 'nomina': float(nomina_mensual), 'flujo_neto': flujo_30},
                {'dias': '60 Días', 'entradas_cxc': float(cxc_60), 'salidas_cxp': float(cxp_60), 'nomina': float(nomina_mensual)*2, 'flujo_neto': flujo_60},
                {'dias': '90 Días', 'entradas_cxc': float(cxc_90), 'salidas_cxp': float(cxp_90), 'nomina': float(nomina_mensual)*3, 'flujo_neto': flujo_90},
            ]
        })
    except Exception as e:
        print(f"Error Flujo Caja: {e}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_inversionistas(request):
    try:
        from apps.proyectos.models import Proyecto
        hoy = timezone.now().date()

        cxc_pendiente = CuentaPorCobrar.objects.filter(factura__pagada=False).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0
        cxp_pendiente = FacturaProveedor.objects.filter(pagada=False).aggregate(t=Sum('saldo_pendiente'))['t'] or 0.0
        capital_trabajo = float(cxc_pendiente) - float(cxp_pendiente)

        presupuesto_proyectos = Proyecto.objects.filter(activo=True).aggregate(t=Sum('presupuesto_total'))['t'] or 0.0
        ingresos_totales = FacturaDetalle.objects.filter(factura__pagada=True).aggregate(t=Sum('monto'))['t'] or 0.0
        egresos_totales = FacturaProveedor.objects.filter(pagada=True).aggregate(t=Sum('monto'))['t'] or 0.0
        nomina_mensual = Empleado.objects.filter(activo=True).aggregate(t=Sum('salario'))['t'] or 0.0

        utilidad_neta = float(ingresos_totales) - (float(egresos_totales) + float(nomina_mensual))
        roi_estimado = round((utilidad_neta / float(presupuesto_proyectos)) * 100, 1) if presupuesto_proyectos > 0 else 0.0

        return Response({
            'capital_trabajo': capital_trabajo,
            'cxc_pendiente': float(cxc_pendiente),
            'cxp_pendiente': float(cxp_pendiente),
            'presupuesto_portafolio': float(presupuesto_proyectos),
            'ingresos_liquidados': float(ingresos_totales),
            'egresos_operacion': float(egresos_totales) + float(nomina_mensual),
            'utilidad_neta_holding': utilidad_neta,
            'roi_estimado_pct': roi_estimado,
            'fecha_corte': hoy.strftime("%d/%m/%Y"),
        })
    except Exception as e:
        print(f"Error Reporte Inversionistas: {e}")
        return Response({'error': str(e)}, status=500)

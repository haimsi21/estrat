from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_resumen(request):
    data = {
        'proyectos_activos': 0, 
        'avance_promedio': 0.0, 
        'cxc_pendiente': 0.0,
        'alertas_criticas': 0, 
        'facturacion_total': 0.0, 
        'proyeccion_trimestre': 0.0, 
        'pedidos_produccion': 0, 
        'empleados_activos': 0,
        'leads_totales': 0,
        'leads_ganados': 0,
        'monto_cotizado': 0.0,
        'propuestas_arquitectura': 0,
        'bitacoras_obra': 0,
        'cuadrillas_activas': 0,
        'detalle_alertas': {'proyectos_vencidos': 0, 'leads_sin_atender': 0, 'facturas_vencidas': 0}
    }
    try:
        from apps.proyectos.models import Proyecto
        from apps.comercial.models import Lead, Cotizacion
        from apps.arquitectura.models import PropuestaDiseno
        from apps.obra.models import BitacoraObra, Cuadrilla
        from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar
        from apps.rrhh.models import Empleado
        from apps.produccion.models import Pedido

        hoy = timezone.now().date()
        
        # Proyectos
        data['proyectos_activos'] = Proyecto.objects.filter(activo=True).count()
        data['detalle_alertas']['proyectos_vencidos'] = Proyecto.objects.filter(activo=True, fecha_fin_estimada__lt=hoy).count()
        
        proyectos = Proyecto.objects.filter(activo=True).prefetch_related('fases')
        avances = []
        for p in proyectos:
            if p.fases.exists():
                avg = p.fases.aggregate(Avg('porcentaje_avance'))['porcentaje_avance__avg']
                if avg is not None:
                    avances.append(avg)
        if avances:
            data['avance_promedio'] = round(sum(avances) / len(avances), 1)

        # Financiero
        try:
            cxc = CuentaPorCobrar.objects.filter(factura__pagada=False).aggregate(Sum('saldo_pendiente'))['saldo_pendiente__sum']
            if cxc is not None:
                data['cxc_pendiente'] = float(cxc)
        except Exception:
            pass

        try:
            fact = FacturaDetalle.objects.filter(factura__pagada=True).aggregate(Sum('monto'))['monto__sum']
            if fact is not None:
                data['facturacion_total'] = float(fact)
        except Exception:
            pass

        try:
            fin_trimestre = hoy + timedelta(days=90)
            proy = Proyecto.objects.filter(
                activo=True,
                fecha_fin_estimada__isnull=False,
                fecha_fin_estimada__lte=fin_trimestre
            ).aggregate(Sum('presupuesto_total'))['presupuesto_total__sum']
            if proy is not None:
                data['proyeccion_trimestre'] = float(proy)
        except Exception:
            pass

        # Producción (Conteo exacto de pedidos activos en taller)
        try:
            data['pedidos_produccion'] = Pedido.objects.exclude(estatus='entregado').count()
        except Exception:
            pass

        # RH
        data['empleados_activos'] = Empleado.objects.filter(activo=True).count()

        # Comercial
        data['leads_totales'] = Lead.objects.count()
        data['leads_ganados'] = Lead.objects.filter(estatus='ganado').count()
        try:
            cot = Cotizacion.objects.aggregate(Sum('monto'))['monto__sum']
            if cot is not None:
                data['monto_cotizado'] = float(cot)
        except Exception:
            pass

        # Arquitectura & Obra
        data['propuestas_arquitectura'] = PropuestaDiseno.objects.count()
        data['bitacoras_obra'] = BitacoraObra.objects.count()
        data['cuadrillas_activas'] = Cuadrilla.objects.count()

        data['detalle_alertas']['leads_sin_atender'] = Lead.objects.filter(estatus='nuevo').count()
        data['detalle_alertas']['facturas_vencidas'] = CuentaPorCobrar.objects.filter(
            factura__pagada=False, 
            fecha_vencimiento__lt=hoy
        ).count()

        data['alertas_criticas'] = (
            data['detalle_alertas']['proyectos_vencidos'] + 
            data['detalle_alertas']['leads_sin_atender'] +
            data['detalle_alertas']['facturas_vencidas']
        )
    except Exception as e:
        print(f"ERROR DASHBOARD RESUMEN: {e}")

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_graficas(request):
    try:
        from apps.core.models import Empresa
        from apps.proyectos.models import Proyecto
        from apps.financiero.models import FacturaDetalle
        from apps.rrhh.models import Empleado
        from apps.produccion.models import Pedido

        hoy = timezone.now().date()

        ventas_por_empresa = []
        for emp in Empresa.objects.filter(activa=True):
            total = FacturaDetalle.objects.filter(
                empresa=emp, factura__pagada=True
            ).aggregate(t=Sum('monto'))['t'] or 0
            ventas_por_empresa.append({"empresa": emp.nombre, "total": float(total)})

        facturacion_mensual = []
        for i in range(5, -1, -1):
            mes_target = (hoy.replace(day=1) - timedelta(days=i*28)).replace(day=1)
            total = FacturaDetalle.objects.filter(
                factura__pagada=True,
                factura__fecha__year=mes_target.year,
                factura__fecha__month=mes_target.month,
            ).aggregate(t=Sum('monto'))['t'] or 0
            facturacion_mensual.append({
                "mes": mes_target.strftime("%b %Y"),
                "total": float(total),
            })

        avance_proyectos = []
        for p in Proyecto.objects.filter(activo=True).prefetch_related('fases')[:5]:
            avg = p.fases.aggregate(a=Avg('porcentaje_avance'))['a'] or 0
            avance_proyectos.append({
                "nombre": p.nombre[:30],
                "avance": round(float(avg), 1),
            })

        empleados_por_empresa = [
            {"empresa": e.nombre, "total": Empleado.objects.filter(empresa=e, activo=True).count()}
            for e in Empresa.objects.filter(activa=True)
        ]

        pedidos_por_estatus = []
        for item in Pedido.objects.values('estatus').annotate(total=Count('id')):
            pedidos_por_estatus.append({
                "estatus": item['estatus'],
                "total": item['total'],
            })

        return Response({
            "ventas_por_empresa": ventas_por_empresa,
            "facturacion_mensual": facturacion_mensual,
            "avance_proyectos": avance_proyectos,
            "empleados_por_empresa": empleados_por_empresa,
            "pedidos_por_estatus": pedidos_por_estatus,
        })
    except Exception as e:
        print(f"ERROR DASHBOARD GRAFICAS: {e}")
        return Response({
            "ventas_por_empresa": [],
            "facturacion_mensual": [],
            "avance_proyectos": [],
            "empleados_por_empresa": [],
            "pedidos_por_estatus": [],
        })

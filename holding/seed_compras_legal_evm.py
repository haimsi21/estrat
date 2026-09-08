import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Empresa, Cliente, OrdenCompra, ExpedienteLegal, TicketPosventa

print("\n🛠️ POBLANDO COMPRAS, LEGAL Y POSVENTA...")

empresas = list(Empresa.objects.all())
clientes = list(Cliente.objects.all())

if empresas and clientes:
    emp = empresas[0]
    cli = clientes[0]
    hoy = timezone.now().date()

    OrdenCompra.objects.get_or_create(
        folio="OC-2026-001",
        defaults={
            'proveedor_nombre': 'Aceros & Perfiles de México',
            'empresa': emp,
            'proyecto_nombre': 'Residencial Lomas',
            'concepto': 'Suministro de 25 toneladas de varilla 3/8 y perfiles IPR',
            'monto_total': 480000.00,
            'estatus': 'ordenada',
            'fecha_entrega_esperada': hoy + timedelta(days=10)
        }
    )

    ExpedienteLegal.objects.get_or_create(
        titulo="Contrato Marco de Obra e Instalaciones Lomas",
        defaults={
            'tipo': 'contrato_cliente',
            'cliente': cli,
            'empresa': emp,
            'monto_contrato': 35000000.00,
            'estatus': 'firmado',
            'abogado_responsable': 'Lic. Fernando Gutiérrez',
            'fecha_firma': hoy - timedelta(days=60),
            'fecha_vencimiento': hoy + timedelta(days=300),
            'clausulas_clave': 'Fianza de anticipo 20%, pena convencional 0.1% diario por retraso.'
        }
    )

    TicketPosventa.objects.get_or_create(
        folio="POS-2026-089",
        defaults={
            'cliente': cli,
            'empresa_responsable': emp,
            'proyecto_nombre': 'Residencial Lomas',
            'tipo_falla': 'impermeabilizacion',
            'descripcion_falla': 'Humedad en muro norte de cocina post-lluvia.',
            'costo_reparacion': 12500.00,
            'estatus': 'en_atencion',
            'fecha_solucion_estimada': hoy + timedelta(days=5)
        }
    )

    print("✅ ¡Compras, Legal y Posventa cargados exitosamente!")

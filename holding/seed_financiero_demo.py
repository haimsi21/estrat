import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Cliente, Empresa
from apps.proyectos.models import Proyecto
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar

print("\n🛠️ GENERANDO FACTURAS Y DESGLOSES DE PRUEBA...")

clientes = list(Cliente.objects.all())
empresas = list(Empresa.objects.all())
proyectos = list(Proyecto.objects.all())

if not clientes or not empresas:
    print("❌ Primero ejecuta setup_director.py")
else:
    for i in range(3):
        cliente = random.choice(clientes)
        factura = Factura.objects.create(
            cliente=cliente,
            fecha=timezone.now().date() - timedelta(days=i * 10),
            folio_fiscal=f"FACT-2026-CFDI-{random.randint(1000, 9999)}",
            pagada=(i == 0) # La primera pagada, las otras dos pendientes
        )

        monto_desarrollo = 250000.00
        monto_arquitectura = 75000.00
        monto_produccion = 120000.00

        emp_des = next((e for e in empresas if "Desarrollo" in e.nombre), empresas[0])
        emp_arq = next((e for e in empresas if "Arquitectura" in e.nombre), empresas[0])
        emp_pro = next((e for e in empresas if "Producción" in e.nombre), empresas[0])

        FacturaDetalle.objects.create(
            factura=factura,
            concepto="Administración & Gerencia de Proyecto",
            monto=monto_desarrollo,
            empresa=emp_des,
            modulo_origen="proyecto"
        )
        FacturaDetalle.objects.create(
            factura=factura,
            concepto="Anteproyecto & Renders 3D LiDAR",
            monto=monto_arquitectura,
            empresa=emp_arq,
            modulo_origen="arquitectura"
        )
        FacturaDetalle.objects.create(
            factura=factura,
            concepto="Suministro de Mobiliario a Medida",
            monto=monto_produccion,
            empresa=emp_pro,
            modulo_origen="produccion"
        )

        if not factura.pagada:
            CuentaPorCobrar.objects.create(
                factura=factura,
                fecha_vencimiento=timezone.now().date() + timedelta(days=15),
                saldo_pendiente=(monto_desarrollo + monto_arquitectura + monto_produccion)
            )

    print("✅ ¡3 Facturas consolidadas con desglose por las 3 empresas del Holding generadas!\n")

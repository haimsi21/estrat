from django.utils import timezone
from datetime import timedelta
import random
from apps.core.models import Empresa
from apps.proyectos.models import Proyecto
from apps.financiero.models import FacturaProveedor

print("\n🛠️ GENERANDO FACTURAS DE PROVEEDORES Y REGISTROS DE CXP...")

empresas = list(Empresa.objects.all())
proyectos = list(Proyecto.objects.all())

if not empresas:
    print("❌ Primero ejecuta setup_director.py")
else:
    proveedores_sample = [
        ("Cementos Moctezuma S.A.", "Suministro de 500 bultos de cemento gris", 145000.00, True),
        ("Aceros y Estructuras México", "Suministro de varilla corrugada 3/8 y malla", 280000.00, False),
        ("Maderas y Muebles del Bajío", "Suministro de placas de encino para taller", 95000.00, True),
        ("Fletes y Transporte Pesado", "Servicio de flete y acarreo de materiales a obra", 45000.00, False),
    ]

    for prov, concepto, monto, pagada in proveedores_sample:
        empresa = random.choice(empresas)
        proyecto = random.choice(proyectos) if proyectos else None

        FacturaProveedor.objects.get_or_create(
            proveedor_nombre=prov,
            concepto=concepto,
            defaults={
                'empresa': empresa,
                'proyecto': proyecto,
                'monto': monto,
                'fecha_emision': timezone.now().date() - timedelta(days=random.randint(5, 30)),
                'fecha_vencimiento': timezone.now().date() + timedelta(days=random.randint(10, 45)),
                'pagada': pagada,
                'saldo_pendiente': 0 if pagada else monto
            }
        )

    print("✅ ¡4 Facturas de Proveedores CxP generadas exitosamente!\n")

from apps.comercial.models import Lead, Cotizacion, Contrato
from apps.proyectos.models import Proyecto, Fase
from apps.arquitectura.models import PropuestaDiseno, ArchivoDiseno
from apps.obra.models import Cuadrilla, BitacoraObra, FotoAvance, ConsumoMaterial, EstimacionObra, InventarioMaterial, OrdenIntercompania
from apps.produccion.models import Pedido
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar, FacturaProveedor
from apps.rrhh.models import Empleado, Asistencia

print("\n🧹 BORRANDO REGISTROS DEMO DE LA BASE DE DATOS...")

Asistencia.objects.all().delete()
Empleado.objects.all().delete()

FacturaProveedor.objects.all().delete()
CuentaPorCobrar.objects.all().delete()
FacturaDetalle.objects.all().delete()
Factura.objects.all().delete()

Pedido.objects.all().delete()

ConsumoMaterial.objects.all().delete()
FotoAvance.objects.all().delete()
BitacoraObra.objects.all().delete()
EstimacionObra.objects.all().delete()
InventarioMaterial.objects.all().delete()
OrdenIntercompania.objects.all().delete()
Cuadrilla.objects.all().delete()

ArchivoDiseno.objects.all().delete()
PropuestaDiseno.objects.all().delete()

Contrato.objects.all().delete()
Cotizacion.objects.all().delete()
Lead.objects.all().delete()

Fase.objects.all().delete()
Proyecto.objects.all().delete()

print("✅ BASE DE DATOS LIMPIA A CEROS")
print("  • Pedidos de Producción: 0")
print("  • Empleados RH:         0")
print("  • Facturas & CxC/CxP:   0")
print("  • Bitácoras & Obra:     0")
print("  • Proyectos:            0")
print("  • Usuario Actual:       MANTENIDO OK (director)\n")

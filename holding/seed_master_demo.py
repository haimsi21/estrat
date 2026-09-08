import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Empresa, Cliente
from apps.proyectos.models import Proyecto, Fase
from apps.comercial.models import Lead, Cotizacion
from apps.arquitectura.models import PropuestaDiseno, ArchivoDiseno
from apps.obra.models import Cuadrilla, BitacoraObra, ConsumoMaterial
from apps.produccion.models import Pedido
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar, FacturaProveedor
from apps.rrhh.models import Empleado, Asistencia

print("\n🚀 POBLANDO BASE DE DATOS COMPLETA PARA DEMOSTRACIÓN A RO...")

empresas = list(Empresa.objects.all())
if not empresas:
    print("❌ Ejecutando setup_director.py primero...")
    emp1, _ = Empresa.objects.get_or_create(nombre="Desarrollo", defaults={"activa": True})
    emp2, _ = Empresa.objects.get_or_create(nombre="Arquitectura", defaults={"activa": True})
    emp3, _ = Empresa.objects.get_or_create(nombre="Producción", defaults={"activa": True})
    empresas = [emp1, emp2, emp3]

emp_des = next((e for e in empresas if "Desarrollo" in e.nombre), empresas[0])
emp_arq = next((e for e in empresas if "Arquitectura" in e.nombre), empresas[0])
emp_pro = next((e for e in empresas if "Producción" in e.nombre), empresas[0])

# 1. Clientes
c1, _ = Cliente.objects.get_or_create(nombre_comercial="Inmobiliaria Lomas", defaults={"razon_social": "Inmobiliaria Lomas S.A. de C.V.", "activo": True})
c2, _ = Cliente.objects.get_or_create(nombre_comercial="Residencial Valle", defaults={"razon_social": "Residencial Valle S.A. de C.V.", "activo": True})

# 2. RH - Plantilla
plantilla = [
    ("Ing. Miguel Hernández Morales", "Ingeniero Residente de Obra", emp_des, 35000.00),
    ("Arq. Sofia Martinez Flores", "Arquitecto Senior / Líder 3D", emp_arq, 38000.00),
    ("Maestro Carlos Perez", "Maestro Carpintero / Jefe Taller", emp_pro, 28000.00),
    ("Lic. Roberto Gomez", "Coordinador de Compras & Costos", emp_des, 32000.00),
    ("Diana Torres Lopez", "Diseñadora de Interiores Junior", emp_arq, 22000.00),
]

for nom, puesto, emp_obj, salario in plantilla:
    e, _ = Empleado.objects.get_or_create(
        nombre_completo=nom,
        defaults={"puesto": puesto, "empresa": emp_obj, "salario": salario, "fecha_contrato": timezone.now().date() - timedelta(days=200), "activo": True}
    )
    Asistencia.objects.get_or_create(empleado=e, fecha=timezone.now().date(), defaults={"hora_entrada": "08:00:00"})

# 3. Producción
pedidos_sample = [
    ("Cocina Integral de Nogal con Isla Granito", "Cubierta granito San Gabriel 2cm, herrajes soft-close Blum.", "taller", 15),
    ("Clósets Vestidores de Encino (8 Habitaciones)", "Madera sólida, acabado mate, iluminación LED.", "diseno", 30),
    ("Muebles de Baño con Doble Tarja Mármol", "Madera tratada para humedad, espejos flotados.", "taller", 8),
]

for tipo, espec, estatus, dias in pedidos_sample:
    Pedido.objects.get_or_create(
        tipo_objeto=tipo,
        defaults={"cliente": c1, "especificaciones": espec, "estatus": estatus, "fecha_entrega": timezone.now().date() + timedelta(days=dias)}
    )

print("✅ ¡BASE DE DATOS POBLADA AL 100% PARA RO!\n")

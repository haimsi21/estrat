import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Empresa
from apps.obra.models import Cuadrilla
from apps.rrhh.models import Empleado, Asistencia

print("\n🛠️ GENERANDO PLANTILLA DE RECURSOS HUMANOS DEL HOLDING...")

empresas = list(Empresa.objects.all())
cuadrillas = list(Cuadrilla.objects.all())

if not empresas:
    print("❌ Primero ejecuta setup_director.py")
else:
    plantilla_sample = [
        ("Ing. Miguel Hernández Morales", "Ingeniero Residente de Obra", "Desarrollo", 35000.00),
        ("Arq. Sofia Martinez Flores", "Arquitecto Senior / Líder 3D", "Arquitectura", 38000.00),
        ("Maestro Carlos Perez", "Maestro Carpintero / Jefe de Taller", "Producción", 28000.00),
        ("Lic. Roberto Gomez", "Coordinador de Compras & Costos", "Desarrollo", 32000.00),
        ("Diana Torres Lopez", "Diseñadora de Interiores Junior", "Arquitectura", 22000.00),
        ("Juan Ramirez Garcia", "Operador de Maquinaria Taller", "Producción", 18000.00),
    ]

    for nombre, puesto, emp_nombre, salario in plantilla_sample:
        emp_obj = next((e for e in empresas if emp_nombre in e.nombre), empresas[0])
        cuadrilla_obj = random.choice(cuadrillas) if cuadrillas and "Desarrollo" in emp_nombre else None

        emp, created = Empleado.objects.get_or_create(
            nombre_completo=nombre,
            defaults={
                'puesto': puesto,
                'empresa': emp_obj,
                'salario': salario,
                'fecha_contrato': timezone.now().date() - timedelta(days=random.randint(100, 800)),
                'activo': True,
                'cuadrilla': cuadrilla_obj
            }
        )

        # Crear marcaje de asistencia de hoy
        Asistencia.objects.get_or_create(
            empleado=emp,
            fecha=timezone.now().date(),
            defaults={
                'hora_entrada': "08:00:00"
            }
        )

    print("✅ ¡Plantilla Fija de RH y Asistencias de hoy generadas exitosamente!\n")

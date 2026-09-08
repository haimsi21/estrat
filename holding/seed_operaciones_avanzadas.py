import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Empresa
from apps.proyectos.models import Proyecto
from apps.obra.models import EstimacionObra, InventarioMaterial, OrdenIntercompania

print("\n🛠️ GENERANDO OPERACIONES AVANZADAS (ESTIMACIONES, ALMACÉN E INTERCOMPAÑÍA)...")

empresas = list(Empresa.objects.all())
proyectos = list(Proyecto.objects.all())

if not empresas or not proyectos:
    print("❌ Asegúrate de haber ejecutado setup_director.py")
else:
    # 1. Inventario Almacén Kardex
    emp_des = next((e for e in empresas if "Desarrollo" in e.nombre), empresas[0])
    materials_kardex = [
        ("Cemento Gris Moctezuma", "bulto", 450.0, 50.0, 220.0),
        ("Varilla Corrugada 3/8", "pza", 1200.0, 100.0, 180.0),
        ("Block de Concreto 15x20x40", "pza", 15.0, 200.0, 18.0), # Bajo stock intencional
        ("Arena de Mina", "m3", 40.0, 10.0, 350.0),
        ("Grava Malla 3/4", "m3", 25.0, 10.0, 400.0),
    ]

    for mat, un, st_act, st_min, precio in materials_kardex:
        InventarioMaterial.objects.get_or_create(
            material=mat,
            defaults={
                'unidad': un,
                'empresa': emp_des,
                'stock_actual': st_act,
                'stock_minimo': st_min,
                'precio_unitario_promedio': precio
            }
        )

    # 2. Estimación de Obra
    p = proyectos[0]
    EstimacionObra.objects.get_or_create(
        proyecto=p,
        numero_estimacion=1,
        defaults={
            'fecha_presentacion': timezone.now().date() - timedelta(days=5),
            'porcentaje_ejecutado': 15.5,
            'monto_ejecutado': 385000.00,
            'estatus': 'presentada',
            'notas': 'Estimación de avance #1 correspondiente a excavación y colado de losa cimentación.'
        }
    )

    # 3. Orden Intercompañía
    emp_arq = next((e for e in empresas if "Arquitectura" in e.nombre), empresas[0])
    OrdenIntercompania.objects.get_or_create(
        proyecto=p,
        empresa_origen=emp_des,
        empresa_destino=emp_arq,
        concepto="Elaboración de Anteproyecto Ejecutivo y Modelos 3D LiDAR",
        defaults={
            'monto_interno': 120000.00,
            'estatus': 'en_proceso',
            'fecha_entrega_estimada': timezone.now().date() + timedelta(days=20)
        }
    )

    print("✅ ¡Estimaciones, Inventario Kardex y Órdenes Intercompañía generadas!\n")

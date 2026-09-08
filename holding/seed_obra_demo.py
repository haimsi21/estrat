import random
from django.utils import timezone
from datetime import timedelta
from apps.proyectos.models import Proyecto
from apps.obra.models import Cuadrilla, BitacoraObra, ConsumoMaterial

print("\n🛠️ GENERANDO DATOS DE DEMO PARA EL MÓDULO DE OBRA...")

proyectos = list(Proyecto.objects.all())
if not proyectos:
    print("❌ No hay proyectos activos.")
else:
    materiales_sample = [
        ("Cemento Gris Moctezuma", "bulto", 50),
        ("Varilla Corrugada 3/8", "pza", 120),
        ("Block de Concreto 15x20x40", "pza", 450),
        ("Arena de Mina", "m3", 12),
        ("Grava de Malla", "m3", 8),
        ("Alambre Recocido No. 16", "kg", 25),
    ]

    for p in proyectos[:3]:
        cuadrilla, _ = Cuadrilla.objects.get_or_create(
            nombre=f"Cuadrilla Alpha — {p.nombre[:20]}",
            proyecto=p
        )

        for i in range(2):
            fecha_b = timezone.now().date() - timedelta(days=i * 3)
            bitacora = BitacoraObra.objects.create(
                proyecto=p,
                fecha=fecha_b,
                porcentaje_avance=random.randint(25, 75),
                cuadrilla=cuadrilla,
                incidencias="Avance en colado de losa y armados. Sin retrasos por clima. Calidad inspeccionada."
            )

            for mat, unidad, cant in materiales_sample[:3]:
                ConsumoMaterial.objects.create(
                    bitacora=bitacora,
                    material=mat,
                    cantidad=cant,
                    unidad=unidad
                )

    print("✅ ¡3 Cuadrillas y Bitácoras de Obra con consumos generadas con éxito!\n")

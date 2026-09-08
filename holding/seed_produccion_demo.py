from django.utils import timezone
from datetime import timedelta
import random
from apps.core.models import Cliente
from apps.proyectos.models import Proyecto
from apps.produccion.models import Pedido

print("\n🛠️ GENERANDO PEDIDOS DEMO PARA PRODUCCIÓN & TALLER...")

clientes = list(Cliente.objects.all())
proyectos = list(Proyecto.objects.all())

if not clientes:
    print("❌ Primero crea clientes o ejecuta setup_director.py")
else:
    pedidos_sample = [
        ("Cocina Integral de Nogal con Isla de Granito", "Cubierta granito San Gabriel 2cm, gabinetes nogal mate, cajones soft-close Blum.", "taller", 20),
        ("Clósets Vestidores a Medida (8 habitaciones)", "Madera de encino, acabado natural, iluminación LED integrada en rieles.", "diseno", 35),
        ("Muebles de Baño con Doble Tarja Mármol", "Madera tratada para humedad, tarja mármol de Carrara, espejos flotados.", "taller", 10),
        ("Escalera Helicoidal de Acero y Escalones de Roble", "Estructura acero IPR, escalones roble 1.5 pulgadas, pasamanos tubular.", "entrega", 5),
    ]

    for tipo, espec, estatus, dias_entrega in pedidos_sample:
        cliente = random.choice(clientes)
        proyecto = random.choice(proyectos) if proyectos else None
        
        Pedido.objects.create(
            cliente=cliente,
            proyecto=proyecto,
            tipo_objeto=tipo,
            especificaciones=espec,
            fecha_entrega=timezone.now().date() + timedelta(days=dias_entrega),
            estatus=estatus
        )

    print("✅ ¡4 Pedidos de Producción generados exitosamente!\n")

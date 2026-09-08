from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contrato

@receiver(post_save, sender=Contrato)
def crear_proyecto_desde_contrato(sender, instance, created, **kwargs):
    if instance.proyectos.exists():
        return  # Ya existe un proyecto, evitar duplicados

    cotizacion = instance.cotizacion
    lead = cotizacion.lead
    
    from apps.proyectos.models import Proyecto
    Proyecto.objects.create(
        nombre=f"Proyecto — {lead.cliente} ({cotizacion.concepto})",
        cliente=lead.cliente,
        empresa=lead.empresa,
        contrato=instance,
        presupuesto_total=cotizacion.monto,
        fecha_inicio=instance.fecha_firma,
        fecha_fin_estimada=cotizacion.vigencia,
        responsable=lead.responsable,
        activo=True,
    )

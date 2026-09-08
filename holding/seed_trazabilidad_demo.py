import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Usuario, EventoAuditoria, DocumentoAutorizacion

print("\n🛠️ POBLANDO AUDITORÍA, BANDERAS DE REVISIÓN Y SLA DE COLABORADORES...")

director = Usuario.objects.filter(username='director').first()
comercial = Usuario.objects.filter(username='comercial').first()

if director and comercial:
    hoy = timezone.now()

    doc1, _ = DocumentoAutorizacion.objects.get_or_create(
        titulo="Plano Ejecutivo de Estructura Lomas v2",
        defaults={
            'tipo': 'plano',
            'version': 2,
            'proyecto_nombre': 'Residencial Lomas',
            'solicitante': comercial,
            'responsable_aprobacion': director,
            'estatus': 'visto',
            'visto_en': hoy - timedelta(hours=3),
            'sla_horas': 24,
            'notas': 'Revisión urgente de losas.'
        }
    )

    EventoAuditoria.objects.get_or_create(
        objeto_id=str(doc1.id),
        accion='creado',
        defaults={
            'usuario': comercial,
            'modulo': 'autorizaciones',
            'objeto_repr': f"{doc1.titulo} v{doc1.version}",
            'detalles': {'nota': 'Solicitud enviada a Dirección'}
        }
    )

    EventoAuditoria.objects.get_or_create(
        objeto_id=str(doc1.id),
        accion='visto',
        defaults={
            'usuario': director,
            'modulo': 'autorizaciones',
            'objeto_repr': f"{doc1.titulo} v{doc1.version}",
            'detalles': {'acuse': 'Visualizado en iPad'}
        }
    )

    print("✅ ¡Eventos de auditoría y acuses de recibo sembrados!")

import uuid
from django.db import models
from apps.core.models import Empresa, Cliente, Usuario


class Lead(models.Model):
    ESTATUS_COMERCIAL = [
        ("solicitud_inicial", "Solicitud Inicial"),
        ("requiere_propuesta", "Requiere Propuesta"),
        ("requiere_presupuesto", "Requiere Presupuesto"),
        ("en_negociacion", "En Negociación"),
        ("autorizado", "Autorizado para Desarrollar"),
        ("ganado", "Proyecto Vendido / Ganado"),
        ("perdido", "Perdido"),
    ]
    ORIGEN = [
        ("referido", "Referido / Recomendación"),
        ("web", "Sitio Web / Landing Page"),
        ("redes", "Redes Sociales (LinkedIn/IG/FB)"),
        ("evento", "Evento / Exposición / Feria"),
        ("directo", "Contacto Directo / Inbound"),
        ("email", "Mailing / Campaña Email"),
        ("licitacion", "Licitación / RFP"),
        ("otro", "Otro"),
    ]
    PRESUPUESTO_INDICADO = [("si", "Sí"), ("no", "No"), ("pendiente", "Aún no se ha preguntado")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="leads")
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="leads")
    origen = models.CharField(max_length=30, choices=ORIGEN, default="web")
    estatus = models.CharField(max_length=30, choices=ESTATUS_COMERCIAL, default="solicitud_inicial", db_index=True)
    responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="leads")

    # 1. DATOS BÁSICOS
    nombre_proyecto = models.CharField(max_length=200, blank=True)
    sucursal_ubicacion = models.CharField(max_length=250, blank=True)

    # 2. TIPO DE PROYECTO
    tipos_proyecto = models.JSONField(default=list, blank=True)

    # 3. ¿QUÉ NECESITA EL CLIENTE?
    necesidad_cliente = models.TextField(blank=True)

    # 4. ¿QUÉ ESPERA QUE LE ENTREGUEMOS?
    entregables_esperados = models.JSONField(default=list, blank=True)

    # 5. BÓVEDA DOCUMENTAL IN-HOUSE
    informacion_existente = models.JSONField(default=list, blank=True)
    archivos_adjuntos = models.JSONField(default=list, blank=True)

    # 6. PRESUPUESTO
    presupuesto_indicado = models.CharField(max_length=20, choices=PRESUPUESTO_INDICADO, default="pendiente")
    monto_presupuesto = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)

    # 7. FECHAS
    fecha_cotizacion_requerida = models.DateField(null=True, blank=True)
    fecha_inicio_solicitado = models.DateField(null=True, blank=True)
    fecha_entrega_requerida = models.DateField(null=True, blank=True)
    fecha_inamovible = models.BooleanField(default=False)

    # 9. OBSERVACIONES IMPORTANTES
    observaciones_importantes = models.TextField(blank=True)

    # 10. SIGUIENTE ACCIÓN (GOBERNANZA COMPLETA DE TRANSFERENCIA)
    siguiente_accion_area = models.CharField(max_length=50, default="Diseño / Arquitectura")
    siguiente_accion_concreta = models.TextField(blank=True)
    siguiente_accion_responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads_siguiente_accion")
    siguiente_accion_fecha_compromiso = models.DateField(null=True, blank=True)

    notas = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.nombre_proyecto or self.cliente.nombre_comercial} — {self.get_estatus_display()}"


class Cotizacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="cotizaciones")
    concepto = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    vigencia = models.DateField()
    archivo = models.FileField(upload_to="cotizaciones/", blank=True, null=True)
    aprobada = models.BooleanField(default=False, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cotización {self.concepto} — {self.lead.cliente}"


class Contrato(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cotizacion = models.OneToOneField(Cotizacion, on_delete=models.CASCADE, related_name="contrato")
    fecha_firma = models.DateField()
    archivo = models.FileField(upload_to="contratos/", blank=True, null=True)

    def __str__(self):
        return f"Contrato {self.id} — {self.cotizacion.lead.cliente}"


class InteraccionCliente(models.Model):
    TIPO_CHOICES = [
        ('llamada', 'Llamada Telefónica'),
        ('whatsapp', 'Mensaje de WhatsApp'),
        ('correo', 'Correo Electrónico'),
        ('reunion', 'Reunión / Visita Presencial'),
        ('sistema', 'Evento del Sistema'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interacciones', null=True, blank=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='interacciones', null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='interacciones_comerciales')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='llamada')
    resultado_notas = models.TextField()
    proximo_seguimiento = models.DateField(null=True, blank=True)
    fecha_contacto = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-fecha_contacto']

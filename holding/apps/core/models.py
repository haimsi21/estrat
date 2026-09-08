import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager


class ActivoManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(activo=True)


class UsuarioActivoManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class TodosManager(UserManager):
    pass


class Empresa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    razon_social = models.CharField(max_length=200, blank=True)
    rfc = models.CharField(max_length=13, blank=True, db_index=True)
    activa = models.BooleanField(default=True, db_index=True)

    objects = TodosManager()
    activos = ActivoManager()

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class CapaAcceso(models.TextChoices):
    DIRECCION = "direccion", "Nivel 1: Dirección General (C-Suite)"
    JEFE_AREA = "jefe_area", "Nivel 2: Director / Gerente de Área"
    COORDINADOR = "coordinador", "Nivel 3: Coordinador / Residente de Obra"
    OPERATIVO = "operativo", "Nivel 4: Ejecutivo Operativo (Captura)"
    CLIENTE_EXTERNAL = "cliente_external", "Nivel 5: Portal del Cliente (Vista Exclusiva)"


class Rol(models.Model):
    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.CharField(max_length=255, blank=True)
    capa = models.CharField(
        max_length=25, choices=CapaAcceso.choices, default=CapaAcceso.OPERATIVO,
        help_text="Capa de acceso de seguridad"
    )

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["capa", "nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.get_capa_display()})"


class Cliente(models.Model):
    TIPO_PROPIEDAD_CHOICES = [
        ('residencial', 'Residencial / Habitación'),
        ('comercial', 'Comercial / Retail'),
        ('industrial', 'Industrial / Nave'),
        ('corporativo', 'Corporativo / Oficinas'),
        ('hotelero', 'Turístico / Hotelero'),
    ]
    URGENCIA_CHOICES = [
        ('alta', 'Alta (Inmediata)'),
        ('media', 'Media (1 - 3 Meses)'),
        ('baja', 'Baja (Planeación)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    razon_social = models.CharField(max_length=200, db_index=True)
    nombre_comercial = models.CharField(max_length=200, blank=True, db_index=True)
    rfc = models.CharField(max_length=13, blank=True, db_index=True)
    contacto_nombre = models.CharField(max_length=150, blank=True)
    contacto_telefono = models.CharField(max_length=20, blank=True)
    contacto_email = models.EmailField(blank=True)
    
    # GEOGRAFÍA Y BRIEF TÉCNICO CON CP
    codigo_postal = models.CharField(max_length=10, blank=True)
    estado_republica = models.CharField(max_length=100, default='CDMX')
    ciudad_municipio = models.CharField(max_length=150, blank=True)
    ubicacion = models.CharField(max_length=250, blank=True)
    
    tipo_propiedad = models.CharField(max_length=30, choices=TIPO_PROPIEDAD_CHOICES, default='residencial')
    superficie_m2 = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    presupuesto_estimado = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    fecha_deseada_entrega = models.DateField(null=True, blank=True)
    nivel_urgencia = models.CharField(max_length=20, choices=URGENCIA_CHOICES, default='media')
    especificaciones_brief = models.TextField(blank=True)

    activo = models.BooleanField(default=True, db_index=True)
    empresas_relacionadas = models.ManyToManyField(Empresa, blank=True, related_name="clientes")
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    objects = TodosManager()
    activos = ActivoManager()

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["razon_social"]

    def __str__(self):
        return self.nombre_comercial or self.razon_social


class Usuario(AbstractUser):
    DEPARTAMENTO_CHOICES = [
        ('comercial', 'Ventas & CRM'),
        ('arquitectura', 'Arquitectura & 3D'),
        ('obra', 'Obra & Operaciones'),
        ('produccion', 'Producción & Taller'),
        ('financiero', 'Finanzas & Tesorería'),
        ('compras', 'Compras & Procurement'),
        ('legal', 'Legal & Licencias'),
        ('rrhh', 'Recursos Humanos'),
        ('direccion', 'Dirección General'),
        ('cliente', 'Portal de Cliente'),
    ]

    empresas = models.ManyToManyField(Empresa, blank=True, related_name="usuarios")
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True, related_name="usuarios")
    puesto = models.CharField(max_length=100, blank=True)
    departamento = models.CharField(max_length=30, choices=DEPARTAMENTO_CHOICES, default='comercial')
    reporta_a = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinados')
    
    # VÍNCULO PARA NIVEL 5: PORTAL DEL CLIENTE EXTERNO
    cliente_asociado = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios_portal')
    
    modulos_permitidos = models.JSONField(default=list, blank=True)
    monto_autorizacion_max = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)

    objects = TodosManager()
    activos = UsuarioActivoManager()

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def nombre_completo(self):
        return self.get_full_name() or self.username

    @property
    def capa_acceso(self):
        return self.rol.capa if self.rol else None


class EventoAuditoria(models.Model):
    ACCION_CHOICES = [
        ('creado', 'Creado'),
        ('visto', 'Acuse de Recibo (Visto)'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('requiere_cambios', 'Requiere Cambios / Retrabajo'),
        ('comentado', 'Comentado'),
        ('modificado', 'Modificado'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='eventos_auditoria')
    accion = models.CharField(max_length=30, choices=ACCION_CHOICES, db_index=True)
    modulo = models.CharField(max_length=50, db_index=True)
    objeto_id = models.CharField(max_length=100, db_index=True)
    objeto_repr = models.CharField(max_length=255)
    detalles = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']


class DocumentoAutorizacion(models.Model):
    ESTATUS_CHOICES = [
        ('pendiente', 'Pendiente de Lectura'),
        ('visto', 'Visto (Acuse Registrado)'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('requiere_cambios', 'Requiere Cambios (Retrabajo)'),
    ]
    TIPO_CHOICES = [
        ('plano', 'Plano / Diseño Arquitectónico'),
        ('orden_compra', 'Orden de Compra / CxP'),
        ('estimacion', 'Estimación de Obra'),
        ('cotizacion', 'Cotización Comercial'),
        ('contrato', 'Contrato / Convenio Legal'),
        ('otro', 'Solicitud Operativa'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, default='plano')
    version = models.PositiveIntegerField(default=1)
    proyecto_nombre = models.CharField(max_length=200, blank=True)
    solicitante = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='solicitudes_autorizacion')
    responsable_aprobacion = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='autorizaciones_pendientes')
    estatus = models.CharField(max_length=25, choices=ESTATUS_CHOICES, default='pendiente', db_index=True)
    archivo_url = models.CharField(max_length=500, blank=True)
    notas = models.TextField(blank=True)
    visto_en = models.DateTimeField(null=True, blank=True)
    respondido_en = models.DateTimeField(null=True, blank=True)
    sla_horas = models.PositiveIntegerField(default=24)
    creado_en = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-creado_en']


class OrdenCompra(models.Model):
    ESTATUS_CHOICES = [
        ('solicitada', 'Solicitada / Requisición'),
        ('aprobada', 'Aprobada por Compras'),
        ('ordenada', 'Ordenada a Proveedor'),
        ('recibida', 'Insumos Recibidos en Almacén'),
        ('cancelada', 'Cancelada'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    folio = models.CharField(max_length=50, unique=True)
    proveedor_nombre = models.CharField(max_length=200)
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='ordenes_compra')
    proyecto_nombre = models.CharField(max_length=200, blank=True)
    concepto = models.CharField(max_length=255)
    monto_total = models.DecimalField(max_digits=14, decimal_places=2)
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='solicitada', db_index=True)
    solicitado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='compras_solicitadas')
    fecha_requisicion = models.DateField(auto_now_add=True)
    fecha_entrega_esperada = models.DateField()

    class Meta:
        ordering = ['-fecha_requisicion']


class ExpedienteLegal(models.Model):
    TIPO_CHOICES = [
        ('contrato_cliente', 'Contrato Marco con Cliente'),
        ('contrato_subcontrata', 'Contrato Subcontratista / Proveedor'),
        ('licencia_permiso', 'Licencia de Construcción / Permiso'),
        ('fianza_garantia', 'Fianza / Póliza de Garantía'),
        ('litigio_acta', 'Acta Notarial / Asunto Jurídico'),
    ]
    ESTATUS_CHOICES = [
        ('en_revision', 'En Revisión Jurídica'),
        ('firmado', 'Firmado / Vigente'),
        ('por_vencer', 'Próximo a Vencer / Renovación'),
        ('concluido', 'Finiquitado / Concluido'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, default='contrato_cliente')
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='expedientes_legales')
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='expedientes_legales')
    monto_contrato = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='en_revision', db_index=True)
    abogado_responsable = models.CharField(max_length=150, blank=True)
    fecha_firma = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    clausulas_clave = models.TextField(blank=True)
    archivo_url = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-fecha_firma']


class TicketPosventa(models.Model):
    TIPO_FALLA_CHOICES = [
        ('acabados', 'Detalle de Acabados / Pintura'),
        ('carpinteria', 'Desajuste de Carpintería / Muebles'),
        ('impermeabilizacion', 'Filtración / Muro Húmedo'),
        ('instalaciones', 'Instalación Eléctrica / Hidráulica'),
        ('otro', 'Atención General'),
    ]
    ESTATUS_CHOICES = [
        ('abierto', 'Reporte Abierto'),
        ('en_atencion', 'Técnico Asignado en Sitio'),
        ('resuelto', 'Reparación Concluida'),
        ('firmado_cliente', 'Finiquito de Garantía Firmado'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    folio = models.CharField(max_length=50, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='tickets_posventa')
    empresa_responsable = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='tickets_posventa')
    proyecto_nombre = models.CharField(max_length=200, blank=True)
    tipo_falla = models.CharField(max_length=30, choices=TIPO_FALLA_CHOICES, default='acabados')
    descripcion_falla = models.TextField()
    costo_reparacion = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='abierto', db_index=True)
    fecha_reporte = models.DateField(auto_now_add=True)
    fecha_solucion_estimada = models.DateField()

    class Meta:
        ordering = ['-fecha_reporte']

import uuid
from django.db import models
from apps.core.models import Usuario, Empresa
from apps.proyectos.models import Proyecto


class Cuadrilla(models.Model):
    nombre = models.CharField(max_length=100)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="cuadrillas")

    def __str__(self):
        return self.nombre


class BitacoraObra(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="bitacoras")
    fecha = models.DateField()
    porcentaje_avance = models.PositiveSmallIntegerField()
    cuadrilla = models.ForeignKey(Cuadrilla, on_delete=models.SET_NULL, null=True, related_name="bitacoras")
    registrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="bitacoras")
    incidencias = models.TextField(blank=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Bitácora de obra"
        verbose_name_plural = "Bitácoras de obra"

    def __str__(self):
        return f"{self.proyecto.nombre} — {self.fecha}"


class FotoAvance(models.Model):
    bitacora = models.ForeignKey(BitacoraObra, on_delete=models.CASCADE, related_name="fotos")
    imagen = models.ImageField(upload_to="obra/avances/%Y/%m/")

    def __str__(self):
        return f"Foto — {self.bitacora}"


class ConsumoMaterial(models.Model):
    bitacora = models.ForeignKey(BitacoraObra, on_delete=models.CASCADE, related_name="consumos")
    material = models.CharField(max_length=150)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    unidad = models.CharField(max_length=20, default="pza")

    def __str__(self):
        return f"{self.material} ({self.cantidad} {self.unidad})"


class EstimacionObra(models.Model):
    ESTATUS = [
        ("borrador", "Borrador"),
        ("presentada", "Presentada a Supervisión"),
        ("aprobada", "Aprobada por Cliente"),
        ("facturada", "Facturada"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="estimaciones")
    numero_estimacion = models.PositiveIntegerField()
    fecha_presentacion = models.DateField()
    porcentaje_ejecutado = models.DecimalField(max_digits=5, decimal_places=2)
    monto_ejecutado = models.DecimalField(max_digits=14, decimal_places=2)
    estatus = models.CharField(max_length=20, choices=ESTATUS, default="borrador", db_index=True)
    notas = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-numero_estimacion"]
        unique_together = ["proyecto", "numero_estimacion"]
        verbose_name = "Estimación de Obra"
        verbose_name_plural = "Estimaciones de Obra"

    def __str__(self):
        return f"Estimación #{self.numero_estimacion} — {self.proyecto.nombre}"


class InventarioMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.CharField(max_length=150, unique=True)
    unidad = models.CharField(max_length=20, default="pza")
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="inventario_materiales")
    stock_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=10.0)
    precio_unitario_promedio = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["material"]
        verbose_name = "Inventario de Material"
        verbose_name_plural = "Inventario de Materiales"

    def __str__(self):
        return f"{self.material} ({self.stock_actual} {self.unidad})"


class OrdenIntercompania(models.Model):
    ESTATUS = [
        ("solicitada", "Solicitada"),
        ("en_proceso", "En Proceso"),
        ("entregada", "Entregada"),
        ("liquidada", "Liquidada"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="ordenes_intercompania")
    empresa_origen = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="ordenes_salientes")
    empresa_destino = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="ordenes_entrantes")
    concepto = models.CharField(max_length=255)
    monto_interno = models.DecimalField(max_digits=14, decimal_places=2)
    estatus = models.CharField(max_length=20, choices=ESTATUS, default="solicitada", db_index=True)
    fecha_solicitud = models.DateField(auto_now_add=True)
    fecha_entrega_estimada = models.DateField()

    class Meta:
        ordering = ["-fecha_solicitud"]
        verbose_name = "Orden Intercompañía"
        verbose_name_plural = "Órdenes Intercompañía"

    def __str__(self):
        return f"Orden Intercompañía {self.empresa_origen.nombre} ➔ {self.empresa_destino.nombre}"

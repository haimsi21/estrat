import uuid
from django.db import models
from apps.core.models import Cliente, Empresa
from apps.proyectos.models import Proyecto
from apps.produccion.models import Pedido
from apps.arquitectura.models import PropuestaDiseno


class Factura(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="facturas")
    fecha = models.DateField()
    folio_fiscal = models.CharField(max_length=60, blank=True, help_text="UUID del CFDI, si aplica")
    pagada = models.BooleanField(default=False, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        return sum(d.monto for d in self.detalles.all())

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return f"Factura {self.id} — {self.cliente}"


class FacturaDetalle(models.Model):
    MODULO_ORIGEN = [
        ("arquitectura", "Arquitectura"),
        ("proyecto", "Proyecto / Obra"),
        ("produccion", "Producción"),
        ("otro", "Otro"),
    ]
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name="detalles")
    concepto = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="facturas_detalle")
    modulo_origen = models.CharField(max_length=20, choices=MODULO_ORIGEN)

    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    propuesta_diseno = models.ForeignKey(PropuestaDiseno, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    pedido_produccion = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    def __str__(self):
        return f"{self.concepto} — ${self.monto} ({self.empresa})"


class CuentaPorCobrar(models.Model):
    factura = models.OneToOneField(Factura, on_delete=models.CASCADE, related_name="cuenta_por_cobrar")
    fecha_vencimiento = models.DateField()
    saldo_pendiente = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f"CxC {self.factura}"


class FacturaProveedor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proveedor_nombre = models.CharField(max_length=200)
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="facturas_proveedor")
    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True, related_name="facturas_proveedor")
    concepto = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField()
    pagada = models.BooleanField(default=False, db_index=True)
    saldo_pendiente = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_emision"]
        verbose_name = "Factura de Proveedor / CxP"
        verbose_name_plural = "Facturas de Proveedores / CxP"

    def __str__(self):
        return f"{self.proveedor_nombre} — ${self.monto} ({self.empresa.nombre})"

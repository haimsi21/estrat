import uuid
from django.db import models
from apps.core.models import Empresa
from apps.obra.models import Cuadrilla
from apps.produccion.models import Pedido


class Empleado(models.Model):
    """81 empleados fijos del holding."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre_completo = models.CharField(max_length=200)
    puesto = models.CharField(max_length=100)
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="empleados")
    fecha_contrato = models.DateField()
    salario = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
    cuadrilla = models.ForeignKey(Cuadrilla, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="miembros")

    class Meta:
        ordering = ["nombre_completo"]

    def __str__(self):
        return self.nombre_completo


class Asistencia(models.Model):
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name="asistencias")
    fecha = models.DateField()
    hora_entrada = models.TimeField(null=True, blank=True)
    hora_salida = models.TimeField(null=True, blank=True)
    pedido_produccion = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name="asistencias_taller")

    class Meta:
        ordering = ["-fecha"]
        unique_together = ["empleado", "fecha"]

    def __str__(self):
        return f"{self.empleado} — {self.fecha}"

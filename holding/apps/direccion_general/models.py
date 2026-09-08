import uuid
from django.db import models
from apps.core.models import Empresa, Usuario

class Area(models.TextChoices):
    COMERCIAL = "comercial", "Comercial"
    ARQUITECTURA = "arquitectura", "Arquitectura"
    PROYECTOS = "proyectos", "Proyectos"
    OBRA = "obra", "Obra"
    FINANCIERO = "financiero", "Financiero"
    RRHH = "rrhh", "RH"
    PRODUCCION = "produccion", "Producción"

class TipoIndicador(models.TextChoices):
    VENTAS_MES = "ventas_mes", "Ventas del mes"
    AVANCE_FISICO = "avance_fisico", "Avance físico"
    AVANCE_PROYECTOS = "avance_proyectos", "% avance general"
    PROYECTOS_ENTREGADOS = "proyectos_entregados", "Proyectos a tiempo"
    FLUJO_CAJA = "flujo_caja", "Flujo de caja"
    MARGEN = "margen", "Margen consolidado"
    OTRO = "otro", "Otro"

class Indicador(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=30, choices=TipoIndicador.choices, default=TipoIndicador.OTRO)
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    unidad = models.CharField(max_length=20, default="%")
    area = models.CharField(max_length=20, choices=Area.choices)
    fecha_registro = models.DateField(auto_now_add=True)
    fecha_referencia = models.DateField(null=True, blank=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.SET_NULL, null=True, blank=True, related_name="indicadores")
    proyecto = models.ForeignKey("proyectos.Proyecto", on_delete=models.SET_NULL, null=True, blank=True, related_name="indicadores")
    registrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name="indicadores_registrados")
    notas = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_registro"]
        verbose_name = "Indicador / KPI"
        verbose_name_plural = "Indicadores / KPIs"
        indexes = [
            models.Index(fields=["area", "fecha_registro"]),
            models.Index(fields=["empresa", "fecha_registro"]),
        ]

    def __str__(self):
        return f"{self.nombre}: {self.valor}{self.unidad}"

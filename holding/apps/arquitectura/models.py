import uuid
from django.db import models
from apps.core.models import Cliente, Usuario
from apps.proyectos.models import Proyecto


class PropuestaDiseno(models.Model):
    """Puede existir ANTES de que exista el Proyecto formal (propuesta para ganar
    al cliente) o DESPUÉS (ya con proyecto aprobado). Por eso proyecto es nullable."""
    ESTATUS = [
        ("boceto", "Boceto"),
        ("revision", "En revisión"),
        ("aprobado", "Aprobado"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="propuestas_diseno")
    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name="propuestas_diseno")
    arquitecto_responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True,
                                                related_name="propuestas_diseno")
    version = models.PositiveIntegerField(default=1)
    estatus = models.CharField(max_length=20, choices=ESTATUS, default="boceto")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.cliente} — v{self.version} ({self.estatus})"


class ArchivoDiseno(models.Model):
    """Planos, renders, modelos 3D/LiDAR (USDZ) asociados a una propuesta."""
    TIPO = [
        ("plano", "Plano (PDF/DWG)"),
        ("render", "Render"),
        ("modelo_3d", "Modelo 3D / USDZ (LiDAR)"),
        ("nube_puntos", "Nube de puntos"),
    ]
    propuesta = models.ForeignKey(PropuestaDiseno, on_delete=models.CASCADE, related_name="archivos")
    tipo = models.CharField(max_length=20, choices=TIPO)
    archivo = models.FileField(upload_to="arquitectura/%Y/%m/")
    subido_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.propuesta}"

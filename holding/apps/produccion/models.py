import uuid
from django.db import models
from apps.core.models import Cliente, Usuario
from apps.proyectos.models import Proyecto


class Pedido(models.Model):
    """Muebles/objetos sobre pedido. Puede colgar de un Proyecto (obra que
    incluye mobiliario a medida) o ser un pedido independiente — ambos casos aplican."""
    ESTATUS = [
        ("diseno", "Diseño"),
        ("taller", "En taller"),
        ("entrega", "Listo para entrega"),
        ("entregado", "Entregado"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="pedidos_produccion")
    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name="pedidos_produccion")
    tipo_objeto = models.CharField(max_length=150, help_text="Ej. mesa, silla, clóset a medida")
    especificaciones = models.TextField(blank=True)
    responsable_taller = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True,
                                            related_name="pedidos_asignados")
    fecha_entrega = models.DateField()
    estatus = models.CharField(max_length=20, choices=ESTATUS, default="diseno")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.tipo_objeto} — {self.cliente}"

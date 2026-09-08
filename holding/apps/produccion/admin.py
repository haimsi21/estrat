from django.contrib import admin
from .models import Pedido


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("tipo_objeto", "cliente", "proyecto", "estatus", "fecha_entrega")
    list_filter = ("estatus",)

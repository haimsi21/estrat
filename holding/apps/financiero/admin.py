from django.contrib import admin
from .models import Factura, FacturaDetalle, CuentaPorCobrar


class FacturaDetalleInline(admin.TabularInline):
    model = FacturaDetalle
    extra = 1


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ("id", "cliente", "fecha", "total", "pagada")
    inlines = [FacturaDetalleInline]


@admin.register(CuentaPorCobrar)
class CuentaPorCobrarAdmin(admin.ModelAdmin):
    list_display = ("factura", "fecha_vencimiento", "saldo_pendiente")

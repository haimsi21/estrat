from django.contrib import admin
from .models import Lead, Cotizacion, Contrato


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("cliente", "empresa", "origen", "estatus", "responsable")
    list_filter = ("empresa", "estatus", "origen")


@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    list_display = ("concepto", "lead", "monto", "vigencia", "aprobada")
    list_filter = ("aprobada",)


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    list_display = ("id", "cotizacion", "fecha_firma")

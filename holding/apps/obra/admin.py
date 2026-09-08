from django.contrib import admin
from .models import Cuadrilla, BitacoraObra, FotoAvance, ConsumoMaterial


class FotoAvanceInline(admin.TabularInline):
    model = FotoAvance
    extra = 1


class ConsumoMaterialInline(admin.TabularInline):
    model = ConsumoMaterial
    extra = 1


@admin.register(Cuadrilla)
class CuadrillaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "proyecto")


@admin.register(BitacoraObra)
class BitacoraObraAdmin(admin.ModelAdmin):
    list_display = ("proyecto", "fecha", "porcentaje_avance", "cuadrilla")
    list_filter = ("proyecto",)
    inlines = [FotoAvanceInline, ConsumoMaterialInline]

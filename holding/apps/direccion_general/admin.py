from django.contrib import admin
from .models import Indicador

@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "valor", "unidad", "area", "empresa", "fecha_registro")
    list_filter = ("area", "tipo", "fecha_registro")
    search_fields = ("nombre", "notas")
    date_hierarchy = "fecha_registro"
    readonly_fields = ("creado_en",)

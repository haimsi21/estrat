from django.contrib import admin
from .models import Empleado, Asistencia


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("nombre_completo", "puesto", "empresa", "activo")
    list_filter = ("empresa", "activo")
    search_fields = ("nombre_completo",)


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ("empleado", "fecha", "hora_entrada", "hora_salida")
    list_filter = ("fecha",)

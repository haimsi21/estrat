from django.contrib import admin
from .models import Proyecto, Fase, ParticipacionEmpresa


class FaseInline(admin.TabularInline):
    model = Fase
    extra = 1


class ParticipacionEmpresaInline(admin.TabularInline):
    model = ParticipacionEmpresa
    extra = 1


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "cliente", "empresa", "presupuesto_total", "fecha_inicio", "activo")
    list_filter = ("empresa", "activo")
    search_fields = ("nombre",)
    inlines = [ParticipacionEmpresaInline, FaseInline]


@admin.register(ParticipacionEmpresa)
class ParticipacionEmpresaAdmin(admin.ModelAdmin):
    list_display = ("proyecto", "empresa", "monto_presupuesto", "porcentaje_avance", "estatus_cancha")
    list_filter = ("empresa", "estatus_cancha")

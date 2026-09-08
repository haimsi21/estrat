from django.contrib import admin
from .models import PropuestaDiseno, ArchivoDiseno


class ArchivoDisenoInline(admin.TabularInline):
    model = ArchivoDiseno
    extra = 1


@admin.register(PropuestaDiseno)
class PropuestaDisenoAdmin(admin.ModelAdmin):
    list_display = ("cliente", "proyecto", "version", "estatus", "arquitecto_responsable")
    list_filter = ("estatus",)
    inlines = [ArchivoDisenoInline]

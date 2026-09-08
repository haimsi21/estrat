from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Empresa, Rol, Usuario, Cliente


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "razon_social", "rfc", "activa")


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("nombre", "descripcion")


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Holding", {"fields": ("empresas", "rol", "puesto")}),
    )
    list_display = ("username", "get_full_name", "rol", "puesto", "is_staff")


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombre_comercial", "razon_social", "rfc", "contacto_email")
    search_fields = ("nombre_comercial", "razon_social", "rfc")

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    django.setup()
except Exception:
    pass

from django.contrib.auth import get_user_model
from apps.core.models import Empresa, Rol, CapaAcceso

User = get_user_model()

# 1. Asegurar Empresas del Holding
emp1, _ = Empresa.objects.get_or_create(nombre="Desarrollo", defaults={"activa": True, "rfc": "DES180101ABC"})
emp2, _ = Empresa.objects.get_or_create(nombre="Arquitectura", defaults={"activa": True, "rfc": "ARQ180101XYZ"})
emp3, _ = Empresa.objects.get_or_create(nombre="Producción", defaults={"activa": True, "rfc": "PRO180101LMN"})

# 2. Asegurar Rol C-Suite
rol_dg, _ = Rol.objects.get_or_create(
    nombre="Director General", 
    defaults={"descripcion": "Acceso total C-Suite", "capa": CapaAcceso.DIRECCION}
)

MODULOS_TODOS = [
    "dashboard", "comercial", "proyectos", "arquitectura", "obra", 
    "produccion", "financiero", "compras", "legal", "posventa", 
    "rrhh", "bitacora", "core"
]

# 3. Crear / Configurar usuario master (y director / admin)
usuarios_master = ["master", "director", "admin"]

for usr in usuarios_master:
    u, _ = User.objects.get_or_create(username=usr)
    u.email = f"{usr}@holding.com"
    u.first_name = "Master" if usr == "master" else "Director"
    u.last_name = "General"
    u.puesto = "Director General C-Suite"
    u.rol = rol_dg
    u.departamento = "direccion"
    u.modulos_permitidos = MODULOS_TODOS
    u.monto_autorizacion_max = 10000000.00
    u.is_active = True
    u.is_staff = True
    u.is_superuser = True
    u.set_password("432432")
    u.empresas.set([emp1, emp2, emp3])
    u.save()

print("\n========================================================")
print("✅ USUARIOS MASTER CONFIGURADOS Y LISTOS AL 100%")
print("   • Usuario Master:  master  (o director / admin)")
print("   • Contraseña:      432432")
print("========================================================\n")

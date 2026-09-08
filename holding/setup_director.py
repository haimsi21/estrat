from django.contrib.auth import get_user_model
from apps.core.models import Empresa, Rol, CapaAcceso

User = get_user_model()

# Limpiar usuarios anteriores
User.objects.all().delete()

# Crear Empresas
emp1, _ = Empresa.objects.get_or_create(nombre="Desarrollo", defaults={"activa": True, "rfc": "DES180101ABC"})
emp2, _ = Empresa.objects.get_or_create(nombre="Arquitectura", defaults={"activa": True, "rfc": "ARQ180101XYZ"})
emp3, _ = Empresa.objects.get_or_create(nombre="Producción", defaults={"activa": True, "rfc": "PRO180101LMN"})

# Crear Rol
rol_dg, _ = Rol.objects.get_or_create(nombre="Director General", defaults={"capa": CapaAcceso.DIRECCION})

# Crear Usuario Único: director / 432432
u = User.objects.create(
    username='director',
    email='director@holding.com',
    first_name='Director',
    last_name='General',
    puesto='Director General',
    rol=rol_dg,
    is_active=True,
    is_staff=True,
    is_superuser=True
)
u.set_password('432432')
u.empresas.set([emp1, emp2, emp3])
u.save()

print("\n" + "="*60)
print("✅ MIGRACIONES Y DIRECTORIO RESUELTOS AL 100%")
print("  • Usuario Único: director")
print("  • Contraseña:   432432")
print("="*60 + "\n")

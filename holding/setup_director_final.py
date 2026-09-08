from django.contrib.auth import get_user_model
from apps.core.models import Empresa, Rol, CapaAcceso

User = get_user_model()

# Crear Empresas
emp1, _ = Empresa.objects.get_or_create(nombre="Desarrollo", defaults={"activa": True, "rfc": "DES180101ABC"})
emp2, _ = Empresa.objects.get_or_create(nombre="Arquitectura", defaults={"activa": True, "rfc": "ARQ180101XYZ"})
emp3, _ = Empresa.objects.get_or_create(nombre="Producción", defaults={"activa": True, "rfc": "PRO180101LMN"})

# Crear Rol
rol_dg, _ = Rol.objects.get_or_create(nombre="Director General", defaults={"capa": CapaAcceso.DIRECCION})

# Crear Usuario director / 432432
u, _ = User.objects.get_or_create(username='director')
u.email = 'director@holding.com'
u.first_name = 'Director'
u.last_name = 'General'
u.puesto = 'Director General'
u.rol = rol_dg
u.is_active = True
u.is_staff = True
u.is_superuser = True
u.set_password('432432')
u.empresas.set([emp1, emp2, emp3])
u.save()

print("\n" + "="*65)
print("  ✅ CONEXIÓN A POSTGRES EXITOSA Y USUARIO LISTO")
print("  • Usuario:    director")
print("  • Contraseña: 432432")
print("="*65 + "\n")

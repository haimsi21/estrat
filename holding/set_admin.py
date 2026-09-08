from django.contrib.auth import get_user_model
from apps.core.models import Empresa

User = get_user_model()

# Configurar únicamente el usuario admin con password 432432
u, _ = User.objects.get_or_create(username='admin')
u.email = 'admin@holding.com'
u.first_name = 'Admin'
u.last_name = 'Holding'
u.puesto = 'Director General'
u.is_active = True
u.is_staff = True
u.is_superuser = True
u.set_password('432432')

empresas = list(Empresa.objects.all())
if empresas:
    u.empresas.set(empresas)

u.save()

print("\n" + "="*60)
print("✅ USUARIO ADMIN CONFIGURADO Y LISTO")
print("  • Usuario: admin")
print("  • Contraseña: 432432")
print("="*60 + "\n")

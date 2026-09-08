from django.contrib.auth import get_user_model, authenticate
from apps.core.models import Rol, Empresa, CapaAcceso

User = get_user_model()

print("\n🔧 ACTIVANDO Y ESTABLECIENDO CONTRASEÑA 'admin123'...")

# 1. Forzar Admin
admin_user, _ = User.objects.get_or_create(username='admin')
admin_user.email = 'admin@holding.com'
admin_user.is_active = True
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.set_password('admin123')
admin_user.save()

# 2. Forzar Arquitecto1
arq_user, _ = User.objects.get_or_create(username='arquitecto1')
arq_user.first_name = 'Lucía'
arq_user.last_name = 'Diseño'
arq_user.is_active = True
arq_user.set_password('admin123')
arq_user.save()

# 3. Activar y resetear TODOS los demás usuarios
for u in User.objects.all():
    u.is_active = True
    u.set_password('admin123')
    u.save()

print("\n" + "="*70)
print(f"{'USUARIO':<20} | {'ESTADO CUENTA':<15} | {'PRUEBA DE AUTH'}")
print("-" * 70)

for u in User.objects.all().order_by('username'):
    auth_user = authenticate(username=u.username, password='admin123')
    auth_status = "✅ AUTH OK (Entra)" if auth_user else "❌ AUTH FAIL"
    print(f"{u.username:<20} | {'ACTIVO':<15} | {auth_status}")

print("="*70 + "\n")

from django.contrib.auth import get_user_model
from apps.core.models import Empresa

User = get_user_model()
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
print("\n✅ USUARIO ADMIN CONFIGURADO EN IMAGEN NUEVA: admin / 432432\n")

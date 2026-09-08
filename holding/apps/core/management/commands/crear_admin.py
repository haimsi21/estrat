from django.core.management.base import BaseCommand
from apps.core.models import Usuario, Empresa, Rol, CapaAcceso

class Command(BaseCommand):
    help = "Crea el usuario admin inicial con todos los permisos"

    def handle(self, *args, **options):
        # Crear empresas si no existen
        emp_desarrollo, _ = Empresa.objects.get_or_create(
            nombre="Desarrollo",
            defaults={"rfc": "DES180101ABC", "activa": True}
        )
        emp_arquitectura, _ = Empresa.objects.get_or_create(
            nombre="Arquitectura",
            defaults={"rfc": "ARQ180101XYZ", "activa": True}
        )
        emp_produccion, _ = Empresa.objects.get_or_create(
            nombre="Producción",
            defaults={"rfc": "PRO180101LMN", "activa": True}
        )
        self.stdout.write(self.style.SUCCESS("✅ 3 empresas del holding listas"))

        # Crear rol de Director General
        rol_dg, _ = Rol.objects.get_or_create(
            nombre="Director General",
            defaults={"capa": CapaAcceso.DIRECCION, "descripcion": "Acceso total al sistema"}
        )
        self.stdout.write(self.style.SUCCESS("✅ Rol 'Director General' creado"))

        # Crear superusuario
        if not Usuario.objects.filter(username='admin').exists():
            user = Usuario.objects.create_superuser(
                username='admin',
                email='admin@holding.com',
                password='admin123',
                first_name='Admin',
                last_name='Holding',
                puesto='Director General',
                rol=rol_dg,
                is_staff=True,
                is_active=True
            )
            user.empresas.add(emp_desarrollo, emp_arquitectura, emp_produccion)
            self.stdout.write(self.style.SUCCESS("✅ Superusuario creado: admin / admin123"))
            self.stdout.write(self.style.WARNING("⚠️  Cambia esta contraseña en producción"))
        else:
            self.stdout.write(self.style.WARNING("⏭️  El usuario 'admin' ya existe"))
            user = Usuario.objects.get(username='admin')
            if not user.rol:
                user.rol = rol_dg
                user.save()
                self.stdout.write(self.style.SUCCESS("✅ Rol asignado al admin existente"))

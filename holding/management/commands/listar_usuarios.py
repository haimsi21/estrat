from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import Empresa, Rol, CapaAcceso

User = get_user_model()

class Command(BaseCommand):
    help = "Lista todos los usuarios del sistema y permite resetear/estandarizar sus contraseñas."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Establece una contraseña conocida para TODOS los usuarios.'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Contraseña que se asignará al usar la bandera --reset (por defecto: admin123).'
        )
        parser.add_argument(
            '--crear-demo-users',
            action='store_true',
            help='Crea usuarios de prueba predefinidos para cada área del holding.'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n" + "="*85))
        self.stdout.write(self.style.SUCCESS("👥 AUDITORÍA Y DIRECTORIO DE USUARIOS DEL HOLDING"))
        self.stdout.write(self.style.SUCCESS("="*85 + "\n"))

        if options['crear_demo_users']:
            self._crear_usuarios_demo(options['password'])

        if options['reset']:
            nueva_pass = options['password']
            self.stdout.write(self.style.WARNING(f"🔄 Reseteando contraseñas de TODOS los usuarios a: '{nueva_pass}'...\n"))
            for user in User.objects.all():
                user.set_password(nueva_pass)
                user.save()
            self.stdout.write(self.style.SUCCESS(f"✅ ¡Contraseñas actualizadas a '{nueva_pass}' exitosamente!\n"))

        usuarios = User.objects.select_related('rol').prefetch_related('empresas').all().order_by('username')
        
        if not usuarios.exists():
            self.stdout.write(self.style.WARNING("⚠️ No hay usuarios registrados en el sistema."))
            self.stdout.write(self.style.NOTICE("Ejecuta 'python manage.py crear_admin' o 'python manage.py listar_usuarios --crear-demo-users'\n"))
            return

        self.stdout.write(
            f"{'ID':<5} | {'USUARIO':<18} | {'NOMBRE COMPLETO':<24} | {'ROL / PUESTO':<24} | {'ESTADO':<8} | {'CONTRASEÑA'}"
        )
        self.stdout.write("-" * 105)

        for u in usuarios:
            status_str = "ACTIVO" if u.is_active else "INACTIVO"
            has_pass = "CONFIGURADA" if u.has_usable_password() else "SIN CONTRASEÑA"
            if options['reset']:
                pass_display = f"'{options['password']}'"
            elif u.username == 'admin':
                pass_display = "'admin123' (o la definida)"
            else:
                pass_display = has_pass

            rol_puesto = u.puesto or (u.rol.nombre if u.rol else "Sin rol")
            nombre = u.get_full_name() or u.username

            color = self.style.SUCCESS if u.is_active else self.style.ERROR
            self.stdout.write(color(
                f"{u.id:<5} | {u.username:<18} | {nombre[:23]:<24} | {rol_puesto[:23]:<24} | {status_str:<8} | {pass_display}"
            ))

        self.stdout.write("\n" + "="*85 + "\n")

    def _crear_usuarios_demo(self, password):
        self.stdout.write(self.style.SUCCESS("🛠️ Generando usuarios de prueba por área del Holding..."))
        
        empresas = list(Empresa.objects.all())
        roles_demo = [
            ("vendedor1", "Carlos", "Ventas", "Vendedor Senior", CapaAcceso.OPERATIVO),
            ("arquitecto1", "Lucía", "Diseño", "Arquitecto Senior", CapaAcceso.OPERATIVO),
            ("residente1", "Miguel", "Obra", "Residente de Obra", CapaAcceso.OPERATIVO),
            ("gerente_financiero", "Roberto", "Finanzas", "Gerente Financiero", CapaAcceso.JEFE_AREA),
            ("director_general", "Fernando", "Dirección", "Director General", CapaAcceso.DIRECCION),
        ]

        for username, fname, lname, puesto, capa in roles_demo:
            rol_obj, _ = Rol.objects.get_or_create(
                nombre=puesto,
                defaults={"capa": capa}
            )
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": fname,
                    "last_name": lname,
                    "email": f"{username}@holding.com",
                    "puesto": puesto,
                    "rol": rol_obj,
                    "is_active": True,
                    "is_staff": (capa == CapaAcceso.DIRECCION)
                }
            )
            user.set_password(password)
            if empresas:
                user.empresas.set(empresas)
            user.save()
            status = "✅ Creado" if created else "🔄 Actualizado"
            self.stdout.write(f"  {status}: {username} | Password: '{password}' | Puesto: {puesto}")
        
        self.stdout.write(self.style.SUCCESS("✅ Usuarios demo creados exitosamente.\n"))

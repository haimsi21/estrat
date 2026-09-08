from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from apps.core.models import Empresa, Rol, CapaAcceso

class Command(BaseCommand):
    help = "Configuración inicial del holding: empresas, roles, grupos y permisos"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🏢 Creando empresas del holding..."))
        empresas_data = [
            ("Desarrollo", "Ro Desarrollo SA de CV", "XAX010101000"),
            ("Arquitectura", "Ro Arquitectura SA de CV", "XAX010101001"),
            ("Producción", "Ro Producción SA de CV", "XAX010101002"),
        ]
        for nombre, razon_social, rfc in empresas_data:
            obj, created = Empresa.objects.get_or_create(
                nombre=nombre,
                defaults={"razon_social": razon_social, "rfc": rfc, "activa": True}
            )
            status = "✅ creada" if created else "⏭️  ya existía"
            self.stdout.write(f"   {status}: {nombre}")

        self.stdout.write(self.style.SUCCESS("\n👤 Creando roles con capas de acceso..."))
        roles_data = [
            ("Vendedor", CapaAcceso.OPERATIVO),
            ("Arquitecto", CapaAcceso.OPERATIVO),
            ("Residente de obra", CapaAcceso.OPERATIVO),
            ("Auxiliar contable", CapaAcceso.OPERATIVO),
            ("Auxiliar de RH", CapaAcceso.OPERATIVO),
            ("Operador de producción", CapaAcceso.OPERATIVO),
            ("Gerente comercial", CapaAcceso.JEFE_AREA),
            ("Director de arquitectura", CapaAcceso.JEFE_AREA),
            ("Gerente de proyectos", CapaAcceso.JEFE_AREA),
            ("Gerente de obra", CapaAcceso.JEFE_AREA),
            ("Gerente financiero", CapaAcceso.JEFE_AREA),
            ("Gerente de RH", CapaAcceso.JEFE_AREA),
            ("Gerente de producción", CapaAcceso.JEFE_AREA),
            ("Director General", CapaAcceso.DIRECCION),
        ]
        for nombre, capa in roles_data:
            obj, created = Rol.objects.get_or_create(
                nombre=nombre,
                defaults={"capa": capa}
            )
            status = "✅ creado" if created else "⏭️  ya existía"
            self.stdout.write(f"   {status}: {nombre} ({capa.label})")

        self.stdout.write(self.style.SUCCESS("\n🔐 Creando Grupos de Django con permisos..."))
        grupos_data = {
            "Operativo (Captura)": CapaAcceso.OPERATIVO,
            "Jefe de Área": CapaAcceso.JEFE_AREA,
            "Dirección General": CapaAcceso.DIRECCION,
        }
        for nombre_grupo, capa in grupos_data.items():
            grupo, created = Group.objects.get_or_create(name=nombre_grupo)
            if created:
                self.stdout.write(f"   ✅ creado: {nombre_grupo}")
            else:
                self.stdout.write(f"   ⏭️  ya existía: {nombre_grupo}")
            
            # Asignar permisos básicos según la capa
            permisos_basicos = ['view_', 'add_', 'change_']
            if capa == CapaAcceso.DIRECCION:
                permisos_basicos.append('delete_')
            
            # Aquí podríamos filtrar permisos por app, pero por ahora dejamos que el admin los asigne manualmente
        
        self.stdout.write(self.style.SUCCESS("\n Setup inicial completado."))
        self.stdout.write("Siguiente paso: asigna usuarios a grupos desde el admin.")

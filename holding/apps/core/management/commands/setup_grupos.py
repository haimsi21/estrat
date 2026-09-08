from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from apps.core.models import Usuario

class Command(BaseCommand):
    help = "Crea grupos de usuarios"

    def handle(self, *args, **options):
        grupos = [
            'admin_sistema', 'dg', 'dir_arquitectura', 'dir_obra',
            'dir_comercial', 'dir_produccion', 'dir_financiero', 'dir_rh',
            'operativo_arquitectura', 'operativo_obra', 'operativo_produccion',
            'operativo_comercial', 'operativo_financiero', 'operativo_rh'
        ]
        
        for grupo_name in grupos:
            grupo, created = Group.objects.get_or_create(name=grupo_name)
            if created:
                self.stdout.write(f"✅ Grupo '{grupo_name}' creado")
            else:
                self.stdout.write(f"⏭️  Grupo '{grupo_name}' ya existe")
        
        self.stdout.write(self.style.SUCCESS("\n✅ Todos los grupos creados"))

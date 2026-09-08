from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from apps.core.models import Rol, CapaAcceso

class Command(BaseCommand):
    help = "Crea grupos de Django y asigna permisos por capa de acceso"

    def handle(self, *args, **options):
        self.stdout.write("🔐 Configurando permisos por capa de acceso...")
        
        permisos_por_capa = {
            CapaAcceso.OPERATIVO: [
                'add_lead', 'change_lead', 'view_lead',
                'add_cotizacion', 'change_cotizacion', 'view_cotizacion',
                'add_propuestadiseno', 'change_propuestadiseno', 'view_propuestadiseno',
                'add_archivodiseno', 'view_archivodiseno',
                'add_bitacoraobra', 'change_bitacoraobra', 'view_bitacoraobra',
                'add_fotoavance', 'view_fotoavance',
                'add_consumomaterial', 'view_consumomaterial',
                'add_pedido', 'change_pedido', 'view_pedido',
                'add_asistencia', 'view_asistencia',
                'view_proyecto', 'view_cliente', 'view_empresa',
            ],
            CapaAcceso.JEFE_AREA: [
                'add_lead', 'change_lead', 'view_lead', 'delete_lead',
                'add_cotizacion', 'change_cotizacion', 'view_cotizacion',
                'add_contrato', 'change_contrato', 'view_contrato',
                'add_propuestadiseno', 'change_propuestadiseno', 'view_propuestadiseno', 'delete_propuestadiseno',
                'add_archivodiseno', 'view_archivodiseno', 'delete_archivodiseno',
                'add_proyecto', 'change_proyecto', 'view_proyecto',
                'add_fase', 'change_fase', 'view_fase',
                'add_bitacoraobra', 'change_bitacoraobra', 'view_bitacoraobra', 'delete_bitacoraobra',
                'add_pedido', 'change_pedido', 'view_pedido', 'delete_pedido',
                'add_factura', 'change_factura', 'view_factura',
                'add_facturadetalle', 'change_facturadetalle', 'view_facturadetalle',
                'add_empleado', 'change_empleado', 'view_empleado',
                'add_asistencia', 'change_asistencia', 'view_asistencia',
                'view_cliente', 'view_empresa', 'view_indicador',
            ],
            CapaAcceso.DIRECCION: [
                'add_lead', 'change_lead', 'view_lead', 'delete_lead',
                'add_cotizacion', 'change_cotizacion', 'view_cotizacion', 'delete_cotizacion',
                'add_contrato', 'change_contrato', 'view_contrato', 'delete_contrato',
                'add_propuestadiseno', 'change_propuestadiseno', 'view_propuestadiseno', 'delete_propuestadiseno',
                'add_archivodiseno', 'view_archivodiseno', 'delete_archivodiseno',
                'add_proyecto', 'change_proyecto', 'view_proyecto', 'delete_proyecto',
                'add_fase', 'change_fase', 'view_fase', 'delete_fase',
                'add_bitacoraobra', 'change_bitacoraobra', 'view_bitacoraobra', 'delete_bitacoraobra',
                'add_fotoavance', 'view_fotoavance', 'delete_fotoavance',
                'add_consumomaterial', 'view_consumomaterial', 'delete_consumomaterial',
                'add_pedido', 'change_pedido', 'view_pedido', 'delete_pedido',
                'add_factura', 'change_factura', 'view_factura', 'delete_factura',
                'add_facturadetalle', 'change_facturadetalle', 'view_facturadetalle', 'delete_facturadetalle',
                'add_cuentaporcobrar', 'change_cuentaporcobrar', 'view_cuentaporcobrar',
                'add_empleado', 'change_empleado', 'view_empleado', 'delete_empleado',
                'add_asistencia', 'change_asistencia', 'view_asistencia', 'delete_asistencia',
                'add_cliente', 'change_cliente', 'view_cliente', 'delete_cliente',
                'add_empresa', 'change_empresa', 'view_empresa',
                'add_rol', 'change_rol', 'view_rol',
                'add_usuario', 'change_usuario', 'view_usuario',
                'add_indicador', 'change_indicador', 'view_indicador', 'delete_indicador',
            ],
        }
        
        for capa, codenames in permisos_por_capa.items():
            nombre_grupo = capa.label
            grupo, created = Group.objects.get_or_create(name=nombre_grupo)
            
            if created:
                self.stdout.write(f"  ✅ Creado grupo: {nombre_grupo}")
            else:
                self.stdout.write(f"  ⏭️  Grupo ya existe: {nombre_grupo}")
            
            grupo.permissions.clear()
            
            for codename in codenames:
                try:
                    permiso = Permission.objects.get(codename=codename)
                    grupo.permissions.add(permiso)
                except Permission.DoesNotExist:
                    self.stdout.write(f"  ⚠️  Permiso no encontrado: {codename}")
        
        self.stdout.write(self.style.SUCCESS("\n✅ Permisos configurados correctamente."))

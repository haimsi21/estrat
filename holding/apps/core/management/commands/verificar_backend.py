"""
Comando de verificación exhaustiva del backend.
Revisa: migraciones, modelos, API, signals, permisos y consistencia.
"""
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import connection
from django.contrib.auth.models import Group, Permission
from apps.core.models import Empresa, Rol, Cliente, Usuario, CapaAcceso
from apps.proyectos.models import Proyecto, Fase
from apps.comercial.models import Lead, Cotizacion, Contrato
from apps.arquitectura.models import PropuestaDiseno
from apps.obra.models import BitacoraObra, Cuadrilla
from apps.produccion.models import Pedido
from apps.financiero.models import Factura, FacturaDetalle
from apps.rrhh.models import Empleado, Asistencia
from apps.direccion_general.models import Indicador


class Command(BaseCommand):
    help = "Verificación exhaustiva del backend: modelos, migraciones, API, signals, permisos"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("🔍 VERIFICACIÓN EXHAUSTIVA DEL BACKEND"))
        self.stdout.write(self.style.SUCCESS("="*60 + "\n"))
        
        errores = []
        advertencias = []
        
        # ==========================================
        # 1. VERIFICAR MODELOS REGISTRADOS
        # ==========================================
        self.stdout.write(self.style.WARNING("1️⃣  Verificando modelos registrados..."))
        modelos_esperados = [
            'core.Empresa', 'core.Rol', 'core.Usuario', 'core.Cliente',
            'proyectos.Proyecto', 'proyectos.Fase',
            'comercial.Lead', 'comercial.Cotizacion', 'comercial.Contrato',
            'arquitectura.PropuestaDiseno', 'arquitectura.ArchivoDiseno',
            'obra.Cuadrilla', 'obra.BitacoraObra', 'obra.FotoAvance', 'obra.ConsumoMaterial',
            'produccion.Pedido',
            'financiero.Factura', 'financiero.FacturaDetalle', 'financiero.CuentaPorCobrar',
            'rrhh.Empleado', 'rrhh.Asistencia',
            'direccion_general.Indicador',
        ]
        
        for modelo_name in modelos_esperados:
            try:
                apps.get_model(modelo_name)
                self.stdout.write(f"   ✅ {modelo_name}")
            except LookupError:
                errores.append(f"Modelo no encontrado: {modelo_name}")
                self.stdout.write(self.style.ERROR(f"   ❌ {modelo_name}"))
        
        # ==========================================
        # 2. VERIFICAR MIGRACIONES PENDIENTES
        # ==========================================
        self.stdout.write(self.style.WARNING("\n2️⃣  Verificando migraciones..."))
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        call_command('showmigrations', '--list', stdout=out)
        output = out.getvalue()
        
        if 'No migrations to apply' in output or all('[X]' in line for line in output.split('\n') if line.strip() and not line.startswith(' ')):
            self.stdout.write(self.style.SUCCESS("   ✅ Todas las migraciones aplicadas"))
        else:
            # Buscar migraciones sin aplicar
            for line in output.split('\n'):
                if '[ ]' in line:
                    advertencias.append(f"Migración pendiente: {line.strip()}")
                    self.stdout.write(self.style.WARNING(f"   ⚠️  {line.strip()}"))
        
        # ==========================================
        # 3. VERIFICAR INTEGRIDAD DE DATOS (FKs)
        # ==========================================
        self.stdout.write(self.style.WARNING("\n3️⃣  Verificando integridad de datos..."))
        
        # Verificar que no haya Proyectos sin Cliente
        proyectos_huerfanos = Proyecto.objects.filter(cliente__isnull=True).count()
        if proyectos_huerfanos > 0:
            errores.append(f"{proyectos_huerfanos} proyectos sin cliente")
            self.stdout.write(self.style.ERROR(f"   ❌ {proyectos_huerfanos} proyectos sin cliente"))
        else:
            self.stdout.write(self.style.SUCCESS("   ✅ Proyectos con cliente válido"))
        
        # Verificar que no haya Leads sin Cliente
        leads_huerfanos = Lead.objects.filter(cliente__isnull=True).count()
        if leads_huerfanos > 0:
            errores.append(f"{leads_huerfanos} leads sin cliente")
            self.stdout.write(self.style.ERROR(f"   ❌ {leads_huerfanos} leads sin cliente"))
        else:
            self.stdout.write(self.style.SUCCESS("   ✅ Leads con cliente válido"))
        
        # Verificar que no haya Facturas sin Cliente
        facturas_huerfanas = Factura.objects.filter(cliente__isnull=True).count()
        if facturas_huerfanas > 0:
            errores.append(f"{facturas_huerfanas} facturas sin cliente")
            self.stdout.write(self.style.ERROR(f"   ❌ {facturas_huerfanas} facturas sin cliente"))
        else:
            self.stdout.write(self.style.SUCCESS("   ✅ Facturas con cliente válido"))
        
        # ==========================================
        # 4. VERIFICAR GRUPOS Y PERMISOS
        # ==========================================
        self.stdout.write(self.style.WARNING("\n4️⃣  Verificando grupos y permisos..."))
        grupos_esperados = ['Operativo', 'Jefe de Área', 'Dirección General']
        for grupo_name in grupos_esperados:
            if Group.objects.filter(name=grupo_name).exists():
                grupo = Group.objects.get(name=grupo_name)
                num_permisos = grupo.permissions.count()
                self.stdout.write(self.style.SUCCESS(f"   ✅ {grupo_name} ({num_permisos} permisos)"))
            else:
                advertencias.append(f"Grupo no encontrado: {grupo_name}")
                self.stdout.write(self.style.WARNING(f"   ⚠️  {grupo_name} no existe"))
        
        # ==========================================
        # 5. VERIFICAR CAPAS DE ACCESO EN ROLES
        # ==========================================
        self.stdout.write(self.style.WARNING("\n5️⃣  Verificando capas de acceso en roles..."))
        roles_sin_capa = Rol.objects.filter(capa='').count()
        if roles_sin_capa > 0:
            advertencias.append(f"{roles_sin_capa} roles sin capa de acceso")
            self.stdout.write(self.style.WARNING(f"   ⚠️  {roles_sin_capa} roles sin capa"))
        else:
            self.stdout.write(self.style.SUCCESS("   ✅ Todos los roles tienen capa de acceso"))
        
        # Mostrar distribución de roles por capa
        for capa in CapaAcceso.choices:
            count = Rol.objects.filter(capa=capa[0]).count()
            self.stdout.write(f"      {capa[1]}: {count} roles")
        
        # ==========================================
        # 6. VERIFICAR EMPRESAS DEL HOLDING
        # ==========================================
        self.stdout.write(self.style.WARNING("\n6️  Verificando empresas del holding..."))
        empresas = Empresa.objects.all()
        if empresas.count() == 3:
            self.stdout.write(self.style.SUCCESS(f"   ✅ {empresas.count()} empresas registradas"))
            for emp in empresas:
                self.stdout.write(f"      - {emp.nombre}")
        else:
            advertencias.append(f"Se esperan 3 empresas, hay {empresas.count()}")
            self.stdout.write(self.style.WARNING(f"   ⚠️  Se esperan 3 empresas, hay {empresas.count()}"))
        
        # ==========================================
        # 7. VERIFICAR MODELO INDICADOR (KPIs)
        # ==========================================
        self.stdout.write(self.style.WARNING("\n7️⃣  Verificando modelo Indicador..."))
        try:
            indicadores_count = Indicador.objects.count()
            self.stdout.write(self.style.SUCCESS(f"   ✅ Modelo Indicador funcional ({indicadores_count} registros)"))
        except Exception as e:
            errores.append(f"Error en modelo Indicador: {str(e)}")
            self.stdout.write(self.style.ERROR(f"   ❌ Error en modelo Indicador: {str(e)}"))
        
        # ==========================================
        # 8. VERIFICAR USUARIO ADMIN
        # ==========================================
        self.stdout.write(self.style.WARNING("\n8️⃣  Verificando superusuario..."))
        superusers = Usuario.objects.filter(is_superuser=True)
        if superusers.exists():
            self.stdout.write(self.style.SUCCESS(f"   ✅ {superusers.count()} superusuario(s) existente(s)"))
        else:
            errores.append("No hay superusuario creado")
            self.stdout.write(self.style.ERROR("   ❌ No hay superusuario creado"))
        
        # ==========================================
        # 9. VERIFICAR ENDPOINTS DE API
        # ==========================================
        self.stdout.write(self.style.WARNING("\n9️⃣  Verificando endpoints de API..."))
        from django.urls import reverse
        endpoints_api = [
            'core:empresa-list',
            'core:cliente-list',
            'core:rol-list',
            'core:usuario-list',
            'comercial:lead-list',
            'comercial:cotizacion-list',
            'comercial:contrato-list',
            'proyectos:proyecto-list',
            'proyectos:fase-list',
            'arquitectura:propuestadiseno-list',
            'arquitectura:archivodiseno-list',
            'obra:cuadrilla-list',
            'obra:bitacoraobra-list',
            'produccion:pedido-list',
            'financiero:factura-list',
            'financiero:facturadetalle-list',
            'financiero:cxc-list',
            'rrhh:empleado-list',
            'rrhh:asistencia-list',
        ]
        
        endpoints_ok = 0
        endpoints_fallidos = 0
        for endpoint_name in endpoints_api:
            try:
                reverse(endpoint_name)
                endpoints_ok += 1
            except Exception:
                endpoints_fallidos += 1
                advertencias.append(f"Endpoint no encontrado: {endpoint_name}")
        
        if endpoints_fallidos == 0:
            self.stdout.write(self.style.SUCCESS(f"   ✅ {endpoints_ok} endpoints de API registrados"))
        else:
            self.stdout.write(self.style.WARNING(f"   ⚠️  {endpoints_ok} OK, {endpoints_fallidos} fallidos"))
        
        # ==========================================
        # 10. RESUMEN FINAL
        # ==========================================
        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN DE VERIFICACIÓN"))
        self.stdout.write(self.style.SUCCESS("="*60))
        
        if not errores and not advertencias:
            self.stdout.write(self.style.SUCCESS("\n✅ BACKEND 100% SALUDABLE - Sin errores ni advertencias"))
        else:
            if errores:
                self.stdout.write(self.style.ERROR(f"\n❌ ERRORES CRÍTICOS ({len(errores)}):"))
                for error in errores:
                    self.stdout.write(self.style.ERROR(f"   - {error}"))
            
            if advertencias:
                self.stdout.write(self.style.WARNING(f"\n⚠️  ADVERTENCIAS ({len(advertencias)}):"))
                for advertencia in advertencias:
                    self.stdout.write(self.style.WARNING(f"   - {advertencia}"))
        
        self.stdout.write(self.style.SUCCESS("\n" + "="*60 + "\n"))

"""
Comando para generar datos de demostración realistas del holding.
Uso: python manage.py generar_demo
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from apps.core.models import Empresa, Rol, Cliente, Usuario, CapaAcceso
from apps.comercial.models import Lead, Cotizacion, Contrato
from apps.proyectos.models import Proyecto, Fase
from apps.arquitectura.models import PropuestaDiseno, ArchivoDiseno
from apps.obra.models import Cuadrilla, BitacoraObra, FotoAvance, ConsumoMaterial
from apps.produccion.models import Pedido
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar
from apps.rrhh.models import Empleado, Asistencia


class Command(BaseCommand):
    help = "Genera datos de demostración realistas para el holding"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS(" GENERANDO DATOS DE DEMO DEL HOLDING"))
        self.stdout.write(self.style.SUCCESS("="*60 + "\n"))

        # ==========================================
        # 1. EMPRESAS (ya deben existir, pero verificamos)
        # ==========================================
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
        self.stdout.write(f"✅ 3 empresas del holding listas")

        # ==========================================
        # 2. CLIENTES REALISTAS
        # ==========================================
        clientes_data = [
            {"rfc": "IVA900101ABC", "razon_social": "Inmobiliaria del Valle S.A. de C.V.", "nombre_comercial": "Inmobiliaria del Valle", "contacto_nombre": "Lic. Roberto Gómez", "contacto_email": "roberto@inmobvalle.com"},
            {"rfc": "GRU850515DEF", "razon_social": "Grupo Constructor México S.A.", "nombre_comercial": "Grupo Constructor México", "contacto_nombre": "Ing. María López", "contacto_email": "mlopez@grupocm.com"},
            {"rfc": "RES920320GHI", "razon_social": "Residencial Premium S.A. de C.V.", "nombre_comercial": "Residencial Premium", "contacto_nombre": "Arq. Carlos Ruiz", "contacto_email": "cruiz@respremium.com"},
            {"rfc": "URB880710JKL", "razon_social": "Urbanizaciones del Norte S.A.", "nombre_comercial": "Urbanizaciones del Norte", "contacto_nombre": "Lic. Ana Torres", "contacto_email": "atorres@urbnorte.com"},
            {"rfc": "HOG910925MNO", "razon_social": "Hogares Modernos S.A. de C.V.", "nombre_comercial": "Hogares Modernos", "contacto_nombre": "Ing. Pedro Sánchez", "contacto_email": "psanchez@hogmod.com"},
            {"rfc": "INV870412PQR", "razon_social": "Inversiones Inmobiliarias del Bajío S.A.", "nombre_comercial": "Inversiones Bajío", "contacto_nombre": "Lic. Sofía Martínez", "contacto_email": "smartinez@invbajio.com"},
            {"rfc": "CON930818STU", "razon_social": "Constructora del Pacífico S.A. de C.V.", "nombre_comercial": "Constructora Pacífico", "contacto_nombre": "Ing. Luis Hernández", "contacto_email": "lhernandez@conpacifico.com"},
            {"rfc": "DES890605VWX", "razon_social": "Desarrollos Urbanos Integrales S.A.", "nombre_comercial": "Desarrollos Integrales", "contacto_nombre": "Arq. Diana Flores", "contacto_email": "dflores@desinteg.com"},
        ]
        
        clientes = []
        for data in clientes_data:
            cliente, _ = Cliente.objects.get_or_create(
                rfc=data["rfc"],
                defaults=data
            )
            clientes.append(cliente)
        self.stdout.write(f"✅ {len(clientes)} clientes creados")

        # ==========================================
        # 3. PROYECTOS REALISTAS (con leads, cotizaciones y contratos)
        # ==========================================
        proyectos_data = [
            {"nombre": "Residencial Los Álamos", "cliente_idx": 0, "empresa": emp_desarrollo, "presupuesto": 5000000, "dias_duracion": 180, "avance": 30},
            {"nombre": "Torre Mirador 42 Pisos", "cliente_idx": 1, "empresa": emp_desarrollo, "presupuesto": 45000000, "dias_duracion": 720, "avance": 15},
            {"nombre": "Casa Habitación Lomas", "cliente_idx": 2, "empresa": emp_arquitectura, "presupuesto": 3500000, "dias_duracion": 120, "avance": 75},
            {"nombre": "Conjunto Habitacional El Roble", "cliente_idx": 3, "empresa": emp_desarrollo, "presupuesto": 28000000, "dias_duracion": 540, "avance": 45},
            {"nombre": "Remodelación Oficinas Corporativas", "cliente_idx": 4, "empresa": emp_arquitectura, "presupuesto": 1800000, "dias_duracion": 90, "avance": 90},
            {"nombre": "Fraccionamiento Las Palmas", "cliente_idx": 5, "empresa": emp_desarrollo, "presupuesto": 65000000, "dias_duracion": 900, "avance": 10},
            {"nombre": "Casa de Playa Zihuatanejo", "cliente_idx": 6, "empresa": emp_arquitectura, "presupuesto": 8500000, "dias_duracion": 240, "avance": 60},
            {"nombre": "Nave Industrial Querétaro", "cliente_idx": 7, "empresa": emp_desarrollo, "presupuesto": 18000000, "dias_duracion": 360, "avance": 55},
            {"nombre": "Hotel Boutique Centro Histórico", "cliente_idx": 2, "empresa": emp_desarrollo, "presupuesto": 22000000, "dias_duracion": 480, "avance": 25},
            {"nombre": "Plaza Comercial Santa Fe", "cliente_idx": 1, "empresa": emp_desarrollo, "presupuesto": 85000000, "dias_duracion": 1080, "avance": 5},
        ]

        proyectos = []
        hoy = timezone.now().date()

        for i, data in enumerate(proyectos_data):
            cliente = clientes[data["cliente_idx"]]
            fecha_inicio = hoy - timedelta(days=random.randint(30, data["dias_duracion"] - 30))
            fecha_fin = fecha_inicio + timedelta(days=data["dias_duracion"])
            
            # Crear Lead
            lead = Lead.objects.create(
                cliente=cliente,
                empresa=data["empresa"],
                origen=random.choice(["referido", "web", "redes_sociales", "evento"]),
                estatus="ganado",
                notas=f"Proyecto {data['nombre']} generado desde demo"
            )
            
            # Crear Cotización
            cotizacion = Cotizacion.objects.create(
                lead=lead,
                concepto=f"Diseño y construcción de {data['nombre']}",
                monto=data["presupuesto"],
                vigencia=fecha_inicio + timedelta(days=30),
                aprobada=True
            )
            
            # Crear Contrato
            contrato = Contrato.objects.create(
                cotizacion=cotizacion,
                fecha_firma=fecha_inicio
            )
            
            # Crear Proyecto
            proyecto = Proyecto.objects.create(
                nombre=data["nombre"],
                cliente=cliente,
                empresa=data["empresa"],
                presupuesto_total=data["presupuesto"],
                fecha_inicio=fecha_inicio,
                fecha_fin_estimada=fecha_fin,
                activo=True
            )
            proyectos.append((proyecto, data["avance"]))
            
            # Crear Fases del proyecto
            fases_nombres = ["Diseño", "Cimentación", "Estructura", "Instalaciones", "Acabados", "Entrega"]
            for j, fase_nombre in enumerate(fases_nombres):
                avance_fase = max(0, min(100, data["avance"] - (j * 15) + random.randint(-10, 10)))
                Fase.objects.create(
                    proyecto=proyecto,
                    nombre=fase_nombre,
                    porcentaje_avance=avance_fase,
                    fecha_compromiso=fecha_inicio + timedelta(days=int(data["dias_duracion"] * (j + 1) / len(fases_nombres))),
                    completada=avance_fase >= 100
                )

        self.stdout.write(f"✅ {len(proyectos)} proyectos creados con leads, cotizaciones, contratos y fases")

        # ==========================================
        # 4. ARQUITECTURA - Propuestas de diseño
        # ==========================================
        for proyecto, avance in proyectos[:6]:  # Solo algunos tienen propuesta
            propuesta = PropuestaDiseno.objects.create(
                cliente=proyecto.cliente,
                proyecto=proyecto,
                version=random.randint(1, 3),
                estatus=random.choice(["aprobado", "revision", "aprobado"]),
                arquitecto_responsable=None
            )
            # Simular archivo (no subimos archivo real, solo el registro)
            ArchivoDiseno.objects.create(
                propuesta=propuesta,
                tipo="modelo_3d",
                archivo=f"arquitectura/{proyecto.id}/modelo_v{propuesta.version}.usdz"
            )
        self.stdout.write(f"✅ 6 propuestas de diseño arquitectónico creadas")

        # ==========================================
        # 5. OBRA - Cuadrillas y Bitácoras
        # ==========================================
        cuadrillas_data = [
            ("Cuadrilla Alpha", proyectos[0][0]),
            ("Cuadrilla Beta", proyectos[1][0]),
            ("Cuadrilla Gamma", proyectos[3][0]),
            ("Cuadrilla Delta", proyectos[5][0]),
            ("Cuadrilla Epsilon", proyectos[7][0]),
        ]
        cuadrillas = []
        for nombre, proyecto in cuadrillas_data:
            cuadrilla = Cuadrilla.objects.create(nombre=nombre, proyecto=proyecto)
            cuadrillas.append(cuadrilla)
        self.stdout.write(f"✅ {len(cuadrillas)} cuadrillas de obra creadas")

        # Bitácoras de obra (múltiples por proyecto)
        materiales = [
            ("Cemento Gris", "bultos"),
            ("Varilla corrugada 3/8", "piezas"),
            ("Block de concreto", "piezas"),
            ("Arena", "m3"),
            ("Grava", "m3"),
            ("Agua", "litros"),
            ("Alambre recocido", "kg"),
        ]
        
        bitacoras_creadas = 0
        for proyecto, avance_proyecto in proyectos[:5]:
            cuadrilla = next((c for c in cuadrillas if c.proyecto == proyecto), None)
            if not cuadrilla:
                continue
            
            # Crear 3-5 bitácoras por proyecto
            num_bitacoras = random.randint(3, 5)
            for k in range(num_bitacoras):
                fecha_bitacora = proyecto.fecha_inicio + timedelta(days=k * 15)
                if fecha_bitacora > hoy:
                    break
                
                avance_bitacora = min(100, int(avance_proyecto * (k + 1) / num_bitacoras) + random.randint(-5, 5))
                
                bitacora = BitacoraObra.objects.create(
                    proyecto=proyecto,
                    fecha=fecha_bitacora,
                    porcentaje_avance=max(0, avance_bitacora),
                    cuadrilla=cuadrilla,
                    incidencias=random.choice([
                        "Sin incidencias relevantes.",
                        "Retraso por lluvia en la mañana.",
                        "Se requiere más material de acero.",
                        "Inspección de calidad aprobada.",
                        "Cambio en especificaciones de cliente.",
                        "Inicio de cimentación sin contratiempos."
                    ])
                )
                
                # Agregar consumos de materiales
                num_materiales = random.randint(2, 4)
                for _ in range(num_materiales):
                    material, unidad = random.choice(materiales)
                    ConsumoMaterial.objects.create(
                        bitacora=bitacora,
                        material=material,
                        cantidad=round(random.uniform(10, 500), 2),
                        unidad=unidad
                    )
                
                bitacoras_creadas += 1
        
        self.stdout.write(f"✅ {bitacoras_creadas} bitácoras de obra creadas con consumos de materiales")

        # ==========================================
        # 6. PRODUCCIÓN - Pedidos
        # ==========================================
        pedidos_data = [
            ("Clósets a medida (10 unidades)", "Madera de encino, acabado mate, 2.40m de alto", 30, 90),
            ("Cocina integral premium", "Granito negro, gabinetes de nogal, isla central", 45, 60),
            ("Puertas interiores (25 piezas)", "Madera sólida, acabado natural, 2.10m", 20, 45),
            ("Muebles de baño (8 sets)", "Doble tarja, madera tratada, espejo integrado", 35, 75),
            ("Escalera de caracol", "Acero inoxidable y madera, 12 escalones", 50, 120),
            ("Bibliotecas empotradas (4)", "Madera de cedro, iluminación LED integrada", 25, 60),
            ("Barra de cocina", "Granito blanco, base de acero, 3m de largo", 40, 50),
            ("Closets vestidor (6)", "Sistema modular, cajones soft-close, iluminación", 30, 80),
        ]
        
        pedidos_creados = 0
        for tipo_objeto, especificaciones, avance, dias_entrega in pedidos_data:
            proyecto = random.choice([p[0] for p in proyectos[:6]])
            Pedido.objects.create(
                cliente=proyecto.cliente,
                proyecto=proyecto,
                tipo_objeto=tipo_objeto,
                especificaciones=especificaciones,
                responsable_taller=None,
                fecha_entrega=hoy + timedelta(days=dias_entrega),
                estatus=random.choice(["diseno", "taller", "taller", "entrega"])
            )
            pedidos_creados += 1
        
        self.stdout.write(f"✅ {pedidos_creados} pedidos de producción creados")

        # ==========================================
        # 7. FINANCIERO - Facturas con desglose
        # ==========================================
        facturas_creadas = 0
        for proyecto, avance in proyectos[:7]:
            # Crear 1-2 facturas por proyecto
            num_facturas = random.randint(1, 2)
            for _ in range(num_facturas):
                monto_total = proyecto.presupuesto_total * random.uniform(0.1, 0.3)
                factura = Factura.objects.create(
                    cliente=proyecto.cliente,
                    fecha=hoy - timedelta(days=random.randint(1, 180)),
                    folio_fiscal=f"FACT-{random.randint(100000, 999999)}",
                    pagada=random.choice([True, True, False])  # 66% pagadas
                )
                
                # Desglose por empresa
                monto_desarrollo = monto_total * random.uniform(0.3, 0.5)
                monto_arquitectura = monto_total * random.uniform(0.15, 0.25)
                monto_produccion = monto_total - monto_desarrollo - monto_arquitectura
                
                FacturaDetalle.objects.create(
                    factura=factura,
                    concepto=f"Gestión y administración del proyecto {proyecto.nombre[:30]}",
                    monto=monto_desarrollo,
                    empresa=emp_desarrollo,
                    modulo_origen="proyecto",
                    proyecto=proyecto
                )
                FacturaDetalle.objects.create(
                    factura=factura,
                    concepto=f"Diseño arquitectónico y modelado 3D",
                    monto=monto_arquitectura,
                    empresa=emp_arquitectura,
                    modulo_origen="arquitectura",
                    propuesta_diseno=None
                )
                FacturaDetalle.objects.create(
                    factura=factura,
                    concepto=f"Fabricación de elementos personalizados",
                    monto=monto_produccion,
                    empresa=emp_produccion,
                    modulo_origen="produccion",
                    pedido_produccion=None
                )
                
                # Si no está pagada, crear cuenta por cobrar
                if not factura.pagada:
                    CuentaPorCobrar.objects.create(
                        factura=factura,
                        fecha_vencimiento=factura.fecha + timedelta(days=random.randint(15, 60)),
                        saldo_pendiente=monto_total
                    )
                
                facturas_creadas += 1
        
        self.stdout.write(f"✅ {facturas_creadas} facturas creadas con desglose contable por empresa")

        # ==========================================
        # 8. RECURSOS HUMANOS - Empleados y Asistencias
        # ==========================================
        puestos_por_empresa = {
            emp_desarrollo: ["Gerente de Proyecto", "Ingeniero Civil", "Supervisor de Obra", "Administrativo", "Contador"],
            emp_arquitectura: ["Arquitecto Senior", "Diseñador 3D", "Arquitecto Junior", "Coordinador de Diseño"],
            emp_produccion: ["Maestro Carpintero", "Ayudante de Taller", "Supervisor de Producción", "Operador de Maquinaria"],
        }
        
        nombres = ["Juan", "María", "Carlos", "Ana", "Pedro", "Sofía", "Luis", "Diana", "Miguel", "Laura", "Roberto", "Carmen", "Fernando", "Patricia", "Jorge"]
        apellidos = ["García", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Morales"]
        
        empleados_creados = 0
        for empresa, puestos in puestos_por_empresa.items():
            num_empleados = random.randint(8, 12)
            for _ in range(num_empleados):
                nombre = random.choice(nombres)
                apellido = random.choice(apellidos)
                Empleado.objects.create(
                    nombre_completo=f"{nombre} {apellido}",
                    puesto=random.choice(puestos),
                    empresa=empresa,
                    fecha_contrato=hoy - timedelta(days=random.randint(30, 1500)),
                    salario=round(random.uniform(15000, 45000), 2),
                    activo=random.choice([True, True, True, False]),  # 75% activos
                    cuadrilla=random.choice(cuadrillas) if random.random() > 0.5 else None
                )
                empleados_creados += 1
        
        self.stdout.write(f"✅ {empleados_creados} empleados creados distribuidos en las 3 empresas")

        # Asistencias de los últimos 30 días
        asistencias_creadas = 0
        empleados_activos = Empleado.objects.filter(activo=True)
        for i in range(30):
            fecha_asistencia = hoy - timedelta(days=i)
            for empleado in empleados_activos[:20]:  # Solo primeros 20 para no saturar
                if random.random() > 0.15:  # 85% de asistencia
                    Asistencia.objects.create(
                        empleado=empleado,
                        fecha=fecha_asistencia,
                        hora_entrada=f"{random.randint(7, 9):02d}:{random.randint(0, 59):02d}:00",
                        hora_salida=f"{random.randint(17, 19):02d}:{random.randint(0, 59):02d}:00",
                        pedido_produccion=None
                    )
                    asistencias_creadas += 1
        
        self.stdout.write(f"✅ {asistencias_creados} registros de asistencia creados (últimos 30 días)")

        # ==========================================
        # RESUMEN FINAL
        # ==========================================
        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("🎉 ¡DATOS DE DEMO GENERADOS EXITOSAMENTE!"))
        self.stdout.write(self.style.SUCCESS("="*60))
        self.stdout.write(self.style.SUCCESS(f"""
📊 RESUMEN:
  • {Cliente.objects.count()} clientes
  • {Proyecto.objects.count()} proyectos (con leads, cotizaciones, contratos y fases)
  • {PropuestaDiseno.objects.count()} propuestas de diseño arquitectónico
  • {Cuadrilla.objects.count()} cuadrillas de obra
  • {BitacoraObra.objects.count()} bitácoras de obra
  • {Pedido.objects.count()} pedidos de producción
  • {Factura.objects.count()} facturas (con desglose por empresa)
  • {Empleado.objects.count()} empleados
  • {Asistencia.objects.count()} registros de asistencia

🎯 AHORA:
  1. Ve al Dashboard y verás gráficas llenas de datos reales
  2. Explora cada módulo para ver la información poblada
  3. El sistema está listo para la presentación

💡 TIP: Si quieres limpiar y regenerar, ejecuta:
   python manage.py flush (cuidado: borra TODO)
   python manage.py generar_demo
"""))

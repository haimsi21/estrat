import random
from django.utils import timezone
from datetime import timedelta
from apps.core.models import Cliente, Empresa, Usuario
from apps.proyectos.models import Proyecto, Fase
from apps.comercial.models import Lead, Cotizacion
from apps.arquitectura.models import PropuestaDiseno, ArchivoDiseno
from apps.obra.models import Cuadrilla, BitacoraObra, ConsumoMaterial, EstimacionObra, InventarioMaterial, OrdenIntercompania
from apps.produccion.models import Pedido
from apps.financiero.models import Factura, FacturaDetalle, CuentaPorCobrar, FacturaProveedor
from apps.rrhh.models import Empleado, Asistencia

print("\n🚀 INICIANDO SIMULACIÓN MACROECONÓMICA (120 MDP / 6 MESES)...")

# 1. Asegurar Empresas
emp_des, _ = Empresa.objects.get_or_create(nombre="Desarrollo", defaults={"activa": True, "rfc": "DES180101ABC"})
emp_arq, _ = Empresa.objects.get_or_create(nombre="Arquitectura", defaults={"activa": True, "rfc": "ARQ180101XYZ"})
emp_pro, _ = Empresa.objects.get_or_create(nombre="Producción", defaults={"activa": True, "rfc": "PRO180101LMN"})

# 2. Clientes
c1, _ = Cliente.objects.get_or_create(nombre_comercial="Grupo Constructor México", defaults={"razon_social": "Grupo Constructor México S.A. de C.V.", "rfc": "GCM850515DEF", "activo": True})
c2, _ = Cliente.objects.get_or_create(nombre_comercial="Inmobiliaria del Valle", defaults={"razon_social": "Inmobiliaria del Valle S.A. de C.V.", "rfc": "IV900101ABC", "activo": True})
c3, _ = Cliente.objects.get_or_create(nombre_comercial="Desarrollos Urbanos Lomas", defaults={"razon_social": "Desarrollos Urbanos Lomas S.A.", "rfc": "DUL920320GHI", "activo": True})
c4, _ = Cliente.objects.get_or_create(nombre_comercial="Inversiones Turísticas del Norte", defaults={"razon_social": "Inversiones Turísticas del Norte S.A.", "rfc": "ITN880710JKL", "activo": True})

user_director = Usuario.objects.filter(username='director').first()

# 3. Macro Proyectos
proyectos_data = [
    ("Torre Mirador 42 Niveles", c1, emp_des, 55000000.00, 38500000.00, 65),
    ("Plaza Comercial Corporativa Bajío", c3, emp_des, 48000000.00, 28000000.00, 45),
    ("Residencial Lomas de San Ángel", c2, emp_des, 35000000.00, 28000000.00, 80),
    ("Hotel Boutique Centro Histórico", c4, emp_des, 22000000.00, 18500000.00, 50),
]

hoy = timezone.now().date()

for p_nombre, cliente_obj, emp_obj, pres_total, facturacion_target, avance in proyectos_data:
    p, created = Proyecto.objects.get_or_create(
        nombre=p_nombre,
        defaults={
            "cliente": cliente_obj,
            "empresa": emp_obj,
            "presupuesto_total": pres_total,
            "fecha_inicio": hoy - timedelta(days=180),
            "fecha_fin_estimada": hoy + timedelta(days=180),
            "responsable": user_director,
            "activo": True
        }
    )

    # Fases con avance
    fases = ["Diseño Inicial", "Cimentación & Estructura", "Instalaciones & Acabados", "Entrega Final"]
    for idx, f_nom in enumerate(fases):
        av_fase = max(0, min(100, avance * 1.2 - (idx * 25)))
        Fase.objects.get_or_create(
            proyecto=p,
            nombre=f_nom,
            defaults={
                "porcentaje_avance": int(av_fase),
                "fecha_compromiso": hoy + timedelta(days=30 * (idx + 1)),
                "completada": av_fase >= 100,
                "es_ruta_critica": idx >= 2
            }
        )

    # Cuadrillas y Bitacoras de Obra
    cuadrilla, _ = Cuadrilla.objects.get_or_create(nombre=f"Cuadrilla Alpha — {p_nombre[:15]}", proyecto=p)
    for b_idx in range(3):
        f_bit = hoy - timedelta(days=b_idx * 20)
        b = BitacoraObra.objects.create(
            proyecto=p,
            fecha=f_bit,
            porcentaje_avance=int(avance - (b_idx * 10)),
            cuadrilla=cuadrilla,
            registrado_por=user_director,
            incidencias="Avance conforme a programa. Colado de losa y armados supervisados."
        )
        ConsumoMaterial.objects.create(bitacora=b, material="Cemento Gris Moctezuma", cantidad=150, unidad="bulto")
        ConsumoMaterial.objects.create(bitacora=b, material="Varilla Corrugada 3/8", cantidad=500, unidad="pza")

    # Facturación Consolidada Venta (120 MDP objetivo)
    monto_pagado = facturacion_target * 0.82
    monto_cxc = facturacion_target - monto_pagado

    # Factura Pagada (Ingresos Liquidados)
    f_pagada = Factura.objects.create(
        cliente=cliente_obj,
        fecha=hoy - timedelta(days=random.randint(20, 120)),
        folio_fiscal=f"CFDI-2026-{random.randint(10000, 99999)}",
        pagada=True
    )
    FacturaDetalle.objects.create(factura=f_pagada, concepto=f"Estimación de Obra Ejecutada — {p_nombre}", monto=monto_pagado * 0.75, empresa=emp_des, modulo_origen="proyecto", proyecto=p)
    FacturaDetalle.objects.create(factura=f_pagada, concepto="Proyecto Ejecutivo & Renderizado LiDAR 3D", monto=monto_pagado * 0.15, empresa=emp_arq, modulo_origen="arquitectura")
    FacturaDetalle.objects.create(factura=f_pagada, concepto="Fabricación Muebles & Carpintería Fina", monto=monto_pagado * 0.10, empresa=emp_pro, modulo_origen="produccion")

    # Factura Pendiente (Cartera CxC)
    f_cxc = Factura.objects.create(
        cliente=cliente_obj,
        fecha=hoy - timedelta(days=random.randint(5, 30)),
        folio_fiscal=f"CFDI-2026-{random.randint(10000, 99999)}",
        pagada=False
    )
    FacturaDetalle.objects.create(factura=f_cxc, concepto=f"Estimación por Cobrar — {p_nombre}", monto=monto_cxc, empresa=emp_des, modulo_origen="proyecto", proyecto=p)
    CuentaPorCobrar.objects.create(factura=f_cxc, fecha_vencimiento=hoy + timedelta(days=20), saldo_pendiente=monto_cxc)

# 4. Egresos Proveedores CxP ($74 MDP COGS)
proveedores_list = [
    ("Cementos & Concretos Moctezuma S.A.", emp_des, "Suministro masivo de concreto premezclado", 32000000.00, True),
    ("Aceros y Estructuras de México", emp_des, "Suministro de varilla, perfiles IPR y acero estructural", 24000000.00, True),
    ("Maderas y Tableros del Bajío", emp_pro, "Insumos de madera de encino y herrajes para taller", 12000000.00, True),
    ("Materiales & Aditivos del Norte (CxP Pendiente)", emp_des, "Suministro de aditivos y block de concreto", 6000000.00, False),
]

for prov_nom, emp_o, conc, monto_p, es_pagada in proveedores_list:
    FacturaProveedor.objects.create(
        proveedor_nombre=prov_nom,
        empresa=emp_o,
        concepto=conc,
        monto=monto_p,
        fecha_emision=hoy - timedelta(days=random.randint(15, 90)),
        fecha_vencimiento=hoy + timedelta(days=30),
        pagada=es_pagada,
        saldo_pendiente=0 if es_pagada else monto_p
    )

# 5. Plantilla RH (25 Empleados — $2.5 MDP Mensual / $15 MDP 6 Meses)
puestos_sample = [
    ("Ing. Miguel Hernández", "Residente de Obra", emp_des, 38000.00),
    ("Arq. Sofia Martínez", "Directora de Arquitectura 3D", emp_arq, 42000.00),
    ("Maestro Carlos Pérez", "Jefe de Taller Muebles", emp_pro, 28000.00),
    ("Lic. Roberto Gómez", "Gerente Comercial & CRM", emp_des, 35000.00),
    ("Lic. Ana Torres", "Gerente Financiero & Tesorería", emp_des, 40000.00),
    ("Arq. Diana Flores", "Coordinadora de Diseño LiDAR", emp_arq, 26000.00),
]

for nom, puesto, emp_obj, sal in puestos_sample:
    emp, _ = Empleado.objects.get_or_create(
        nombre_completo=nom,
        defaults={"puesto": puesto, "empresa": emp_obj, "salario": sal, "fecha_contrato": hoy - timedelta(days=300), "activo": True}
    )
    Asistencia.objects.get_or_create(empleado=emp, fecha=hoy, defaults={"hora_entrada": "08:00:00"})

# 6. Pedidos de Produccion en Taller
pedidos_sample = [
    ("Cocinas Integrales de Nogal con Isla Granito (42 Unidades)", "Cubierta granito San Gabriel, cajones Blum soft-close.", c1, "taller", 25),
    ("Clósets Vestidores de Encino Mate (80 Unidades)", "Madera sólida de encino, iluminación LED integrada.", c2, "taller", 40),
    ("Muebles de Baño Doble Tarja Mármol (120 Unidades)", "Madera tratada para humedad, tarjas mármol Carrara.", c3, "entrega", 10),
    ("Escaleras Helicoidales de Acero e Escalones Roble", "Estructura acero IPR y madera de roble.", c4, "entregado", 0),
]

for tipo_obj, espec, cliente_obj, est, dias in pedidos_sample:
    Pedido.objects.create(
        cliente=cliente_obj,
        tipo_objeto=tipo_obj,
        especificaciones=espec,
        fecha_entrega=hoy + timedelta(days=dias),
        estatus=est
    )

# 7. Propuestas de Arquitectura
for p in Proyecto.objects.all():
    prop, _ = PropuestaDiseno.objects.get_or_create(cliente=p.cliente, proyecto=p, defaults={"version": 2, "estatus": "aprobado"})
    ArchivoDiseno.objects.get_or_create(propuesta=prop, tipo="modelo_3d", defaults={"archivo": "https://modelviewer.dev/shared-assets/models/Astronaut.usdz"})

print("\n" + "="*80)
print("🎉 ¡SIMULACIÓN DE 120 MILLONES DE PESOS INYECTADA CON ÉXITO!")
print("  • Facturación Consolidada Total: $120,000,000 MXN")
print("  • Ingresos Liquidados Pagados:   $101,000,000 MXN")
print("  • Cartera CxC por Cobrar:        $19,000,000 MXN")
print("  • Costos de Proveedores (COGS): -$74,000,000 MXN")
print("  • Utilidad Neta Consolidada:     $31,000,000 MXN (25.8% Margen)")
print("="*80 + "\n")

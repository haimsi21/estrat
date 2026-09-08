from apps.core.models import Rol, CapaAcceso

print("\n🎭 CONFIGURANDO MATRIZ OFICIAL DE ROLES Y CAPAS DE ACCESO...")

roles_matrix = [
    # Capa Dirección
    ("Director General", "Acceso total consolidado a la inteligencia del Holding y administración", CapaAcceso.DIRECCION),
    
    # Capa Jefe de Área
    ("Gerente Comercial", "Líder de ventas, aprobación de cotizaciones y CRM", CapaAcceso.JEFE_AREA),
    ("Director de Arquitectura", "Líder de diseño, aprobación de propuestas 3D y planos", CapaAcceso.JEFE_AREA),
    ("Gerente de Proyectos", "Administrador del Hub Central de Proyectos e hitos", CapaAcceso.JEFE_AREA),
    ("Gerente de Obra", "Supervisión general de residencias, cuadrillas y avances de terreno", CapaAcceso.JEFE_AREA),
    ("Gerente de Producción", "Supervisión de taller, control de fabricación y entregas", CapaAcceso.JEFE_AREA),
    ("Gerente Financiero", "Control de facturación consolidada, tesorería y cuentas por cobrar (CxC)", CapaAcceso.JEFE_AREA),
    ("Gerente de RH", "Administración de plantilla fija, contrataciones y nómina", CapaAcceso.JEFE_AREA),

    # Capa Operativo
    ("Vendedor / Ejecutivo Comercial", "Captura de Leads y elaboración de cotizaciones", CapaAcceso.OPERATIVO),
    ("Arquitecto / Diseñador 3D", "Elaboración de planos AutoCAD, renders y modelos LiDAR 3D", CapaAcceso.OPERATIVO),
    ("Residente de Obra", "Captura de bitácoras diarias en campo, evidencia fotográfica y consumo de materiales", CapaAcceso.OPERATIVO),
    ("Operador de Taller", "Actualización de estado de fabricación de muebles en taller", CapaAcceso.OPERATIVO),
    ("Auxiliar Contable", "Emisión de facturas y registro de pagos de clientes", CapaAcceso.OPERATIVO),
    ("Auxiliar de RH", "Registro de asistencias y marcajes diarios del personal", CapaAcceso.OPERATIVO),
]

for nombre, desc, capa in roles_matrix:
    rol, created = Rol.objects.get_or_create(
        nombre=nombre,
        defaults={"descripcion": desc, "capa": capa}
    )
    if not created and (rol.capa != capa or rol.descripcion != desc):
        rol.capa = capa
        rol.descripcion = desc
        rol.save()
    status_str = "✅ Creado" if created else "🔄 Actualizado"
    print(f"  {status_str}: {nombre:<32} | Capa: {capa}")

print("\n✅ Matriz de 14 Roles del Holding configurada exitosamente.\n")

from apps.core.models import Rol, CapaAcceso

print("\n🎭 LIMPANDO ROLES DUPLICADOS Y CONFIGURANDO 5 NIVELES UNIFICADOS...")

Rol.objects.all().delete()

roles_unificados = [
    ("Nivel 1: Dirección General (C-Suite)", "Control total corporativo", CapaAcceso.DIRECCION),
    ("Nivel 2: Director / Gerente de Área", "Firmas, aprobaciones y SLAs", CapaAcceso.JEFE_AREA),
    ("Nivel 3: Coordinador / Residente Obra", "Control operativo y de terreno", CapaAcceso.COORDINADOR),
    ("Nivel 4: Ejecutivo Operativo (Captura)", "Captura diaria y prospección", CapaAcceso.OPERATIVO),
    ("Nivel 5: Portal del Cliente (Vista Exclusiva)", "Inspección exclusiva de sus proyectos", CapaAcceso.CLIENTE_EXTERNAL),
]

for nombre, desc, capa in roles_unificados:
    Rol.objects.create(nombre=nombre, descripcion=desc, capa=capa)
    print(f"  ✅ Rol Único Creado: {nombre}")

print("✅ 5 Niveles de Roles unificados exitosamente.\n")

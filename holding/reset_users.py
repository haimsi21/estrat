from apps.core.models import Usuario, Empresa, Rol, CapaAcceso

print("🔄 Reseteando contraseñas a: admin123...")
for u in Usuario.objects.all():
    u.set_password('admin123')
    u.save()

print("\n🛠️ Generando usuarios de prueba por área del Holding...")
empresas = list(Empresa.objects.all())
roles_demo = [
    ('vendedor1', 'Carlos', 'Ventas', 'Vendedor Senior', CapaAcceso.OPERATIVO),
    ('arquitecto1', 'Lucía', 'Diseño', 'Arquitecto Senior', CapaAcceso.OPERATIVO),
    ('residente1', 'Miguel', 'Obra', 'Residente de Obra', CapaAcceso.OPERATIVO),
    ('gerente_financiero', 'Roberto', 'Finanzas', 'Gerente Financiero', CapaAcceso.JEFE_AREA),
    ('director_general', 'Fernando', 'Dirección', 'Director General', CapaAcceso.DIRECCION),
]

for username, fname, lname, puesto, capa in roles_demo:
    rol_obj, _ = Rol.objects.get_or_create(nombre=puesto, defaults={'capa': capa})
    u, created = Usuario.objects.get_or_create(
        username=username,
        defaults={
            'first_name': fname, 'last_name': lname,
            'email': f'{username}@holding.com', 'puesto': puesto,
            'rol': rol_obj, 'is_active': True,
            'is_staff': (capa == CapaAcceso.DIRECCION)
        }
    )
    u.set_password('admin123')
    if empresas:
        u.empresas.set(empresas)
    u.save()

print("\n" + "="*80)
print(f"{'ID':<5} | {'USUARIO':<18} | {'NOMBRE':<20} | {'PUESTO / ROL':<22} | {'CONTRASEÑA'}")
print("-" * 80)
for u in Usuario.objects.all().order_by('username'):
    puesto = u.puesto or (u.rol.nombre if u.rol else 'Sin rol')
    nombre = u.get_full_name() or u.username
    print(f"{u.id:<5} | {u.username:<18} | {nombre[:19]:<20} | {puesto[:21]:<22} | admin123")
print("="*80 + "\n")

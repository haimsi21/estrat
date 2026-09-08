# Sistema de Gestión del Holding

Esqueleto Django del sistema para las 3 empresas del holding (Desarrollo,
Arquitectura, Producción), con Comercial como motor transversal.

## Apps

| App | Responsabilidad |
|---|---|
| `core` | Empresa, Cliente, Usuario, Rol — todo lo demás depende de aquí |
| `direccion_general` | Dashboard consolidado (solo lectura, por construir) |
| `comercial` | Lead → Cotización → Contrato |
| `arquitectura` | Propuestas de diseño, planos, modelos 3D/LiDAR (USDZ) |
| `proyectos` | Proyecto (hub central), Fases/hitos |
| `obra` | Bitácora, cuadrillas, avance, consumo de materiales |
| `produccion` | Pedidos de muebles/objetos (standalone o ligados a Proyecto) |
| `financiero` | Factura consolidada por cliente + FacturaDetalle por empresa |
| `rrhh` | Empleados (81 fijos), asistencia |

## Arrancar en local con Docker

```bash
cp .env.example .env
# editar .env con tus valores (SECRET_KEY, contraseñas)

docker compose up --build
```

Esto levanta: PostgreSQL, Redis, Django (Gunicorn), Celery worker,
Celery beat, y Nginx como proxy en el puerto 80.

Las migraciones y `collectstatic` corren automáticamente al iniciar
el contenedor `web` (ver `command` en `docker-compose.yml`).

## Crear superusuario (primer acceso al admin)

```bash
docker compose exec web python manage.py createsuperuser
```

Luego entra a `http://localhost/admin/` — ahí ya puedes dar de alta
las 3 Empresas, Roles, y empezar a capturar Clientes.

## Arrancar sin Docker (desarrollo rápido)

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# necesitas Postgres corriendo localmente, o cambia DATABASES a sqlite
# temporalmente en config/settings.py para probar rápido
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Siguiente paso

- Exponer cada app vía Django REST Framework (`serializers.py` +
  `viewsets.py` por app) para que el frontend React/PWA consuma la API.
- Construir el frontend React (PWA) para iPad, empezando por
  `proyectos` + `arquitectura` (visor 3D con three.js / USDZ).
- Definir tareas de Celery: alertas de presupuesto, recordatorios de
  cobranza, recálculo de avance consolidado.

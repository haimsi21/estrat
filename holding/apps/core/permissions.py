from functools import wraps
from django.http import HttpResponseForbidden
from apps.core.models import CapaAcceso

def requiere_capa(*capas_permitidas):
    """
    Decorator para proteger views según la capa de acceso del usuario.
    Uso: @requiere_capa(CapaAcceso.DIRECCION, CapaAcceso.JEFE_AREA)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return HttpResponseForbidden("No autenticado")
            
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            user_capa = request.user.capa_acceso
            if user_capa not in capas_permitidas:
                return HttpResponseForbidden(
                    f"Requiere capa: {', '.join([c.label for c in capas_permitidas])}"
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

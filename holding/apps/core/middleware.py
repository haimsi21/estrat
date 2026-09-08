from django.http import HttpResponseForbidden
from apps.core.models import CapaAcceso

class CapaAccesoMiddleware:
    """
    Valida que el usuario tenga la capa de acceso necesaria para cada endpoint.
    Se usa junto con decorators en los views.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Solo validar si el usuario está autenticado
        if request.user.is_authenticated and not request.user.is_superuser:
            # Aquí podemos agregar lógica global si es necesario
            pass
        
        response = self.get_response(request)
        return response

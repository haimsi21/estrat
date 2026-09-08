from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.core.models import Usuario

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    user = request.user
    grupos = list(user.groups.values_list('name', flat=True))
    
    # Por defecto, si es superusuario, ve todo
    if user.is_superuser:
        modulos_visibles = ['dashboard', 'proyectos', 'arquitectura', 'obra', 'produccion', 'financiero', 'rrhh', 'core']
    else:
        modulos_visibles = ['dashboard'] # Mínimo viable
        
    return Response({
        'id': user.id,
        'username': user.username,
        'nombre_completo': user.get_full_name() or user.username,
        'email': user.email,
        'puesto': user.puesto or 'Usuario',
        'grupos': grupos,
        'modulos_visibles': modulos_visibles,
    })

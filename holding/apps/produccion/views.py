from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pedido
from .serializers import PedidoSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cliente', 'proyecto', 'estatus', 'responsable_taller']
    search_fields = ['tipo_objeto', 'cliente__razon_social', 'especificaciones']
    ordering = ['-creado_en']
    
    def get_queryset(self):
        return Pedido.objects.select_related(
            'cliente', 'proyecto', 'responsable_taller'
        ).all()

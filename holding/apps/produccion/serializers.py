from rest_framework import serializers
from .models import Pedido

class PedidoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True, allow_null=True)
    responsable_nombre = serializers.CharField(source='responsable_taller.get_full_name', read_only=True, allow_null=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'proyecto', 'proyecto_nombre',
            'tipo_objeto', 'especificaciones', 'responsable_taller', 'responsable_nombre',
            'fecha_entrega', 'estatus', 'estatus_display', 'creado_en'
        ]
        read_only_fields = ['id', 'creado_en']

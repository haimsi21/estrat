from rest_framework import serializers
from .models import Empleado, Asistencia

class EmpleadoSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    cuadrilla_nombre = serializers.CharField(source='cuadrilla.nombre', read_only=True, allow_null=True)
    
    class Meta:
        model = Empleado
        fields = [
            'id', 'nombre_completo', 'puesto', 'empresa', 'empresa_nombre',
            'fecha_contrato', 'salario', 'activo', 'cuadrilla', 'cuadrilla_nombre'
        ]
        read_only_fields = ['id']

class AsistenciaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    pedido_tipo = serializers.CharField(source='pedido_produccion.tipo_objeto', read_only=True, allow_null=True)
    
    class Meta:
        model = Asistencia
        fields = [
            'id', 'empleado', 'empleado_nombre', 'fecha',
            'hora_entrada', 'hora_salida', 'pedido_produccion', 'pedido_tipo'
        ]
        read_only_fields = ['id']

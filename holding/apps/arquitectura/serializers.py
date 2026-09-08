from rest_framework import serializers
from .models import PropuestaDiseno, ArchivoDiseno

class ArchivoDisenoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = ArchivoDiseno
        fields = ['id', 'propuesta', 'tipo', 'tipo_display', 'archivo', 'subido_en']
        read_only_fields = ['id', 'subido_en']

class PropuestaDisenoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True, allow_null=True)
    arquitecto_nombre = serializers.CharField(source='arquitecto_responsable.get_full_name', read_only=True, allow_null=True)
    archivos = ArchivoDisenoSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropuestaDiseno
        fields = [
            'id', 'cliente', 'cliente_nombre', 'proyecto', 'proyecto_nombre',
            'arquitecto_responsable', 'arquitecto_nombre', 'version', 'estatus',
            'creado_en', 'archivos'
        ]
        read_only_fields = ['id', 'creado_en']

class PropuestaDisenoListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True, allow_null=True)
    
    class Meta:
        model = PropuestaDiseno
        fields = ['id', 'cliente', 'cliente_nombre', 'proyecto', 'proyecto_nombre', 'version', 'estatus', 'creado_en']

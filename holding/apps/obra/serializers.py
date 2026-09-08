from rest_framework import serializers
from .models import (
    Cuadrilla, BitacoraObra, FotoAvance, ConsumoMaterial,
    EstimacionObra, InventarioMaterial, OrdenIntercompania
)


class FotoAvanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoAvance
        fields = ['id', 'bitacora', 'imagen']
        read_only_fields = ['id']


class ConsumoMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumoMaterial
        fields = ['id', 'bitacora', 'material', 'cantidad', 'unidad']
        read_only_fields = ['id']


class BitacoraObraSerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)
    cuadrilla_nombre = serializers.CharField(source='cuadrilla.nombre', read_only=True, allow_null=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True, allow_null=True)
    fotos = FotoAvanceSerializer(many=True, read_only=True)
    consumos = ConsumoMaterialSerializer(many=True, read_only=True)

    class Meta:
        model = BitacoraObra
        fields = [
            'id', 'proyecto', 'proyecto_nombre', 'fecha', 'porcentaje_avance',
            'cuadrilla', 'cuadrilla_nombre', 'registrado_por', 'registrado_por_nombre',
            'incidencias', 'fotos', 'consumos'
        ]
        read_only_fields = ['id']


class CuadrillaSerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)

    class Meta:
        model = Cuadrilla
        fields = ['id', 'nombre', 'proyecto', 'proyecto_nombre']
        read_only_fields = ['id']


class EstimacionObraSerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)

    class Meta:
        model = EstimacionObra
        fields = [
            'id', 'proyecto', 'proyecto_nombre', 'numero_estimacion',
            'fecha_presentacion', 'porcentaje_ejecutado', 'monto_ejecutado',
            'estatus', 'estatus_display', 'notas', 'creado_en'
        ]
        read_only_fields = ['id', 'creado_en']


class InventarioMaterialSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    bajo_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventarioMaterial
        fields = [
            'id', 'material', 'unidad', 'empresa', 'empresa_nombre',
            'stock_actual', 'stock_minimo', 'precio_unitario_promedio',
            'bajo_stock', 'actualizado_en'
        ]
        read_only_fields = ['id', 'actualizado_en', 'bajo_stock']

    def get_bajo_stock(self, obj):
        return obj.stock_actual <= obj.stock_minimo


class OrdenIntercompaniaSerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)
    empresa_origen_nombre = serializers.CharField(source='empresa_origen.nombre', read_only=True)
    empresa_destino_nombre = serializers.CharField(source='empresa_destino.nombre', read_only=True)

    class Meta:
        model = OrdenIntercompania
        fields = [
            'id', 'proyecto', 'proyecto_nombre', 'empresa_origen',
            'empresa_origen_nombre', 'empresa_destino', 'empresa_destino_nombre',
            'concepto', 'monto_interno', 'estatus', 'fecha_solicitud',
            'fecha_entrega_estimada'
        ]
        read_only_fields = ['id', 'fecha_solicitud']

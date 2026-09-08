from rest_framework import serializers
from .models import Factura, FacturaDetalle, CuentaPorCobrar, FacturaProveedor


class FacturaDetalleSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    modulo_origen_display = serializers.CharField(source='get_modulo_origen_display', read_only=True)

    class Meta:
        model = FacturaDetalle
        fields = [
            'id', 'factura', 'concepto', 'monto', 'empresa', 'empresa_nombre',
            'modulo_origen', 'modulo_origen_display'
        ]
        read_only_fields = ['id']


class FacturaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    detalles = FacturaDetalleSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Factura
        fields = ['id', 'cliente', 'cliente_nombre', 'fecha', 'folio_fiscal', 'pagada', 'total', 'creado_en', 'detalles']
        read_only_fields = ['id', 'creado_en', 'total']


class CuentaPorCobrarSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='factura.cliente.razon_social', read_only=True)

    class Meta:
        model = CuentaPorCobrar
        fields = ['id', 'factura', 'cliente_nombre', 'fecha_vencimiento', 'saldo_pendiente']
        read_only_fields = ['id']


class FacturaProveedorSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True, allow_null=True)

    class Meta:
        model = FacturaProveedor
        fields = [
            'id', 'proveedor_nombre', 'empresa', 'empresa_nombre', 'proyecto',
            'proyecto_nombre', 'concepto', 'monto', 'fecha_emision', 
            'fecha_vencimiento', 'pagada', 'saldo_pendiente', 'creado_en'
        ]
        read_only_fields = ['id', 'creado_en']

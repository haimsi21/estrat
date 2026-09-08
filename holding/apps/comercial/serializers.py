from rest_framework import serializers
from .models import Lead, Cotizacion, Contrato, InteraccionCliente


class InteraccionClienteSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = InteraccionCliente
        fields = [
            'id', 'lead', 'cliente', 'usuario', 'usuario_nombre',
            'tipo', 'tipo_display', 'resultado_notas', 'proximo_seguimiento', 'fecha_contacto'
        ]


class LeadSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    siguiente_accion_responsable_nombre = serializers.CharField(source='siguiente_accion_responsable.nombre_completo', read_only=True, allow_null=True)
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    interacciones = InteraccionClienteSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'cliente', 'cliente_nombre', 'empresa', 'empresa_nombre',
            'origen', 'estatus', 'estatus_display', 'responsable', 'responsable_nombre',
            'nombre_proyecto', 'sucursal_ubicacion', 'tipos_proyecto', 'necesidad_cliente',
            'entregables_esperados', 'informacion_existente', 'archivos_adjuntos',
            'presupuesto_indicado', 'monto_presupuesto', 'fecha_cotizacion_requerida',
            'fecha_inicio_solicitado', 'fecha_entrega_requerida', 'fecha_inamovible',
            'observaciones_importantes', 'siguiente_accion_area', 'siguiente_accion_concreta',
            'siguiente_accion_responsable', 'siguiente_accion_responsable_nombre',
            'siguiente_accion_fecha_compromiso', 'notas', 'interacciones', 'creado_en'
        ]


class CotizacionSerializer(serializers.ModelSerializer):
    lead_cliente = serializers.CharField(source='lead.cliente.razon_social', read_only=True)
    lead_empresa = serializers.CharField(source='lead.empresa.nombre', read_only=True)

    class Meta:
        model = Cotizacion
        fields = ['id', 'lead', 'lead_cliente', 'lead_empresa', 'concepto', 'monto', 'vigencia', 'aprobada', 'creado_en']


class ContratoSerializer(serializers.ModelSerializer):
    cliente = serializers.CharField(source='cotizacion.lead.cliente.razon_social', read_only=True)

    class Meta:
        model = Contrato
        fields = ['id', 'cotizacion', 'cliente', 'fecha_firma']

from rest_framework import serializers
from .models import Proyecto, Fase, ParticipacionEmpresa


class ParticipacionEmpresaSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    estatus_cancha_display = serializers.CharField(source='get_estatus_cancha_display', read_only=True)

    class Meta:
        model = ParticipacionEmpresa
        fields = [
            'id', 'proyecto', 'empresa', 'empresa_nombre', 'monto_presupuesto',
            'porcentaje_avance', 'estatus_cancha', 'estatus_cancha_display', 'notas', 'actualizado_en'
        ]


class FaseSerializer(serializers.ModelSerializer):
    dias_retraso = serializers.ReadOnlyField()

    class Meta:
        model = Fase
        fields = [
            'id', 'nombre', 'porcentaje_avance', 'fecha_inicio',
            'fecha_compromiso', 'completada', 'es_ruta_critica', 'dias_retraso'
        ]


class ProyectoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    fases = FaseSerializer(many=True, read_only=True)
    participaciones = ParticipacionEmpresaSerializer(many=True, read_only=True)
    avance_promedio = serializers.ReadOnlyField()
    costo_real = serializers.ReadOnlyField()
    costo_posventa = serializers.ReadOnlyField()
    ganancia_estimada = serializers.ReadOnlyField()
    margen_porcentaje = serializers.ReadOnlyField()
    evm_pv = serializers.ReadOnlyField()
    evm_ev = serializers.ReadOnlyField()
    evm_ac = serializers.ReadOnlyField()
    evm_cpi = serializers.ReadOnlyField()
    evm_spi = serializers.ReadOnlyField()

    class Meta:
        model = Proyecto
        fields = [
            'id', 'nombre', 'cliente', 'cliente_nombre', 'empresa', 'empresa_nombre',
            'contrato', 'presupuesto_total', 'costo_real', 'costo_posventa', 'ganancia_estimada', 'margen_porcentaje',
            'evm_pv', 'evm_ev', 'evm_ac', 'evm_cpi', 'evm_spi',
            'fecha_inicio', 'fecha_fin_estimada', 'responsable', 'responsable_nombre',
            'activo', 'avance_promedio', 'fases', 'participaciones', 'creado_en'
        ]


class ProyectoListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    participaciones = ParticipacionEmpresaSerializer(many=True, read_only=True)
    evm_cpi = serializers.ReadOnlyField()
    evm_spi = serializers.ReadOnlyField()

    class Meta:
        model = Proyecto
        fields = [
            'id', 'nombre', 'cliente_nombre', 'empresa_nombre', 'presupuesto_total',
            'costo_real', 'ganancia_estimada', 'margen_porcentaje', 'evm_cpi', 'evm_spi',
            'fecha_inicio', 'activo', 'avance_promedio', 'participaciones'
        ]

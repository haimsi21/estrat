from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Empresa, Rol, Cliente, EventoAuditoria, DocumentoAutorizacion,
    OrdenCompra, ExpedienteLegal, TicketPosventa
)

User = get_user_model()


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'razon_social', 'rfc', 'activa']


class RolSerializer(serializers.ModelSerializer):
    capa_display = serializers.CharField(source='get_capa_display', read_only=True)

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'capa', 'capa_display']


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            'id', 'razon_social', 'nombre_comercial', 'rfc',
            'contacto_nombre', 'contacto_telefono', 'contacto_email',
            'codigo_postal', 'estado_republica', 'ciudad_municipio', 'ubicacion',
            'tipo_propiedad', 'superficie_m2', 'presupuesto_estimado',
            'fecha_deseada_entrega', 'nivel_urgencia', 'especificaciones_brief',
            'activo', 'empresas_relacionadas', 'creado_en'
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    capa_acceso = serializers.ReadOnlyField()
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True, allow_null=True)
    cliente_asociado_nombre = serializers.CharField(source='cliente_asociado.nombre_comercial', read_only=True, allow_null=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nombre_completo', 'rol', 'rol_nombre', 'puesto', 'departamento',
            'reporta_a', 'cliente_asociado', 'cliente_asociado_nombre',
            'modulos_permitidos', 'monto_autorizacion_max', 'empresas',
            'capa_acceso', 'is_active', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        empresas = validated_data.pop('empresas', [])
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('432432')
        user.save()
        if empresas:
            user.empresas.set(empresas)
        return user


class EventoAuditoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre_completo', read_only=True)

    class Meta:
        model = EventoAuditoria
        fields = ['id', 'usuario', 'usuario_nombre', 'accion', 'modulo', 'objeto_id', 'objeto_repr', 'detalles', 'timestamp']


class DocumentoAutorizacionSerializer(serializers.ModelSerializer):
    solicitante_nombre = serializers.CharField(source='solicitante.nombre_completo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable_aprobacion.nombre_completo', read_only=True)

    class Meta:
        model = DocumentoAutorizacion
        fields = ['id', 'titulo', 'tipo', 'version', 'proyecto_nombre', 'solicitante', 'solicitante_nombre', 'responsable_aprobacion', 'responsable_nombre', 'estatus', 'archivo_url', 'notas', 'visto_en', 'respondido_en', 'sla_horas', 'creado_en']


class OrdenCompraSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)

    class Meta:
        model = OrdenCompra
        fields = ['id', 'folio', 'proveedor_nombre', 'empresa', 'empresa_nombre', 'proyecto_nombre', 'concepto', 'monto_total', 'estatus', 'fecha_requisicion', 'fecha_entrega_esperada']


class ExpedienteLegalSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)

    class Meta:
        model = ExpedienteLegal
        fields = ['id', 'titulo', 'tipo', 'cliente', 'empresa', 'empresa_nombre', 'monto_contrato', 'estatus', 'abogado_responsable', 'fecha_firma', 'fecha_vencimiento', 'clausulas_clave', 'archivo_url']


class TicketPosventaSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa_responsable.nombre', read_only=True)

    class Meta:
        model = TicketPosventa
        fields = ['id', 'folio', 'cliente', 'empresa_responsable', 'empresa_nombre', 'proyecto_nombre', 'tipo_falla', 'descripcion_falla', 'costo_reparacion', 'estatus', 'fecha_reporte', 'fecha_solucion_estimada']

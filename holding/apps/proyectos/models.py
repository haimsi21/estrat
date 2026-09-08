import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import Empresa, Cliente, Usuario, TicketPosventa
from apps.comercial.models import Contrato


class Proyecto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200, db_index=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="proyectos")
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="proyectos")
    contrato = models.ForeignKey(
        Contrato, on_delete=models.SET_NULL, null=True, blank=True, related_name="proyectos"
    )
    presupuesto_total = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_inicio = models.DateField()
    fecha_fin_estimada = models.DateField()
    responsable = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, related_name="proyectos_a_cargo"
    )
    activo = models.BooleanField(default=True, db_index=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return self.nombre

    @property
    def avance_promedio(self):
        participaciones = self.participaciones.all()
        if participaciones.exists():
            return round(sum(p.porcentaje_avance for p in participaciones) / participaciones.count(), 1)
        fases = self.fases.all()
        if not fases.exists():
            return 0.0
        return round(sum(f.porcentaje_avance for f in fases) / fases.count(), 1)

    @property
    def costo_posventa(self):
        tickets = TicketPosventa.objects.filter(proyecto_nombre__icontains=self.nombre)
        return round(sum(float(t.costo_reparacion) for t in tickets), 2)

    @property
    def costo_real(self):
        total = 0.0
        for b in self.bitacoras.all():
            for c in b.consumos.all():
                total += float(c.cantidad or 0) * 180.0
        
        for p in self.pedidos_produccion.all():
            total += 35000.0
            
        return round(total + self.costo_posventa, 2)

    @property
    def ganancia_estimada(self):
        presupuesto = float(self.presupuesto_total or 0)
        return round(presupuesto - self.costo_real, 2)

    @property
    def margen_porcentaje(self):
        presupuesto = float(self.presupuesto_total or 0)
        if presupuesto == 0:
            return 0.0
        return round(((presupuesto - self.costo_real) / presupuesto) * 100, 1)

    @property
    def evm_pv(self):
        hoy = timezone.now().date()
        if not self.fecha_inicio or not self.fecha_fin_estimada:
            return 0.0
        dias_totales = max(1, (self.fecha_fin_estimada - self.fecha_inicio).days)
        dias_transcurridos = max(0, min(dias_totales, (hoy - self.fecha_inicio).days))
        pct_tiempo = dias_transcurridos / dias_totales
        return round(float(self.presupuesto_total) * pct_tiempo, 2)

    @property
    def evm_ev(self):
        return round(float(self.presupuesto_total) * (self.avance_promedio / 100.0), 2)

    @property
    def evm_ac(self):
        return self.costo_real

    @property
    def evm_cpi(self):
        if self.evm_ac == 0:
            return 1.0
        return round(self.evm_ev / self.evm_ac, 2)

    @property
    def evm_spi(self):
        if self.evm_pv == 0:
            return 1.0
        return round(self.evm_ev / self.evm_pv, 2)


class ParticipacionEmpresa(models.Model):
    ESTATUS_CANCHA = [
        ("no_iniciado", "Por Iniciar"),
        ("en_cancha", "Área Responsable Principal"),
        ("pari_passu", "Ejecución Concurrente"),
        ("completado", "Etapa Concluida"),
        ("detenido", "En Pausa Estratégica"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="participaciones")
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="participaciones_proyecto")
    monto_presupuesto = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    porcentaje_avance = models.PositiveSmallIntegerField(default=0)
    estatus_cancha = models.CharField(max_length=20, choices=ESTATUS_CANCHA, default="no_iniciado", db_index=True)
    notas = models.TextField(blank=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["empresa__nombre"]
        unique_together = ["proyecto", "empresa"]


class Fase(models.Model):
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="fases")
    nombre = models.CharField(max_length=150)
    porcentaje_avance = models.PositiveSmallIntegerField(default=0)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_compromiso = models.DateField()
    completada = models.BooleanField(default=False, db_index=True)
    es_ruta_critica = models.BooleanField(default=False)

    class Meta:
        ordering = ["fecha_compromiso"]

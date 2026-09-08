import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('comercial', '0001_initial'),
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Proyecto',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('nombre', models.CharField(db_index=True, max_length=200)),
                ('presupuesto_total', models.DecimalField(decimal_places=2, max_digits=14)),
                ('fecha_inicio', models.DateField()),
                ('fecha_fin_estimada', models.DateField()),
                ('activo', models.BooleanField(db_index=True, default=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('cliente', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='proyectos', to='core.cliente')),
                ('contrato', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='proyectos', to='comercial.contrato')),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='proyectos', to='core.empresa')),
                ('responsable', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='proyectos_a_cargo', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-creado_en'],
            },
        ),
        migrations.CreateModel(
            name='Fase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150)),
                ('porcentaje_avance', models.PositiveSmallIntegerField(default=0)),
                ('fecha_inicio', models.DateField(blank=True, null=True)),
                ('fecha_compromiso', models.DateField()),
                ('completada', models.BooleanField(db_index=True, default=False)),
                ('es_ruta_critica', models.BooleanField(default=False)),
                ('proyecto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fases', to='proyectos.proyecto')),
            ],
            options={
                'ordering': ['fecha_compromiso'],
            },
        ),
    ]

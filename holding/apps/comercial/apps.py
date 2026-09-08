from django.apps import AppConfig

class ComercialConfig(AppConfig):
    name = 'apps.comercial'
    verbose_name = "Comercial (CRM)"

    def ready(self):
        import apps.comercial.signals  # noqa: F401

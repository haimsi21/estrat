from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, CotizacionViewSet, ContratoViewSet, InteraccionClienteViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'cotizaciones', CotizacionViewSet, basename='cotizacion')
router.register(r'contratos', ContratoViewSet, basename='contrato')
router.register(r'interacciones', InteraccionClienteViewSet, basename='interaccion')

urlpatterns = [path('', include(router.urls))]

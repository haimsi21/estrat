from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FacturaViewSet, FacturaDetalleViewSet, 
    CuentaPorCobrarViewSet, FacturaProveedorViewSet,
    estado_resultados_consolidado, flujo_caja_proyectado,
    reporte_inversionistas
)

router = DefaultRouter()
router.register(r'facturas', FacturaViewSet, basename='factura')
router.register(r'detalles', FacturaDetalleViewSet, basename='detalle')
router.register(r'cxc', CuentaPorCobrarViewSet, basename='cxc')
router.register(r'cxp', FacturaProveedorViewSet, basename='cxp')

urlpatterns = [
    path('', include(router.urls)),
    path('pnl/', estado_resultados_consolidado, name='financiero-pnl'),
    path('flujo-caja/', flujo_caja_proyectado, name='financiero-flujo-caja'),
    path('reporte-inversionistas/', reporte_inversionistas, name='financiero-inversionistas'),
]

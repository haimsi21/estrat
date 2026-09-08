from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CuadrillaViewSet, BitacoraObraViewSet, FotoAvanceViewSet, 
    ConsumoMaterialViewSet, EstimacionObraViewSet, 
    InventarioMaterialViewSet, OrdenIntercompaniaViewSet
)

router = DefaultRouter()
router.register(r'cuadrillas', CuadrillaViewSet, basename='cuadrilla')
router.register(r'bitacoras', BitacoraObraViewSet, basename='bitacora')
router.register(r'estimaciones', EstimacionObraViewSet, basename='estimacion')
router.register(r'inventario', InventarioMaterialViewSet, basename='inventario')
router.register(r'ordenes-intercompania', OrdenIntercompaniaViewSet, basename='orden-intercompania')
router.register(r'fotos', FotoAvanceViewSet, basename='foto')
router.register(r'consumos', ConsumoMaterialViewSet, basename='consumo')

urlpatterns = [path('', include(router.urls))]

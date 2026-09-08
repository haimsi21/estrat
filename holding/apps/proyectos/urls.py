from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProyectoViewSet, FaseViewSet, ParticipacionEmpresaViewSet

router = DefaultRouter()
router.register(r'proyectos', ProyectoViewSet, basename='proyecto')
router.register(r'fases', FaseViewSet, basename='fase')
router.register(r'participaciones', ParticipacionEmpresaViewSet, basename='participacion')

urlpatterns = [path('', include(router.urls))]

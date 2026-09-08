from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpleadoViewSet, AsistenciaViewSet
router = DefaultRouter()
router.register(r'empleados', EmpleadoViewSet, basename='empleado')
router.register(r'asistencias', AsistenciaViewSet, basename='asistencia')
urlpatterns = [path('', include(router.urls))]

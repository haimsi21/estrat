from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropuestaDisenoViewSet, ArchivoDisenoViewSet
router = DefaultRouter()
router.register(r'propuestas', PropuestaDisenoViewSet, basename='propuesta')
router.register(r'archivos', ArchivoDisenoViewSet, basename='archivo')
urlpatterns = [path('', include(router.urls))]

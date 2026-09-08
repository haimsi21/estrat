from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'empresas', views.EmpresaViewSet, basename='empresa')
router.register(r'clientes', views.ClienteViewSet, basename='cliente')
router.register(r'usuarios', views.UsuarioViewSet, basename='usuario')
router.register(r'roles', views.RolViewSet, basename='rol')
router.register(r'documentos-autorizacion', views.DocumentoAutorizacionViewSet, basename='documento-autorizacion')
router.register(r'ordenes-compra', views.OrdenCompraViewSet, basename='orden-compra')
router.register(r'expedientes-legales', views.ExpedienteLegalViewSet, basename='expediente-legal')
router.register(r'tickets-posventa', views.TicketPosventaViewSet, basename='ticket-posventa')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', views.me_view, name='core-me'),
    path('me/cambiar_password/', views.cambiar_mi_password, name='cambiar-mi-password'),
    path('cp-lookup/', views.cp_lookup_view, name='cp-lookup'),
    path('bitacora-personal/', views.bitacora_personal_view, name='bitacora-personal'),
    path('metricas-desempeno/', views.metricas_desempeno_view, name='metricas-desempeno'),
    path('upload/', views.upload_view, name='core-upload'),
    path('upload/delete/', views.upload_delete_view, name='core-upload-delete'),
]

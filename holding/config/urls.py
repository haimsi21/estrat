from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.proyectos.calendar_feed import exportar_calendario_ical

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Auth Endpoints
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Suscripción Google Calendar (iCal)
    path('api/proyectos/calendario.ics', exportar_calendario_ical, name='calendario-ical'),

    # Swagger / OpenAPI Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Apps del holding
    path('api/core/', include('apps.core.urls')),
    path('api/comercial/', include('apps.comercial.urls')),
    path('api/proyectos/', include('apps.proyectos.urls')),
    path('api/arquitectura/', include('apps.arquitectura.urls')),
    path('api/obra/', include('apps.obra.urls')),
    path('api/produccion/', include('apps.produccion.urls')),
    path('api/financiero/', include('apps.financiero.urls')),
    path('api/rrhh/', include('apps.rrhh.urls')),
    path('api/direccion/', include('apps.direccion_general.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

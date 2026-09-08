from django.urls import path
from . import views

urlpatterns = [
    path('resumen/', views.dashboard_resumen, name='dashboard-resumen'),
    path('graficas/', views.dashboard_graficas, name='dashboard-graficas'),
]

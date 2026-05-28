from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/applications/', include('apps.applications.urls')),
    path('api/interviews/', include('apps.interviews.urls')),
    path('api/notes/', include('apps.notes.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/email-logs/', include('apps.email_service.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

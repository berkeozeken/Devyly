from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

_schema_view = staff_member_required(SpectacularAPIView.as_view(), login_url='/admin/login/')
_docs_view = staff_member_required(SpectacularSwaggerView.as_view(url_name='schema'), login_url='/admin/login/')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.public_urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/applications/', include('apps.applications.urls')),
    path('api/interviews/', include('apps.interviews.urls')),
    path('api/notes/', include('apps.notes.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/email-logs/', include('apps.email_service.urls')),
    path('api/developer-profile/', include('apps.developer_profiles.urls')),
    path('api/recruiter-profile/', include('apps.recruiter_profiles.urls')),
    path('api/job-posts/', include('apps.job_posts.urls')),
    path('api/job-applications/', include('apps.job_applications.urls')),
    path('api/interview-reschedule-requests/', include('apps.job_applications.reschedule_urls')),
    path('api/feed-posts/', include('apps.feed_posts.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/schema/', _schema_view, name='schema'),
    path('api/docs/', _docs_view, name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

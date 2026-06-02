from django.urls import path

from .views import (
    CreateRescheduleRequestView,
    JobApplicationDetailView,
    MyApplicationsView,
    MyRescheduleRequestsView,
    ReceivedApplicationsView,
    ReceivedRescheduleRequestsView,
    RescheduleRequestDetailView,
)

# /api/job-applications/…
job_application_urlpatterns = [
    path('my/', MyApplicationsView.as_view(), name='job-applications-my'),
    path('received/', ReceivedApplicationsView.as_view(), name='job-applications-received'),
    path('<int:pk>/', JobApplicationDetailView.as_view(), name='job-application-detail'),
    path('<int:pk>/reschedule-request/', CreateRescheduleRequestView.as_view(), name='job-application-reschedule'),
]

# /api/interview-reschedule-requests/…
reschedule_urlpatterns = [
    path('my/', MyRescheduleRequestsView.as_view(), name='reschedule-requests-my'),
    path('received/', ReceivedRescheduleRequestsView.as_view(), name='reschedule-requests-received'),
    path('<int:pk>/', RescheduleRequestDetailView.as_view(), name='reschedule-request-detail'),
]

urlpatterns = job_application_urlpatterns

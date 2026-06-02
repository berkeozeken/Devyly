from django.urls import path

from .views import MyRescheduleRequestsView, ReceivedRescheduleRequestsView, RescheduleRequestDetailView

urlpatterns = [
    path('my/', MyRescheduleRequestsView.as_view(), name='reschedule-requests-my'),
    path('received/', ReceivedRescheduleRequestsView.as_view(), name='reschedule-requests-received'),
    path('<int:pk>/', RescheduleRequestDetailView.as_view(), name='reschedule-request-detail'),
]

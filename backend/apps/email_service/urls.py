from django.urls import path

from .views import EmailLogListView

urlpatterns = [
    path('', EmailLogListView.as_view(), name='email-log-list'),
]

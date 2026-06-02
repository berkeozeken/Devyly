from django.urls import path

from .views import RecruiterProfileMeView

urlpatterns = [
    path('me/', RecruiterProfileMeView.as_view(), name='recruiter-profile-me'),
]

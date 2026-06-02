from django.urls import path

from .views import DeveloperProfileMeView

urlpatterns = [
    path('me/', DeveloperProfileMeView.as_view(), name='developer-profile-me'),
]

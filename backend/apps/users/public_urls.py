from django.urls import path

from .views import PublicUserProfileView

urlpatterns = [
    path('<int:pk>/public-profile/', PublicUserProfileView.as_view(), name='user-public-profile'),
]

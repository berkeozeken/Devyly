from django.urls import path

from .views import PublicDeveloperListView, PublicRecruiterListView, PublicUserPostsView, PublicUserProfileView

urlpatterns = [
    path('<int:pk>/public-profile/', PublicUserProfileView.as_view(), name='user-public-profile'),
    path('<int:pk>/posts/', PublicUserPostsView.as_view(), name='user-public-posts'),
    path('developers/', PublicDeveloperListView.as_view(), name='user-developers-list'),
    path('recruiters/', PublicRecruiterListView.as_view(), name='user-recruiters-list'),
]

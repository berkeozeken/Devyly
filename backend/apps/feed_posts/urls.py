from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FeedPostViewSet

router = DefaultRouter()
router.register('', FeedPostViewSet, basename='feedpost')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JobPostViewSet

router = DefaultRouter()
router.register('', JobPostViewSet, basename='jobpost')

urlpatterns = [
    path('', include(router.urls)),
]

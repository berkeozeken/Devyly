from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .models import DeveloperProfile
from .serializers import DeveloperProfileSerializer


class IsDeveloper(BasePermission):
    message = 'Bu endpoint sadece Developer hesapları içindir.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.DEVELOPER
        )


class DeveloperProfileMeView(APIView):
    permission_classes = (IsAuthenticated, IsDeveloper)

    @extend_schema(responses={200: DeveloperProfileSerializer})
    def get(self, request):
        profile, _ = DeveloperProfile.objects.get_or_create(user=request.user)
        return Response(DeveloperProfileSerializer(profile).data)

    @extend_schema(request=DeveloperProfileSerializer, responses={200: DeveloperProfileSerializer})
    def put(self, request):
        profile, _ = DeveloperProfile.objects.get_or_create(user=request.user)
        serializer = DeveloperProfileSerializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(request=DeveloperProfileSerializer, responses={200: DeveloperProfileSerializer})
    def patch(self, request):
        profile, _ = DeveloperProfile.objects.get_or_create(user=request.user)
        serializer = DeveloperProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

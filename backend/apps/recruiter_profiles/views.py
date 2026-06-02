from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .models import RecruiterProfile
from .serializers import RecruiterProfileSerializer


class IsRecruiter(BasePermission):
    message = 'Bu endpoint sadece Recruiter hesapları içindir.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.RECRUITER
        )


class RecruiterProfileMeView(APIView):
    permission_classes = (IsAuthenticated, IsRecruiter)

    @extend_schema(responses={200: RecruiterProfileSerializer})
    def get(self, request):
        profile, _ = RecruiterProfile.objects.get_or_create(user=request.user)
        return Response(RecruiterProfileSerializer(profile).data)

    @extend_schema(request=RecruiterProfileSerializer, responses={200: RecruiterProfileSerializer})
    def put(self, request):
        profile, _ = RecruiterProfile.objects.get_or_create(user=request.user)
        serializer = RecruiterProfileSerializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(request=RecruiterProfileSerializer, responses={200: RecruiterProfileSerializer})
    def patch(self, request):
        profile, _ = RecruiterProfile.objects.get_or_create(user=request.user)
        serializer = RecruiterProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

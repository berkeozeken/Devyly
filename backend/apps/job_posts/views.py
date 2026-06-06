from django.db import IntegrityError
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.job_applications.models import JobApplication
from apps.job_applications.serializers import ApplySerializer, JobApplicationSerializer
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.users.models import User

from .models import JobPost
from .serializers import JobPostSerializer


class IsRecruiter(BasePermission):
    message = 'Bu işlem sadece Recruiter hesapları içindir.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.RECRUITER
        )

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.recruiter == request.user
        )


class JobPostViewSet(ModelViewSet):
    serializer_class = JobPostSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return []
        if self.action in ('apply', 'my_posts'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsRecruiter()]

    def get_queryset(self):
        return JobPost.objects.select_related('company', 'recruiter').filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

    @action(detail=False, methods=['get'], url_path='my', permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Bu endpoint sadece Recruiter hesapları içindir.'}, status=403)
        qs = JobPost.objects.filter(recruiter=request.user).select_related('company')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(request=ApplySerializer, responses={201: JobApplicationSerializer})
    @action(detail=True, methods=['post'], url_path='apply', permission_classes=[IsAuthenticated])
    def apply(self, request, pk=None):
        if request.user.role != User.Role.DEVELOPER:
            return Response({'detail': 'Başvuru sadece Developer hesapları tarafından yapılabilir.'}, status=403)

        job_post = self.get_object()

        if not job_post.is_active:
            return Response({'detail': 'Bu ilan artık aktif değil.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            application = JobApplication.objects.create(
                developer=request.user,
                job_post=job_post,
                cover_letter=serializer.validated_data.get('cover_letter', ''),
            )
        except IntegrityError:
            return Response({'detail': 'Bu ilana zaten başvurdunuz.'}, status=status.HTTP_400_BAD_REQUEST)

        create_notification(
            recipient=job_post.recruiter,
            actor=request.user,
            notification_type=Notification.Type.APPLICATION_RECEIVED,
            title="Yeni başvuru aldınız",
            message=f"{request.user.get_full_name()}, {job_post.title} ilanına başvurdu.",
            link="/received-applications",
        )

        return Response(
            JobApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )

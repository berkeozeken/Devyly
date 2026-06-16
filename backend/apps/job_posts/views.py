from django.db import IntegrityError
from django.db.models import Q
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

_JP_ORDERING = {
    'newest': '-created_at',
    'oldest': 'created_at',
    'title_asc': 'title',
    'title_desc': '-title',
}


def _filter_jobposts(qs, params):
    search = params.get('search', '').strip()
    location = params.get('location', '').strip()
    work_type = params.get('work_type', '').strip()
    ordering = params.get('ordering', 'newest')
    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(requirements__icontains=search) |
            Q(company__name__icontains=search)
        )
    if location:
        qs = qs.filter(location__icontains=location)
    if work_type:
        qs = qs.filter(work_type=work_type)
    return qs.order_by(_JP_ORDERING.get(ordering, '-created_at'))


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


class IsDeveloper(BasePermission):
    message = 'Bu işlem sadece Developer hesapları içindir.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.DEVELOPER
        )


class JobPostViewSet(ModelViewSet):
    serializer_class = JobPostSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return []
        if self.action == 'apply':
            return [IsAuthenticated(), IsDeveloper()]
        if self.action == 'my_posts':
            return [IsAuthenticated(), IsRecruiter()]
        return [IsAuthenticated(), IsRecruiter()]

    def get_queryset(self):
        qs = JobPost.objects.select_related('company', 'recruiter').filter(is_active=True)
        if self.action == 'list':
            qs = _filter_jobposts(qs, self.request.query_params)
        return qs

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

    @action(detail=False, methods=['get'], url_path='my', permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Bu endpoint sadece Recruiter hesapları içindir.'}, status=403)
        qs = JobPost.objects.filter(recruiter=request.user).select_related('company')
        qs = _filter_jobposts(qs, request.query_params)
        return Response(self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.validated_data.get('company')
        if not company or not company.is_verified:
            return Response(
                {'detail': 'İlan yayınlamak için doğrulanmış bir şirket seçmeniz gerekir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @extend_schema(request=ApplySerializer, responses={201: JobApplicationSerializer})
    @action(detail=True, methods=['post'], url_path='apply', permission_classes=[IsAuthenticated])
    def apply(self, request, pk=None):
        if request.user.role != User.Role.DEVELOPER:
            return Response({'detail': 'Başvuru sadece Developer hesapları tarafından yapılabilir.'}, status=403)

        if not request.user.is_email_verified:
            return Response(
                {'detail': 'Başvuru yapmadan önce email adresinizi doğrulamanız gerekir.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # PHONE_VERIFICATION_DISABLED: phone check temporarily removed (re-enable when SMS is live)
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

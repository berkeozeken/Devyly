from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

_APP_ORDERING = {
    'newest': '-created_at',
    'oldest': 'created_at',
    'status': 'status',
    'interview_date': 'interview_date',
}

from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.users.models import User

from .models import InterviewRescheduleRequest, JobApplication
from .serializers import (
    CreateRescheduleRequestSerializer,
    InterviewRescheduleRequestSerializer,
    JobApplicationSerializer,
    RecruiterRescheduleResponseSerializer,
    StatusUpdateSerializer,
)


class MyApplicationsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: JobApplicationSerializer(many=True)})
    def get(self, request):
        if request.user.role != User.Role.DEVELOPER:
            return Response({'detail': 'Bu endpoint sadece Developer hesapları içindir.'}, status=403)
        qs = JobApplication.objects.filter(developer=request.user).select_related(
            'job_post', 'job_post__company', 'job_post__recruiter'
        )
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip()
        ordering = request.query_params.get('ordering', 'newest')
        if search:
            qs = qs.filter(
                Q(job_post__title__icontains=search) |
                Q(job_post__company__name__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        qs = qs.order_by(_APP_ORDERING.get(ordering, '-created_at'))
        return Response(JobApplicationSerializer(qs, many=True).data)


class ReceivedApplicationsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: JobApplicationSerializer(many=True)})
    def get(self, request):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Bu endpoint sadece Recruiter hesapları içindir.'}, status=403)
        qs = JobApplication.objects.filter(job_post__recruiter=request.user).select_related(
            'developer', 'job_post', 'job_post__company', 'job_post__recruiter'
        )
        search = request.query_params.get('search', '').strip()
        status_filter = request.query_params.get('status', '').strip()
        ordering = request.query_params.get('ordering', 'newest')
        if search:
            qs = qs.filter(
                Q(developer__first_name__icontains=search) |
                Q(developer__last_name__icontains=search) |
                Q(developer__email__icontains=search) |
                Q(job_post__title__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        qs = qs.order_by(_APP_ORDERING.get(ordering, '-created_at'))
        return Response(JobApplicationSerializer(qs, many=True).data)


class JobApplicationDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def _get_application(self, pk, user):
        try:
            app = JobApplication.objects.select_related(
                'developer', 'job_post', 'job_post__company', 'job_post__recruiter'
            ).get(pk=pk)
        except JobApplication.DoesNotExist:
            return None, Response({'detail': 'Başvuru bulunamadı.'}, status=404)

        if user.role == User.Role.DEVELOPER and app.developer != user:
            return None, Response({'detail': 'Bu başvuruya erişim izniniz yok.'}, status=403)

        if user.role == User.Role.RECRUITER and app.job_post.recruiter != user:
            return None, Response({'detail': 'Bu başvuruya erişim izniniz yok.'}, status=403)

        return app, None

    @extend_schema(responses={200: JobApplicationSerializer})
    def get(self, request, pk):
        app, err = self._get_application(pk, request.user)
        if err:
            return err
        return Response(JobApplicationSerializer(app).data)

    @extend_schema(request=StatusUpdateSerializer, responses={200: JobApplicationSerializer})
    def patch(self, request, pk):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Durum değişikliği sadece Recruiter tarafından yapılabilir.'}, status=403)

        app, err = self._get_application(pk, request.user)
        if err:
            return err

        old_status = app.status
        old_interview_date = app.interview_date
        old_interview_link = app.interview_link

        serializer = StatusUpdateSerializer(app, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Status change notification
        if old_status != app.status:
            create_notification(
                recipient=app.developer,
                actor=request.user,
                notification_type=Notification.Type.APPLICATION_STATUS_CHANGED,
                title="Başvuru durumunuz güncellendi",
                message=f"{app.job_post.title} başvurunuzun durumu {app.status} olarak güncellendi.",
                link="/my-applications",
            )

        # Interview info notification
        interview_changed = (
            old_interview_date != app.interview_date
            or old_interview_link != app.interview_link
        )
        if interview_changed and app.interview_date:
            is_new = not old_interview_date and bool(app.interview_date)
            create_notification(
                recipient=app.developer,
                actor=request.user,
                notification_type=(
                    Notification.Type.INTERVIEW_SCHEDULED if is_new
                    else Notification.Type.INTERVIEW_UPDATED
                ),
                title="Mülakat bilgileri güncellendi",
                message=f"{app.job_post.title} başvurunuz için mülakat bilgileri güncellendi.",
                link="/my-applications",
            )

        return Response(JobApplicationSerializer(app).data)


# ─── Reschedule Request Views ─────────────────────────────────────────────────

class CreateRescheduleRequestView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=CreateRescheduleRequestSerializer,
        responses={201: InterviewRescheduleRequestSerializer},
    )
    def post(self, request, pk):
        if request.user.role != User.Role.DEVELOPER:
            return Response({'detail': 'Tarih değişikliği talebi sadece Developer hesapları oluşturabilir.'}, status=403)

        try:
            app = JobApplication.objects.select_related('job_post').get(pk=pk, developer=request.user)
        except JobApplication.DoesNotExist:
            return Response({'detail': 'Başvuru bulunamadı.'}, status=404)

        if app.status != JobApplication.Status.INTERVIEW:
            return Response({'detail': 'Sadece INTERVIEW statüsündeki başvurular için değişiklik talebi oluşturulabilir.'}, status=400)

        if InterviewRescheduleRequest.objects.filter(
            job_application=app,
            status=InterviewRescheduleRequest.Status.PENDING,
        ).exists():
            return Response({'detail': 'Bu başvuru için zaten bekleyen bir değişiklik talebi var.'}, status=400)

        serializer = CreateRescheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req = InterviewRescheduleRequest.objects.create(
            job_application=app,
            requested_by=request.user,
            **serializer.validated_data,
        )

        create_notification(
            recipient=app.job_post.recruiter,
            actor=request.user,
            notification_type=Notification.Type.RESCHEDULE_REQUESTED,
            title="Tarih değişikliği talebi",
            message=f"{request.user.get_full_name()}, {app.job_post.title} mülakatı için tarih değişikliği talep etti.",
            link="/received-applications",
        )

        return Response(InterviewRescheduleRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class MyRescheduleRequestsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: InterviewRescheduleRequestSerializer(many=True)})
    def get(self, request):
        if request.user.role != User.Role.DEVELOPER:
            return Response({'detail': 'Bu endpoint sadece Developer hesapları içindir.'}, status=403)
        qs = InterviewRescheduleRequest.objects.filter(
            requested_by=request.user
        ).select_related('job_application', 'job_application__job_post', 'job_application__job_post__company')
        return Response(InterviewRescheduleRequestSerializer(qs, many=True).data)


class ReceivedRescheduleRequestsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: InterviewRescheduleRequestSerializer(many=True)})
    def get(self, request):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Bu endpoint sadece Recruiter hesapları içindir.'}, status=403)
        qs = InterviewRescheduleRequest.objects.filter(
            job_application__job_post__recruiter=request.user
        ).select_related('job_application', 'job_application__job_post', 'job_application__job_post__company', 'requested_by')
        return Response(InterviewRescheduleRequestSerializer(qs, many=True).data)


class RescheduleRequestDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def _get_request(self, pk, user):
        try:
            req = InterviewRescheduleRequest.objects.select_related(
                'job_application', 'job_application__job_post',
                'job_application__job_post__company',
                'job_application__developer', 'requested_by',
            ).get(pk=pk)
        except InterviewRescheduleRequest.DoesNotExist:
            return None, Response({'detail': 'Talep bulunamadı.'}, status=404)

        if user.role == User.Role.RECRUITER and req.job_application.job_post.recruiter != user:
            return None, Response({'detail': 'Bu talebe erişim izniniz yok.'}, status=403)

        return req, None

    @extend_schema(
        request=RecruiterRescheduleResponseSerializer,
        responses={200: InterviewRescheduleRequestSerializer},
    )
    def patch(self, request, pk):
        if request.user.role != User.Role.RECRUITER:
            return Response({'detail': 'Talep yanıtı sadece Recruiter tarafından yapılabilir.'}, status=403)

        req, err = self._get_request(pk, request.user)
        if err:
            return err

        old_reschedule_status = req.status

        serializer = RecruiterRescheduleResponseSerializer(req, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        new_reschedule_status = req.status
        if old_reschedule_status != new_reschedule_status and new_reschedule_status in ('ACCEPTED', 'REJECTED'):
            decision = "kabul edildi" if new_reschedule_status == 'ACCEPTED' else "reddedildi"
            create_notification(
                recipient=req.requested_by,
                actor=request.user,
                notification_type=(
                    Notification.Type.RESCHEDULE_ACCEPTED if new_reschedule_status == 'ACCEPTED'
                    else Notification.Type.RESCHEDULE_REJECTED
                ),
                title="Tarih değişikliği talebiniz sonuçlandı",
                message=f"{req.job_application.job_post.title} için tarih değişikliği talebiniz {decision}.",
                link="/my-applications",
            )

        return Response(InterviewRescheduleRequestSerializer(req).data)

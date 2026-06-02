from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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

        serializer = StatusUpdateSerializer(app, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
                'job_application', 'job_application__job_post', 'job_application__job_post__company', 'requested_by'
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

        serializer = RecruiterRescheduleResponseSerializer(req, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(InterviewRescheduleRequestSerializer(req).data)

from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import Application
from apps.companies.models import Company
from apps.interviews.models import Interview
from apps.notes.models import Note

from .serializers import DashboardStatsSerializer


class DashboardStatsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: DashboardStatsSerializer})
    def get(self, request):
        user = request.user
        now = timezone.now()

        applications = Application.objects.filter(user=user)

        status_counts = {
            'total_applications': applications.count(),
            'pending_applications': applications.filter(
                status__in=[Application.Status.APPLIED, Application.Status.IN_REVIEW]
            ).count(),
            'interview_applications': applications.filter(status=Application.Status.INTERVIEW).count(),
            'offer_applications': applications.filter(status=Application.Status.OFFER).count(),
            'rejected_applications': applications.filter(status=Application.Status.REJECTED).count(),
            'accepted_applications': applications.filter(status=Application.Status.ACCEPTED).count(),
        }

        upcoming_qs = (
            Interview.objects
            .filter(user=user, interview_date__gte=now, result=Interview.Result.PENDING)
            .select_related('application', 'application__company')
            .order_by('interview_date')[:5]
        )
        upcoming_interviews = [
            {
                'id': i.id,
                'interview_date': i.interview_date,
                'interview_type': i.interview_type,
                'application_position': i.application.position,
                'company_name': i.application.company.name if i.application.company else '',
            }
            for i in upcoming_qs
        ]

        recent_qs = (
            Application.objects
            .filter(user=user)
            .select_related('company')
            .order_by('-created_at')[:5]
        )
        recent_applications = [
            {
                'id': a.id,
                'position': a.position,
                'company_name': a.company.name if a.company else '',
                'status': a.status,
                'applied_date': a.applied_date,
            }
            for a in recent_qs
        ]

        data = {
            **status_counts,
            'total_companies': Company.objects.filter(user=user).count(),
            'total_interviews': Interview.objects.filter(user=user).count(),
            'total_notes': Note.objects.filter(user=user).count(),
            'upcoming_interviews': upcoming_interviews,
            'recent_applications': recent_applications,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)

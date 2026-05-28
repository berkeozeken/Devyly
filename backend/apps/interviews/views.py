from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Interview
from .serializers import InterviewSerializer


class InterviewViewSet(ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Interview.objects.filter(user=self.request.user).select_related(
            'application', 'application__company'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

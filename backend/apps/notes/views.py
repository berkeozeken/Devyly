from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).select_related(
            'application', 'application__company'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

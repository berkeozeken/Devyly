from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .models import EmailLog
from .serializers import EmailLogSerializer


class EmailLogListView(ListAPIView):
    serializer_class = EmailLogSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return EmailLog.objects.filter(user=self.request.user)

from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Application
from .serializers import ApplicationSerializer, KanbanApplicationSerializer


class ApplicationViewSet(ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        responses={200: OpenApiResponse(
            response=inline_serializer(
                name='KanbanResponse',
                fields={status: KanbanApplicationSerializer(many=True) for status in Application.Status.values},
            ),
            description='Başvurular status kolonlarına göre gruplandırılmış halde döner.',
        )},
    )
    @action(detail=False, methods=['get'], url_path='kanban')
    def kanban(self, request):
        qs = self.get_queryset().select_related('company')
        grouped = {status: [] for status in Application.Status.values}
        for app in qs:
            grouped[app.status].append(KanbanApplicationSerializer(app).data)
        return Response(grouped)

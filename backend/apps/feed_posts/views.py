from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import FeedPost
from .serializers import FeedPostSerializer


class IsOwner(BasePermission):
    message = 'Bu işlem sadece gönderi sahibi tarafından yapılabilir.'

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.author == request.user
        )


class FeedPostViewSet(ModelViewSet):
    serializer_class = FeedPostSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        if self.action in ('list', 'retrieve'):
            return FeedPost.objects.select_related('author').filter(is_active=True)
        return FeedPost.objects.select_related('author')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return []
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwner()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, is_active=True)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=['is_active', 'updated_at'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

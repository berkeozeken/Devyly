from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Count, Max, Prefetch
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.job_applications.models import JobApplication
from apps.users.models import User

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def _conv_qs(user):
    return Conversation.objects.filter(
        participants=user
    ).prefetch_related(
        'participants',
        Prefetch('messages', queryset=Message.objects.select_related('sender')),
    ).select_related(
        'job_application__job_post',
        'job_post',
    )


def _broadcast_to_inbox(conv, msg_dict):
    """Broadcast inbox.message to all conversation participants for live inbox update."""
    participants = list(conv.participants.all())
    channel_layer = get_channel_layer()

    job_title = None
    if conv.job_post_id:
        try:
            job_title = conv.job_post.title
        except Exception:
            pass
    elif conv.job_application_id:
        try:
            job_title = conv.job_application.job_post.title
        except Exception:
            pass

    for viewer in participants:
        others = [u for u in participants if u.id != viewer.id]
        other = others[0] if others else None

        photo_url = None
        if other and other.profile_photo:
            try:
                photo_url = other.profile_photo.url
            except Exception:
                pass

        unread = Message.objects.filter(
            conversation_id=conv.id,
            is_read=False,
        ).exclude(sender=viewer).count()

        conv_payload = {
            "id": conv.id,
            "other_user": other.id if other else None,
            "other_user_name": other.get_full_name() if other else "",
            "other_user_role": other.role if other else "",
            "other_user_profile_photo": photo_url,
            "other_user_gender": other.gender if other else None,
            "job_title": job_title,
            "last_message": msg_dict,
            "last_message_at": msg_dict["created_at"],
            "unread_count": unread,
            "created_at": conv.created_at.isoformat(),
            "updated_at": msg_dict["created_at"],
        }

        async_to_sync(channel_layer.group_send)(
            f"user_{viewer.id}_inbox",
            {
                "type": "inbox.message",
                "conversation": conv_payload,
                "message": msg_dict,
            },
        )


class ConversationViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = _conv_qs(self.request.user)
        # Only show conversations that have at least one message in the list view
        if self.action == "list":
            return qs.annotate(
                message_count=Count("messages", distinct=True),
                latest_message_at=Max("messages__created_at"),
            ).filter(message_count__gt=0).order_by("-latest_message_at")
        return qs

    # ── start ──────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='start')
    def start(self, request):
        ja_id = request.data.get('job_application')
        if not ja_id:
            return Response({'detail': 'job_application gereklidir.'}, status=400)

        try:
            job_app = JobApplication.objects.select_related(
                'developer', 'job_post', 'job_post__recruiter'
            ).get(pk=ja_id)
        except JobApplication.DoesNotExist:
            return Response({'detail': 'Başvuru bulunamadı.'}, status=404)

        recruiter = job_app.job_post.recruiter
        developer = job_app.developer

        if request.user.role == User.Role.DEVELOPER and developer != request.user:
            return Response({'detail': 'Bu başvuruya erişim izniniz yok.'}, status=403)
        if request.user.role == User.Role.RECRUITER and recruiter != request.user:
            return Response({'detail': 'Bu başvuruya erişim izniniz yok.'}, status=403)

        # Return existing conversation for this application if present
        existing = _conv_qs(request.user).filter(job_application=job_app).first()
        if existing:
            return Response(ConversationSerializer(existing, context={'request': request}).data)

        conv = Conversation.objects.create(job_application=job_app, job_post=job_app.job_post)
        conv.participants.add(developer, recruiter)

        conv = _conv_qs(request.user).get(pk=conv.pk)
        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    # ── messages (GET + POST) ───────────────────────────────────────
    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        conv = self.get_object()

        if request.method == 'GET':
            msgs = Message.objects.filter(conversation=conv).select_related('sender')
            return Response(MessageSerializer(msgs, many=True).data)

        body = (request.data.get('body') or '').strip()
        if not body:
            return Response({'detail': 'Mesaj boş olamaz.'}, status=400)

        msg = Message.objects.create(conversation=conv, sender=request.user, body=body)
        now = timezone.now()
        Conversation.objects.filter(pk=conv.pk).update(updated_at=now, last_message_at=now)

        msg_dict = {
            "id": msg.id,
            "body": msg.body,
            "sender": msg.sender_id,
            "sender_name": request.user.get_full_name(),
            "is_read": False,
            "created_at": msg.created_at.isoformat(),
        }
        _broadcast_to_inbox(conv, msg_dict)

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    # ── mark-read ──────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        conv = self.get_object()
        conv.messages.exclude(sender=request.user).update(is_read=True)

        channel_layer = get_channel_layer()

        # Notify conversation group so the sender's DM detail updates Check → Eye
        async_to_sync(channel_layer.group_send)(
            f"conversation_{conv.id}",
            {
                "type": "messages.read",
                "reader_id": request.user.id,
                "conversation_id": conv.id,
            },
        )

        # Notify reader's own inbox so their unread count updates live
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}_inbox",
            {
                "type": "inbox.read",
                "conversation_id": conv.id,
                "reader_id": request.user.id,
            },
        )

        return Response({'detail': 'Okundu işaretlendi.'})

    # ── unread-count ───────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False,
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})

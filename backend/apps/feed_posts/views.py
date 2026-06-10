from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Count, Exists, OuterRef
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.conversations.models import Conversation, Message
from apps.conversations.views import _broadcast_to_inbox
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.users.models import User

from .models import FeedPost, PostComment, PostLike, PostRepost
from .serializers import FeedPostSerializer, PostCommentSerializer


class IsOwner(BasePermission):
    message = 'Bu işlem sadece gönderi sahibi tarafından yapılabilir.'

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.author == request.user
        )


def _build_shared_post_data(post):
    photo = None
    if post.author.profile_photo:
        try:
            photo = post.author.profile_photo.url
        except Exception:
            pass
    image = None
    if post.image:
        try:
            image = post.image.url
        except Exception:
            pass
    return {
        'id': post.id,
        'author_name': post.author.get_full_name() or post.author.email,
        'author_profile_photo': photo,
        'author_gender': getattr(post.author, 'gender', None),
        'content': post.content[:150] if post.content else '',
        'image': image,
        'created_at': post.created_at.isoformat(),
        'is_active': post.is_active,
    }


class FeedPostViewSet(ModelViewSet):
    serializer_class = FeedPostSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        if self.action in ('list', 'retrieve'):
            user = self.request.user if self.request.user.is_authenticated else None
            qs = (FeedPost.objects
                .select_related('author')
                .filter(is_active=True)
                .annotate(
                    likes_count=Count('likes', distinct=True),
                    comments_count=Count('comments', distinct=True),
                    reposts_count=Count('reposts', distinct=True),
                ))
            if user:
                qs = qs.annotate(
                    is_liked_by_me=Exists(PostLike.objects.filter(post=OuterRef('pk'), user=user)),
                    is_reposted_by_me=Exists(PostRepost.objects.filter(post=OuterRef('pk'), user=user)),
                )
            return qs
        if self.action in ('like', 'comments', 'repost', 'send_dm', 'manage_comment'):
            return FeedPost.objects.select_related('author').filter(is_active=True)
        return FeedPost.objects.select_related('author')

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'comments'):
            return []
        if self.action in ('create', 'like', 'repost', 'send_dm', 'manage_comment'):
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

    @action(detail=True, methods=['post'], url_path='like')
    def like(self, request, pk=None):
        post = self.get_object()
        like_obj, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if created:
            create_notification(
                recipient=post.author,
                actor=request.user,
                notification_type=Notification.Type.POST_LIKED,
                title=f'{request.user.get_full_name() or request.user.email} gönderini beğendi.',
                link='/feed',
            )
        else:
            like_obj.delete()

        likes_count = PostLike.objects.filter(post=post).count()
        return Response({
            'action': 'liked' if created else 'unliked',
            'likes_count': likes_count,
            'is_liked_by_me': created,
        })

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        post = self.get_object()

        if request.method == 'GET':
            qs = post.comments.select_related('user').all()
            return Response(PostCommentSerializer(qs, many=True, context={'request': request}).data)

        if not request.user.is_authenticated:
            return Response({'detail': 'Kimlik doğrulama gereklidir.'}, status=status.HTTP_401_UNAUTHORIZED)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'detail': 'Yorum içeriği boş olamaz.'}, status=status.HTTP_400_BAD_REQUEST)

        comment = PostComment.objects.create(user=request.user, post=post, content=content)
        create_notification(
            recipient=post.author,
            actor=request.user,
            notification_type=Notification.Type.POST_COMMENTED,
            title=f'{request.user.get_full_name() or request.user.email} gönderine yorum yaptı.',
            link='/feed',
        )
        return Response(
            PostCommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete', 'patch'], url_path=r'comments/(?P<comment_pk>[^/.]+)')
    def manage_comment(self, request, pk=None, comment_pk=None):
        post = self.get_object()
        try:
            comment = PostComment.objects.get(id=comment_pk, post=post)
        except PostComment.DoesNotExist:
            return Response({'detail': 'Yorum bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'DELETE':
            if request.user != comment.user and request.user != post.author:
                return Response({'detail': 'Bu yorumu silme yetkiniz yok.'}, status=status.HTTP_403_FORBIDDEN)
            comment_id = comment.id
            comment.delete()
            comments_count = PostComment.objects.filter(post=post).count()
            return Response({'deleted_comment_id': comment_id, 'comments_count': comments_count})

        # PATCH — edit comment (only comment author)
        if request.user != comment.user:
            return Response({'detail': 'Sadece kendi yorumunuzu düzenleyebilirsiniz.'}, status=status.HTTP_403_FORBIDDEN)
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'detail': 'Yorum içeriği boş olamaz.'}, status=status.HTTP_400_BAD_REQUEST)
        comment.content = content
        comment.save(update_fields=['content'])
        return Response(PostCommentSerializer(comment, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='repost')
    def repost(self, request, pk=None):
        post = self.get_object()
        repost_obj, created = PostRepost.objects.get_or_create(user=request.user, post=post)
        if created:
            create_notification(
                recipient=post.author,
                actor=request.user,
                notification_type=Notification.Type.POST_REPOSTED,
                title=f'{request.user.get_full_name() or request.user.email} gönderini repost etti.',
                link='/feed',
            )
        else:
            repost_obj.delete()

        reposts_count = PostRepost.objects.filter(post=post).count()
        return Response({
            'action': 'reposted' if created else 'unreposted',
            'reposts_count': reposts_count,
            'is_reposted_by_me': created,
        })

    @action(detail=True, methods=['post'], url_path='send-dm')
    def send_dm(self, request, pk=None):
        post = self.get_object()
        recipient_id = request.data.get('recipient_id')
        if not recipient_id:
            return Response({'detail': 'Alıcı belirtilmedi.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipient = User.objects.get(id=recipient_id, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        if recipient == request.user:
            return Response({'detail': 'Kendinize gönderi gönderemezsiniz.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = (Conversation.objects
            .filter(participants=request.user, job_application__isnull=True, job_post__isnull=True)
            .filter(participants=recipient)
            .first())

        if existing:
            conversation = existing
        else:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, recipient)

        post_preview = post.content[:80] if post.content else '[Görsel gönderi]'
        body = f'📎 Bir gönderi paylaştı: {post_preview}'
        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=body,
            shared_post=post,
        )
        now = timezone.now()
        Conversation.objects.filter(pk=conversation.pk).update(updated_at=now, last_message_at=now)

        shared_post_data = _build_shared_post_data(post)

        msg_dict = {
            'id': msg.id,
            'conversation': conversation.id,
            'sender': request.user.id,
            'sender_name': request.user.get_full_name(),
            'sender_role': request.user.role,
            'body': msg.body,
            'is_read': False,
            'created_at': msg.created_at.isoformat(),
            'shared_post_data': shared_post_data,
        }

        # Broadcast to open conversation detail (ChatWidget detail view)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'conversation_{conversation.id}',
            {'type': 'chat.message', 'message': msg_dict},
        )

        # Broadcast to inbox (conversation list in ChatWidget)
        conv_with_participants = (Conversation.objects
            .prefetch_related('participants')
            .select_related('job_post', 'job_application__job_post')
            .get(pk=conversation.pk))
        _broadcast_to_inbox(conv_with_participants, msg_dict)

        create_notification(
            recipient=recipient,
            actor=request.user,
            notification_type=Notification.Type.POST_SHARED_VIA_DM,
            title=f'{request.user.get_full_name() or request.user.email} sana bir gönderi iletti.',
            link='/messages',
        )

        return Response({
            'detail': 'Gönderi başarıyla iletildi.',
            'conversation_id': conversation.id,
            'message': msg_dict,
        })

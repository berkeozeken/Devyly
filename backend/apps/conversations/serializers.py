from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'sender', 'sender_name', 'sender_role',
                  'body', 'is_read', 'created_at')
        read_only_fields = ('id', 'conversation', 'sender', 'sender_name',
                            'sender_role', 'is_read', 'created_at')

    def get_sender_name(self, obj):
        return obj.sender.get_full_name()

    def get_sender_role(self, obj):
        return obj.sender.role


class ConversationSerializer(serializers.ModelSerializer):
    other_user            = serializers.SerializerMethodField()
    other_user_name       = serializers.SerializerMethodField()
    other_user_role       = serializers.SerializerMethodField()
    other_user_profile_photo = serializers.SerializerMethodField()
    other_user_gender     = serializers.SerializerMethodField()
    job_title             = serializers.SerializerMethodField()
    last_message          = serializers.SerializerMethodField()
    last_message_at       = serializers.SerializerMethodField()
    unread_count          = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id',
            'other_user', 'other_user_name', 'other_user_role',
            'other_user_profile_photo', 'other_user_gender',
            'job_application', 'job_post', 'job_title',
            'last_message', 'last_message_at', 'unread_count',
            'created_at', 'updated_at',
        )

    def _other(self, obj):
        if not hasattr(obj, '_other_cache'):
            request = self.context.get('request')
            participants = list(obj.participants.all())
            obj._other_cache = (
                next((p for p in participants if p.id != request.user.id), None)
                if request else None
            )
        return obj._other_cache

    def get_other_user(self, obj):
        u = self._other(obj)
        return u.id if u else None

    def get_other_user_name(self, obj):
        u = self._other(obj)
        return u.get_full_name() if u else ""

    def get_other_user_role(self, obj):
        u = self._other(obj)
        return u.role if u else ""

    def get_other_user_profile_photo(self, obj):
        u = self._other(obj)
        if not u or not u.profile_photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(u.profile_photo.url)
        return u.profile_photo.url

    def get_other_user_gender(self, obj):
        u = self._other(obj)
        return u.gender if u else None

    def get_job_title(self, obj):
        if obj.job_post_id:
            try:
                return obj.job_post.title
            except Exception:
                pass
        if obj.job_application_id:
            try:
                return obj.job_application.job_post.title
            except Exception:
                pass
        return None

    def get_last_message(self, obj):
        msgs = list(obj.messages.all())
        if not msgs:
            return None
        last = msgs[-1]
        return {
            'id': last.id,
            'body': last.body,
            'sender': last.sender_id,
            'sender_name': last.sender.get_full_name(),
            'is_read': last.is_read,
            'created_at': last.created_at.isoformat(),
        }

    def get_last_message_at(self, obj):
        msgs = list(obj.messages.all())
        if msgs:
            return msgs[-1].created_at.isoformat()
        if obj.last_message_at:
            return obj.last_message_at.isoformat()
        return obj.updated_at.isoformat()

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        msgs = list(obj.messages.all())
        return sum(1 for m in msgs if not m.is_read and m.sender_id != request.user.id)

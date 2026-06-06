from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            'id', 'actor', 'actor_name', 'actor_role',
            'type', 'title', 'message', 'link', 'is_read', 'created_at',
        )
        read_only_fields = ('id', 'actor', 'actor_name', 'actor_role', 'created_at')

    def get_actor_name(self, obj):
        return obj.actor.get_full_name() if obj.actor else None

    def get_actor_role(self, obj):
        return obj.actor.role if obj.actor else None

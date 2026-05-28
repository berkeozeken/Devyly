from rest_framework import serializers

from .models import EmailLog


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = (
            'id',
            'email_type',
            'recipient',
            'subject',
            'status',
            'provider',
            'error_message',
            'sent_at',
            'created_at',
        )
        read_only_fields = fields

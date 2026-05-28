from rest_framework import serializers

from apps.applications.models import Application

from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.none())
    application_position = serializers.CharField(source='application.position', read_only=True)
    company_name = serializers.CharField(source='application.company.name', read_only=True)

    class Meta:
        model = Interview
        fields = (
            'id',
            'application',
            'application_position',
            'company_name',
            'interview_date',
            'interview_type',
            'interviewer_name',
            'meeting_link',
            'notes',
            'result',
            'reminder_enabled',
            'reminder_sent_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'application_position',
            'company_name',
            'reminder_sent_at',
            'created_at',
            'updated_at',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['application'].queryset = Application.objects.filter(user=request.user)

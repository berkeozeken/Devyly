from rest_framework import serializers

from .models import InterviewRescheduleRequest, JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    developer_name = serializers.SerializerMethodField()
    developer_email = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job_post.title', read_only=True)
    company_name = serializers.CharField(source='job_post.company.name', read_only=True)
    recruiter_name = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = (
            'id',
            'developer',
            'developer_name',
            'developer_email',
            'job_post',
            'job_title',
            'company_name',
            'recruiter_name',
            'status',
            'cover_letter',
            'interview_date',
            'interview_link',
            'interview_note',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id', 'developer', 'developer_name', 'developer_email',
            'job_post', 'job_title', 'company_name', 'recruiter_name',
            'created_at', 'updated_at',
        )

    def get_developer_name(self, obj):
        return obj.developer.get_full_name()

    def get_developer_email(self, obj):
        return obj.developer.email

    def get_recruiter_name(self, obj):
        return obj.job_post.recruiter.get_full_name()


class ApplySerializer(serializers.Serializer):
    cover_letter = serializers.CharField(required=False, allow_blank=True, default='')


class StatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ('status', 'interview_date', 'interview_link', 'interview_note')


class InterviewRescheduleRequestSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_application.job_post.title', read_only=True)
    company_name = serializers.CharField(source='job_application.job_post.company.name', read_only=True)
    developer_name = serializers.SerializerMethodField()
    developer_email = serializers.SerializerMethodField()

    class Meta:
        model = InterviewRescheduleRequest
        fields = (
            'id',
            'job_application',
            'job_title',
            'company_name',
            'developer_name',
            'developer_email',
            'requested_by',
            'reason',
            'available_slots',
            'status',
            'recruiter_response',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id', 'job_application', 'job_title', 'company_name',
            'developer_name', 'developer_email', 'requested_by',
            'created_at', 'updated_at',
        )

    def get_developer_name(self, obj):
        return obj.requested_by.get_full_name()

    def get_developer_email(self, obj):
        return obj.requested_by.email


class CreateRescheduleRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default='')
    available_slots = serializers.CharField()


class RecruiterRescheduleResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewRescheduleRequest
        fields = ('status', 'recruiter_response')

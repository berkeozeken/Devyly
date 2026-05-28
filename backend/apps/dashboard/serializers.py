from rest_framework import serializers


class UpcomingInterviewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    interview_date = serializers.DateTimeField()
    interview_type = serializers.CharField()
    application_position = serializers.CharField()
    company_name = serializers.CharField()


class RecentApplicationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    position = serializers.CharField()
    company_name = serializers.CharField()
    status = serializers.CharField()
    applied_date = serializers.DateField()


class DashboardStatsSerializer(serializers.Serializer):
    total_applications = serializers.IntegerField()
    pending_applications = serializers.IntegerField()
    interview_applications = serializers.IntegerField()
    offer_applications = serializers.IntegerField()
    rejected_applications = serializers.IntegerField()
    accepted_applications = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    total_interviews = serializers.IntegerField()
    total_notes = serializers.IntegerField()
    upcoming_interviews = UpcomingInterviewSerializer(many=True)
    recent_applications = RecentApplicationSerializer(many=True)

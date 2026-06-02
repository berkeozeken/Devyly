from rest_framework import serializers

from .models import RecruiterProfile


class RecruiterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterProfile
        fields = (
            'id',
            'company_name',
            'company_website',
            'company_industry',
            'company_location',
            'position_title',
            'bio',
            'linkedin_url',
            'is_hiring',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

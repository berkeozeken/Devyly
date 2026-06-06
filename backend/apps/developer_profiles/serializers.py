from rest_framework import serializers

from .models import DeveloperProfile


class DeveloperProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeveloperProfile
        fields = (
            'id',
            'title',
            'bio',
            'skills',
            'github_url',
            'linkedin_url',
            'portfolio_url',
            'location',
            'years_of_experience',
            'is_open_to_work',
            'phone',
            'website',
            'languages',
            'education',
            'work_experience',
            'projects',
            'certificates',
            'cv_language_preference',
            'include_profile_photo_in_cv',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

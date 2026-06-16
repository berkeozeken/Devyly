from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = (
            'id',
            'name',
            'website',
            'industry',
            'location',
            'contact_person',
            'contact_email',
            'notes',
            'is_verified',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'is_verified', 'created_at', 'updated_at')

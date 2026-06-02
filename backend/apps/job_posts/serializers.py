from rest_framework import serializers

from apps.companies.models import Company

from .models import JobPost


class JobPostSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.none())
    company_name = serializers.CharField(source='company.name', read_only=True)
    recruiter_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobPost
        fields = (
            'id',
            'company',
            'company_name',
            'recruiter_name',
            'title',
            'description',
            'requirements',
            'location',
            'work_type',
            'salary_range',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'company_name', 'recruiter_name', 'created_at', 'updated_at')

    def get_recruiter_name(self, obj):
        return obj.recruiter.get_full_name()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['company'].queryset = Company.objects.filter(user=request.user)

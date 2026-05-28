from rest_framework import serializers

from apps.companies.models import Company

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.none())

    class Meta:
        model = Application
        fields = (
            'id',
            'company',
            'company_name',
            'position',
            'job_url',
            'status',
            'applied_date',
            'interview_date',
            'location',
            'work_type',
            'salary_range',
            'notes',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'company_name', 'created_at', 'updated_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['company'].queryset = Company.objects.filter(user=request.user)


class KanbanApplicationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'company', 'company_name', 'position', 'status', 'applied_date', 'work_type', 'location')
        read_only_fields = fields

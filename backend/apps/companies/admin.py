from django.contrib import admin
from django.utils import timezone

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_verified', 'verified_at', 'created_at')
    list_filter = ('is_verified',)
    search_fields = ('name', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'verified_at', 'verified_by')
    actions = ('verify_companies', 'unverify_companies')

    @admin.action(description='Seçili şirketleri doğrula')
    def verify_companies(self, request, queryset):
        now = timezone.now()
        for company in queryset.filter(is_verified=False):
            company.is_verified = True
            company.verified_at = now
            company.verified_by = request.user
            company.save(update_fields=['is_verified', 'verified_at', 'verified_by'])
        self.message_user(request, f'{queryset.count()} şirket doğrulandı.')

    @admin.action(description='Seçili şirketlerin doğrulamasını kaldır')
    def unverify_companies(self, request, queryset):
        count = queryset.filter(is_verified=True).update(
            is_verified=False, verified_at=None, verified_by=None
        )
        self.message_user(request, f'{count} şirketin doğrulaması kaldırıldı.')

from django.conf import settings
from django.db import models


class RecruiterProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recruiter_profile',
    )
    company_name = models.CharField(max_length=200, blank=True)
    company_website = models.URLField(blank=True)
    company_industry = models.CharField(max_length=150, blank=True)
    company_location = models.CharField(max_length=150, blank=True)
    position_title = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)
    is_hiring = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recruiter_profiles'

    def __str__(self):
        return f'{self.user.get_full_name()} — {self.company_name or "No company"}'

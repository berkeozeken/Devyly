from django.conf import settings
from django.db import models


class DeveloperProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='developer_profile',
    )
    title = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)
    is_open_to_work = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'developer_profiles'

    def __str__(self):
        return f'{self.user.get_full_name()} — {self.title or "No title"}'

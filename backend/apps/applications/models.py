from django.conf import settings
from django.db import models


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        IN_REVIEW = 'IN_REVIEW', 'In Review'
        INTERVIEW = 'INTERVIEW', 'Interview'
        OFFER = 'OFFER', 'Offer'
        REJECTED = 'REJECTED', 'Rejected'
        ACCEPTED = 'ACCEPTED', 'Accepted'

    class WorkType(models.TextChoices):
        REMOTE = 'REMOTE', 'Remote'
        HYBRID = 'HYBRID', 'Hybrid'
        ONSITE = 'ONSITE', 'Onsite'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='applications',
        null=True,
        blank=True,
    )
    position = models.CharField(max_length=255)
    job_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    applied_date = models.DateField()
    interview_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    work_type = models.CharField(max_length=10, choices=WorkType.choices, blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications'
        ordering = ['-applied_date', '-created_at']

    def __str__(self):
        company_name = self.company.name if self.company else '—'
        return f'{self.position} @ {company_name} [{self.status}]'

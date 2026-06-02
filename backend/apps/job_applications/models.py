from django.conf import settings
from django.db import models


class JobApplication(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        REVIEWING = 'REVIEWING', 'Reviewing'
        INTERVIEW = 'INTERVIEW', 'Interview'
        REJECTED = 'REJECTED', 'Rejected'
        ACCEPTED = 'ACCEPTED', 'Accepted'

    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_applications',
    )
    job_post = models.ForeignKey(
        'job_posts.JobPost',
        on_delete=models.CASCADE,
        related_name='applications',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    cover_letter = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_link = models.URLField(blank=True)
    interview_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_applications'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['developer', 'job_post'],
                name='unique_developer_job_post',
            )
        ]

    def __str__(self):
        return f'{self.developer.email} → {self.job_post.title} [{self.status}]'


class InterviewRescheduleRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    job_application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='reschedule_requests',
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interview_reschedule_requests',
    )
    reason = models.TextField(blank=True)
    available_slots = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    recruiter_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interview_reschedule_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'Reschedule for {self.job_application} [{self.status}]'

from django.conf import settings
from django.db import models


class Interview(models.Model):
    class InterviewType(models.TextChoices):
        HR = 'HR', 'HR'
        TECHNICAL = 'TECHNICAL', 'Technical'
        CASE_STUDY = 'CASE_STUDY', 'Case Study'
        FINAL = 'FINAL', 'Final'

    class Result(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PASSED = 'PASSED', 'Passed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interviews',
    )
    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='interviews',
    )
    interview_date = models.DateTimeField()
    interview_type = models.CharField(max_length=20, choices=InterviewType.choices)
    interviewer_name = models.CharField(max_length=255, blank=True)
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.PENDING)
    reminder_enabled = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interviews'
        ordering = ['interview_date']

    def __str__(self):
        return f'{self.interview_type} — {self.application} [{self.result}]'

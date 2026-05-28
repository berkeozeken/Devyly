from django.conf import settings
from django.db import models


class EmailLog(models.Model):
    class EmailType(models.TextChoices):
        WELCOME = 'WELCOME', 'Welcome'
        PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'
        INTERVIEW_REMINDER = 'INTERVIEW_REMINDER', 'Interview Reminder'
        APPLICATION_FOLLOW_UP = 'APPLICATION_FOLLOW_UP', 'Application Follow Up'

    class EmailStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs',
    )
    email_type = models.CharField(max_length=30, choices=EmailType.choices)
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=EmailStatus.choices, default=EmailStatus.PENDING)
    provider = models.CharField(max_length=50, blank=True, default='console')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.email_type} → {self.recipient} [{self.status}]'

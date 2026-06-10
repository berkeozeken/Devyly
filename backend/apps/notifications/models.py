from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        APPLICATION_RECEIVED       = 'APPLICATION_RECEIVED',       'Application Received'
        APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED', 'Application Status Changed'
        INTERVIEW_SCHEDULED        = 'INTERVIEW_SCHEDULED',        'Interview Scheduled'
        INTERVIEW_UPDATED          = 'INTERVIEW_UPDATED',          'Interview Updated'
        RESCHEDULE_REQUESTED       = 'RESCHEDULE_REQUESTED',       'Reschedule Requested'
        RESCHEDULE_ACCEPTED        = 'RESCHEDULE_ACCEPTED',        'Reschedule Accepted'
        RESCHEDULE_REJECTED        = 'RESCHEDULE_REJECTED',        'Reschedule Rejected'
        MESSAGE_RECEIVED           = 'MESSAGE_RECEIVED',           'Message Received'
        POST_LIKED                 = 'POST_LIKED',                 'Post Liked'
        POST_COMMENTED             = 'POST_COMMENTED',             'Post Commented'
        POST_REPOSTED              = 'POST_REPOSTED',              'Post Reposted'
        POST_SHARED_VIA_DM         = 'POST_SHARED_VIA_DM',         'Post Shared via DM'
        GENERAL                    = 'GENERAL',                    'General'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_notifications',
    )
    type = models.CharField(max_length=50, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title} → {self.recipient.email}'

from django.conf import settings
from django.db import models


class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes',
    )
    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='application_notes',
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.application}'

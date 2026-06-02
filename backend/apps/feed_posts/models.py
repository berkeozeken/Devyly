from django.conf import settings
from django.db import models


class FeedPost(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feed_posts',
    )
    content = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='feed_posts/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        preview = self.content[:50] if self.content else '[image]'
        return f'{preview} — {self.author.email}'

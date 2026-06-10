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


class PostLike(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_likes',
    )
    post = models.ForeignKey(
        FeedPost,
        on_delete=models.CASCADE,
        related_name='likes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_post_like'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} liked post #{self.post_id}'


class PostComment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_comments',
    )
    post = models.ForeignKey(
        FeedPost,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.email} commented on post #{self.post_id}'


class PostRepost(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_reposts',
    )
    post = models.ForeignKey(
        FeedPost,
        on_delete=models.CASCADE,
        related_name='reposts',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_post_repost'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} reposted post #{self.post_id}'

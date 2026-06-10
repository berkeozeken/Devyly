from django.conf import settings
from django.db import models
from django.utils import timezone


class PhoneOTP(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='phone_otps',
    )
    phone_number = models.CharField(max_length=20)
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'phone_otps'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} | {self.phone_number} | used={self.is_used}'

    @property
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

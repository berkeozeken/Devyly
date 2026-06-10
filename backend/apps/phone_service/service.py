import logging
import random
import re
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    return re.sub(r'[\s\-\(\)]', '', phone.strip())


class PhoneService:
    OTP_EXPIRY_MINUTES = 10
    COOLDOWN_SECONDS = 60

    @staticmethod
    def _generate_code() -> str:
        return f'{random.randint(0, 999999):06d}'

    @classmethod
    def send_otp(cls, user, phone_number: str, code: str) -> None:
        # Local: log only. Replace with SMS provider integration in production.
        logger.info('[OTP] user=%s phone=%s code=%s', user.email, phone_number, code)
        print(f'\n[DEVYLY OTP] {user.email} | {phone_number} | Code: {code}\n', flush=True)

    @classmethod
    def request_otp(cls, user, phone_number: str):
        """
        Create and deliver an OTP for the given phone number.
        Returns (otp, error_key | None). error_key: 'cooldown'.
        """
        from .models import PhoneOTP

        cooldown_after = timezone.now() - timedelta(seconds=cls.COOLDOWN_SECONDS)
        if PhoneOTP.objects.filter(
            user=user,
            phone_number=phone_number,
            created_at__gte=cooldown_after,
        ).exists():
            return None, 'cooldown'

        code = cls._generate_code()
        expires_at = timezone.now() + timedelta(minutes=cls.OTP_EXPIRY_MINUTES)
        otp = PhoneOTP.objects.create(
            user=user,
            phone_number=phone_number,
            code=code,
            expires_at=expires_at,
        )
        cls.send_otp(user, phone_number, code)
        return otp, None

    @classmethod
    def verify_otp(cls, user, phone_number: str, code: str):
        """
        Verify OTP and mark phone as verified if correct.
        Returns (success: bool, error_message | None).
        """
        from .models import PhoneOTP

        try:
            otp = PhoneOTP.objects.filter(
                user=user,
                phone_number=phone_number,
                code=code,
                is_used=False,
            ).latest('created_at')
        except PhoneOTP.DoesNotExist:
            return False, 'Geçersiz doğrulama kodu.'

        if timezone.now() > otp.expires_at:
            return False, 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin.'

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        user.phone_number = phone_number
        user.is_phone_verified = True
        user.save(update_fields=['phone_number', 'is_phone_verified'])

        return True, None

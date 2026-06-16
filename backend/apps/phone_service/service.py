import logging
import random
import re
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    return re.sub(r'[\s\-\(\)]', '', phone.strip())


def _is_production() -> bool:
    return not settings.DEBUG


def _check_phone_unique(phone_number: str, exclude_user_pk: int) -> bool:
    """Returns True if phone is already verified by another user."""
    from apps.users.models import User
    return User.objects.filter(
        phone_number=phone_number,
        is_phone_verified=True,
    ).exclude(pk=exclude_user_pk).exists()


class PhoneService:
    OTP_EXPIRY_MINUTES = 10
    COOLDOWN_SECONDS = 60

    @staticmethod
    def _generate_code() -> str:
        return f'{random.randint(0, 999999):06d}'

    @classmethod
    def _send_via_twilio(cls, phone_number: str) -> None:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verifications.create(
            to=phone_number,
            channel='sms',
        )

    @classmethod
    def _check_via_twilio(cls, phone_number: str, code: str) -> bool:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        check = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID).verification_checks.create(
            to=phone_number,
            code=code,
        )
        return check.status == 'approved'

    @classmethod
    def request_otp(cls, user, phone_number: str):
        """
        Initiate phone verification.
        Returns (otp_or_None, error_key | None).
        error_key: 'cooldown' | 'duplicate_phone' | 'send_error'
        """
        from .models import PhoneOTP

        if _check_phone_unique(phone_number, user.pk):
            return None, 'duplicate_phone'

        cooldown_after = timezone.now() - timedelta(seconds=cls.COOLDOWN_SECONDS)
        if PhoneOTP.objects.filter(
            user=user,
            phone_number=phone_number,
            created_at__gte=cooldown_after,
        ).exists():
            return None, 'cooldown'

        expires_at = timezone.now() + timedelta(minutes=cls.OTP_EXPIRY_MINUTES)

        if _is_production():
            try:
                cls._send_via_twilio(phone_number)
            except Exception as exc:
                logger.error('[OTP] Twilio send error: %s', exc)
                return None, 'send_error'
            otp = PhoneOTP.objects.create(
                user=user,
                phone_number=phone_number,
                code='',
                expires_at=expires_at,
            )
        else:
            code = cls._generate_code()
            otp = PhoneOTP.objects.create(
                user=user,
                phone_number=phone_number,
                code=code,
                expires_at=expires_at,
            )
            logger.info('[OTP] user=%s phone=%s code=%s', user.email, phone_number, code)
            print(f'\n[DEVYLY OTP] {user.email} | {phone_number} | Code: {code}\n', flush=True)

        return otp, None

    @classmethod
    def verify_otp(cls, user, phone_number: str, code: str):
        """
        Verify OTP and mark phone as verified if correct.
        Returns (success: bool, error_message | None).
        """
        from .models import PhoneOTP

        if _check_phone_unique(phone_number, user.pk):
            return False, 'Bu telefon numarası başka bir hesapta kullanılıyor.'

        if _is_production():
            try:
                approved = cls._check_via_twilio(phone_number, code)
            except Exception as exc:
                logger.error('[OTP] Twilio verify error: %s', exc)
                return False, 'Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.'
            if not approved:
                return False, 'Geçersiz veya süresi dolmuş doğrulama kodu.'
        else:
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

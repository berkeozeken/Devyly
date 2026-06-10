import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailLog

logger = logging.getLogger(__name__)


class EmailService:
    """Merkezi email gönderim servisi. Her metod kendi EmailLog kaydını oluşturur."""

    @staticmethod
    def _send(email_type, subject, body, recipient, user=None):
        """Log oluştur, gönder, durumu güncelle. Exception fırlatmaz."""
        log = EmailLog.objects.create(
            email_type=email_type,
            recipient=recipient,
            subject=subject,
            user=user,
        )
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            log.status = EmailLog.EmailStatus.SENT
            log.sent_at = timezone.now()
        except Exception as exc:
            log.status = EmailLog.EmailStatus.FAILED
            log.error_message = str(exc)
            logger.warning('Email gönderilemedi (%s → %s): %s', email_type, recipient, exc)
        finally:
            log.save()

    @classmethod
    def send_welcome_email(cls, user):
        if getattr(user, 'role', '') == 'DEVELOPER':
            role_note = "Yeteneklerini sergile, iş ilanlarına başvur ve kariyerini geliştir."
        else:
            role_note = "Yetenekli adayları keşfet ve ekibini büyüt."

        subject = "Devyly'e Hoş Geldin!"
        body = (
            f"Merhaba {user.first_name or user.email},\n\n"
            f"Devyly'e hoş geldin! {role_note}\n\n"
            "Profilini tamamlayarak diğer kullanıcılarla bağlantı kurabilirsin.\n\n"
            "— Devyly Ekibi"
        )
        cls._send(EmailLog.EmailType.WELCOME, subject, body, user.email, user=user)

    @classmethod
    def send_password_reset_email(cls, user, reset_link):
        subject = "Devyly — Şifre Sıfırlama"
        body = (
            f"Merhaba {user.first_name or user.email},\n\n"
            "Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n"
            f"{reset_link}\n\n"
            "Bu isteği siz yapmadıysanız bu emaili görmezden gelebilirsiniz.\n\n"
            "— Devyly Ekibi"
        )
        cls._send(EmailLog.EmailType.PASSWORD_RESET, subject, body, user.email, user=user)

    @classmethod
    def send_verified_welcome_email(cls, user):
        if getattr(user, 'role', '') == 'DEVELOPER':
            role_note = "Artık iş ilanlarına başvurabilir, yeteneklerini sergileyebilir ve kariyerini geliştirebilirsin."
        else:
            role_note = "Artık yetenekli adayları keşfedebilir ve ekibini büyütebilirsin."

        subject = "Devyly'ye Hoş Geldin!"
        body = (
            f"Merhaba {user.first_name or user.email},\n\n"
            "Email adresin başarıyla doğrulandı. Devyly hesabın artık hazır.\n\n"
            f"{role_note}\n\n"
            "Profilini tamamlayarak diğer kullanıcılarla bağlantı kurabilirsin.\n\n"
            "— Devyly Ekibi"
        )
        cls._send(EmailLog.EmailType.WELCOME, subject, body, user.email, user=user)

    @classmethod
    def send_email_verification_email(cls, user, verify_link):
        subject = "Devyly — Email Adresinizi Doğrulayın"
        body = (
            f"Merhaba {user.first_name or user.email},\n\n"
            "Devyly hesabınızı aktive etmek için aşağıdaki linke tıklayın:\n\n"
            f"{verify_link}\n\n"
            "Bu link 24 saat geçerlidir.\n\n"
            "Bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.\n\n"
            "— Devyly Ekibi"
        )
        cls._send(EmailLog.EmailType.EMAIL_VERIFICATION, subject, body, user.email, user=user)

    @classmethod
    def send_application_status_email(cls, application):
        developer = application.developer
        if not developer.email:
            return
        job_title = application.job_post.title
        new_status = application.get_status_display()
        subject = "Devyly — Başvuru durumun güncellendi"
        body = (
            f"Merhaba {developer.first_name or developer.email},\n\n"
            f'"{job_title}" ilanına yaptığın başvurunun durumu '
            f'"{new_status}" olarak güncellendi.\n\n'
            "Detaylar için uygulamayı ziyaret edebilirsin.\n\n"
            "— Devyly Ekibi"
        )
        cls._send(
            EmailLog.EmailType.APPLICATION_STATUS_CHANGED,
            subject,
            body,
            developer.email,
            user=developer,
        )

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.phone_service.views import PhoneVerificationConfirmView, PhoneVerificationRequestView

from .views import (
    EmailVerificationConfirmView,
    LoginView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    ResendEmailVerificationView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='auth-password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('email-verification/verify/', EmailVerificationConfirmView.as_view(), name='auth-email-verification-verify'),
    path('email-verification/resend/', ResendEmailVerificationView.as_view(), name='auth-email-verification-resend'),
    path('phone-verification/request/', PhoneVerificationRequestView.as_view(), name='auth-phone-verification-request'),
    path('phone-verification/verify/', PhoneVerificationConfirmView.as_view(), name='auth-phone-verification-verify'),
]

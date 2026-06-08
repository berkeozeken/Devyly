from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.developer_profiles.models import DeveloperProfile
from apps.email_service.models import EmailLog
from apps.recruiter_profiles.models import RecruiterProfile

from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicDeveloperListSerializer,
    PublicDeveloperProfileSerializer,
    PublicRecruiterListSerializer,
    PublicRecruiterProfileSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=RegisterSerializer,
        responses={201: OpenApiResponse(
            response=inline_serializer(
                name='RegisterResponse',
                fields={
                    'user': UserSerializer(),
                    'access': serializers.CharField(),
                    'refresh': serializers.CharField(),
                },
            ),
            description='Kullanıcı oluşturuldu, JWT tokenlar döndü.',
        )},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=LoginSerializer,
        responses={200: OpenApiResponse(
            response=inline_serializer(
                name='LoginResponse',
                fields={
                    'user': UserSerializer(),
                    'access': serializers.CharField(),
                    'refresh': serializers.CharField(),
                },
            ),
            description='Giriş başarılı, JWT tokenlar döndü.',
        )},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class MeView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiResponse(description='Reset linki email ile gönderildi.')},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        log_defaults = dict(
            email_type=EmailLog.EmailType.PASSWORD_RESET,
            recipient=email,
            subject='Devyly — Şifre Sıfırlama',
        )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Güvenlik: email var mı yok mu belli etme
            return Response({'detail': 'Eğer bu email kayıtlıysa reset linki gönderildi.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        reset_link = f"{_get_frontend_url()}/reset-password?uid={uid}&token={token}"

        log = EmailLog.objects.create(**log_defaults, user=user)
        try:
            send_mail(
                subject='Devyly — Şifre Sıfırlama',
                message=f'Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n{reset_link}\n\nUID: {uid}\nToken: {token}',
                from_email='noreply@devyly.com',
                recipient_list=[email],
                fail_silently=False,
            )
            log.status = EmailLog.EmailStatus.SENT
            log.sent_at = timezone.now()
        except Exception as e:
            log.status = EmailLog.EmailStatus.FAILED
            log.error_message = str(e)
        finally:
            log.save()

        return Response({'detail': 'Eğer bu email kayıtlıysa reset linki gönderildi.'})


class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: OpenApiResponse(description='Şifre başarıyla sıfırlandı.')},
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Geçersiz link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({'detail': 'Link geçersiz veya süresi dolmuş.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Şifre başarıyla sıfırlandı.'})


def _get_frontend_url():
    from django.conf import settings
    return getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')


class PublicDeveloperListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        qs = DeveloperProfile.objects.select_related('user').filter(user__is_active=True)
        search = request.query_params.get('search', '').strip()
        location = request.query_params.get('location', '').strip()
        open_to_work = request.query_params.get('open_to_work', '').strip()
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(title__icontains=search) |
                Q(skills__icontains=search)
            )
        if location:
            qs = qs.filter(location__icontains=location)
        if open_to_work == 'true':
            qs = qs.filter(is_open_to_work=True)
        serializer = PublicDeveloperListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicRecruiterListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        qs = RecruiterProfile.objects.select_related('user').filter(user__is_active=True)
        search = request.query_params.get('search', '').strip()
        location = request.query_params.get('location', '').strip()
        is_hiring = request.query_params.get('is_hiring', '').strip()
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(company_industry__icontains=search)
            )
        if location:
            qs = qs.filter(company_location__icontains=location)
        if is_hiring == 'true':
            qs = qs.filter(is_hiring=True)
        serializer = PublicRecruiterListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PublicUserProfileView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        user_data = UserSerializer(user, context={'request': request}).data

        developer_profile = None
        recruiter_profile = None

        if user.role == User.Role.DEVELOPER:
            try:
                developer_profile = PublicDeveloperProfileSerializer(user.developer_profile).data
            except Exception:
                pass
        elif user.role == User.Role.RECRUITER:
            try:
                recruiter_profile = PublicRecruiterProfileSerializer(user.recruiter_profile).data
            except Exception:
                pass

        return Response({
            'user': user_data,
            'developer_profile': developer_profile,
            'recruiter_profile': recruiter_profile,
        })

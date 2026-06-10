import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.db import transaction
from django.db.models import Q
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
from apps.email_service.service import EmailService
from apps.recruiter_profiles.models import RecruiterProfile

logger = logging.getLogger(__name__)

from .serializers import (
    EmailVerificationConfirmSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicDeveloperListSerializer,
    PublicDeveloperProfileSerializer,
    PublicRecruiterListSerializer,
    PublicRecruiterProfileSerializer,
    RegisterSerializer,
    ResendEmailVerificationSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)

User = get_user_model()
password_reset_token_generator = PasswordResetTokenGenerator()


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return str(user.pk) + str(timestamp) + str(user.is_email_verified)


email_verification_token_generator = EmailVerificationTokenGenerator()


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
        with transaction.atomic():
            user = serializer.save()
            if user.role == User.Role.DEVELOPER:
                DeveloperProfile.objects.get_or_create(user=user)
            elif user.role == User.Role.RECRUITER:
                RecruiterProfile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        try:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token_generator.make_token(user)
            verify_link = f"{_get_frontend_url()}/verify-email?uid={uid}&token={token}"
            EmailService.send_email_verification_email(user, verify_link)
        except Exception as exc:
            logger.warning('Verification email gönderilemedi (user=%s): %s', user.email, exc)
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

        if user.is_email_verified and not user.has_received_welcome_email:
            user.has_received_welcome_email = True
            user.save(update_fields=['has_received_welcome_email'])
            try:
                EmailService.send_verified_welcome_email(user)
            except Exception as exc:
                logger.warning('Verified welcome email gönderilemedi (user=%s): %s', user.email, exc)

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

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Güvenlik: email var mı yok mu belli etme
            return Response({'detail': 'Eğer bu email kayıtlıysa reset linki gönderildi.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = password_reset_token_generator.make_token(user)
        reset_link = f"{_get_frontend_url()}/reset-password?uid={uid}&token={token}"

        EmailService.send_password_reset_email(user, reset_link)

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

        if not password_reset_token_generator.check_token(user, token):
            return Response({'detail': 'Link geçersiz veya süresi dolmuş.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Şifre başarıyla sıfırlandı.'})


class EmailVerificationConfirmView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=EmailVerificationConfirmSerializer,
        responses={200: OpenApiResponse(description='Email doğrulandı.')},
    )
    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Geçersiz doğrulama linki.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_email_verified:
            return Response({'detail': 'Email adresiniz zaten doğrulanmış.'})

        if not email_verification_token_generator.check_token(user, token):
            return Response({'detail': 'Doğrulama linki geçersiz veya süresi dolmuş.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])

        return Response({'detail': 'Email adresiniz başarıyla doğrulandı.'})


class ResendEmailVerificationView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        request=ResendEmailVerificationSerializer,
        responses={200: OpenApiResponse(description='Verification email gönderildi.')},
    )
    def post(self, request):
        from django.utils import timezone as tz
        from datetime import timedelta
        from apps.email_service.models import EmailLog

        serializer = ResendEmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Email kayıtlıysa doğrulama bağlantısı gönderildi.'})

        if user.is_email_verified:
            return Response({'detail': 'Email adresiniz zaten doğrulanmış.'})

        # Basit rate limit: son 5 dakikada aynı type email gönderildi mi?
        cooldown = tz.now() - timedelta(minutes=5)
        recent = EmailLog.objects.filter(
            user=user,
            email_type=EmailLog.EmailType.EMAIL_VERIFICATION,
            created_at__gte=cooldown,
        ).exists()
        if recent:
            return Response({'detail': 'Çok sık istek gönderiyorsunuz. Lütfen birkaç dakika bekleyin.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token_generator.make_token(user)
            verify_link = f"{_get_frontend_url()}/verify-email?uid={uid}&token={token}"
            EmailService.send_email_verification_email(user, verify_link)
        except Exception as exc:
            logger.warning('Resend verification email gönderilemedi (user=%s): %s', user.email, exc)

        return Response({'detail': 'Email kayıtlıysa doğrulama bağlantısı gönderildi.'})


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


class PublicUserPostsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        from apps.feed_posts.models import FeedPost, PostLike, PostRepost
        from apps.feed_posts.serializers import FeedPostSerializer
        from django.db.models import Count, Exists, OuterRef

        try:
            user = User.objects.get(pk=pk, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        viewer = request.user if request.user.is_authenticated else None

        def annotate_posts(qs):
            qs = qs.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True),
                reposts_count=Count('reposts', distinct=True),
            )
            if viewer:
                qs = qs.annotate(
                    is_liked_by_me=Exists(PostLike.objects.filter(post=OuterRef('pk'), user=viewer)),
                    is_reposted_by_me=Exists(PostRepost.objects.filter(post=OuterRef('pk'), user=viewer)),
                )
            return qs

        ctx = {'request': request}

        own_posts = list(annotate_posts(
            FeedPost.objects.select_related('author').filter(author=user, is_active=True)
        ))

        repost_objs = list(
            PostRepost.objects
            .filter(user=user, post__is_active=True)
            .select_related('post')
            .order_by('-created_at')
        )
        repost_post_ids = [r.post_id for r in repost_objs]
        reposted_posts_map = {}
        if repost_post_ids:
            reposted_posts_map = {
                p.id: p for p in annotate_posts(
                    FeedPost.objects.select_related('author').filter(id__in=repost_post_ids, is_active=True)
                )
            }

        items = []
        for post in own_posts:
            items.append({
                'type': 'post',
                'sort_at': post.created_at.isoformat(),
                'post': FeedPostSerializer(post, context=ctx).data,
            })
        for repost_obj in repost_objs:
            post = reposted_posts_map.get(repost_obj.post_id)
            if not post:
                continue
            items.append({
                'type': 'repost',
                'sort_at': repost_obj.created_at.isoformat(),
                'repost_id': repost_obj.id,
                'repost_at': repost_obj.created_at.isoformat(),
                'post': FeedPostSerializer(post, context=ctx).data,
            })

        items.sort(key=lambda x: x['sort_at'], reverse=True)
        return Response(items)

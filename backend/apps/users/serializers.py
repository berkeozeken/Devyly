import os

from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers

User = get_user_model()

ALLOWED_PHOTO_EXTENSIONS = {'.jpg', '.jpeg', '.png'}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        default=User.Role.DEVELOPER,
        required=False,
    )

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password_confirm', 'role')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Şifreler eşleşmiyor.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Geçersiz email veya şifre.')
        if not user.is_active:
            raise serializers.ValidationError('Hesap aktif değil.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role',
            'profile_photo', 'gender',
            'is_active', 'date_joined',
        )
        read_only_fields = fields

    def get_profile_photo(self, obj):
        if not obj.profile_photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return obj.profile_photo.url


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    remove_profile_photo = serializers.BooleanField(write_only=True, required=False)
    gender = serializers.ChoiceField(
        choices=User.Gender.choices,
        allow_null=True,
        allow_blank=True,
        required=False,
    )

    class Meta:
        model = User
        fields = ('profile_photo', 'gender', 'remove_profile_photo')

    def validate_profile_photo(self, value):
        if not value:
            return value
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_PHOTO_EXTENSIONS:
            raise serializers.ValidationError(
                'Sadece .jpg, .jpeg ve .png formatları desteklenmektedir.'
            )
        return value

    def update(self, instance, validated_data):
        remove_photo = validated_data.pop('remove_profile_photo', False)
        if remove_photo and instance.profile_photo:
            instance.profile_photo.delete(save=False)
            instance.profile_photo = None
        if 'gender' in validated_data and validated_data['gender'] == '':
            validated_data['gender'] = None
        return super().update(instance, validated_data)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Şifreler eşleşmiyor.'})
        return data

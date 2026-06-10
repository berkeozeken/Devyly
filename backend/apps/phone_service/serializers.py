import re

from rest_framework import serializers

from .service import normalize_phone


class PhoneVerificationRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value):
        normalized = normalize_phone(value)
        if not re.match(r'^\+?\d{7,15}$', normalized):
            raise serializers.ValidationError('Geçerli bir telefon numarası girin.')
        return normalized


class PhoneVerificationConfirmSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_phone_number(self, value):
        return normalize_phone(value)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Kod yalnızca rakamlardan oluşmalıdır.')
        return value

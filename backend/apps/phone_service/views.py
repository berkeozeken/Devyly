from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PhoneVerificationConfirmSerializer, PhoneVerificationRequestSerializer
from .service import PhoneService


class PhoneVerificationRequestView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PhoneVerificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data['phone_number']

        _, error = PhoneService.request_otp(request.user, phone_number)
        if error == 'cooldown':
            return Response(
                {'detail': 'Lütfen 60 saniye bekleyip tekrar deneyin.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response({'detail': 'Doğrulama kodu gönderildi.'})


class PhoneVerificationConfirmView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PhoneVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data['phone_number']
        code = serializer.validated_data['code']

        success, error = PhoneService.verify_otp(request.user, phone_number, code)
        if not success:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Telefon numaranız başarıyla doğrulandı.'})

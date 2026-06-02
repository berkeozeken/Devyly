import os

from rest_framework import serializers

from .models import FeedPost

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png'}


class FeedPostSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    author_name = serializers.SerializerMethodField(read_only=True)
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    author_profile_photo = serializers.SerializerMethodField(read_only=True)
    author_gender = serializers.SerializerMethodField(read_only=True)
    remove_image = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = FeedPost
        fields = (
            'id',
            'author',
            'author_name',
            'author_email',
            'author_role',
            'author_profile_photo',
            'author_gender',
            'content',
            'image',
            'remove_image',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'author',
            'author_name',
            'author_email',
            'author_role',
            'author_profile_photo',
            'author_gender',
            'is_active',
            'created_at',
            'updated_at',
        )

    def get_author_name(self, obj):
        full_name = obj.author.get_full_name()
        return full_name if full_name else obj.author.email

    def get_author_profile_photo(self, obj):
        if not obj.author.profile_photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.author.profile_photo.url)
        return obj.author.profile_photo.url

    def get_author_gender(self, obj):
        return obj.author.gender or None

    def validate_image(self, value):
        if not value:
            return value
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise serializers.ValidationError(
                'Sadece .jpg, .jpeg ve .png formatları desteklenmektedir.'
            )
        return value

    def validate(self, attrs):
        remove_image = attrs.get('remove_image', False)

        if self.partial:
            instance = self.instance
            final_content = attrs.get('content', instance.content if instance else '').strip()
            new_image = attrs.get('image')
            if new_image:
                final_image = new_image
            elif remove_image:
                final_image = None
            else:
                final_image = instance.image if instance else None

            if not final_content and not final_image:
                raise serializers.ValidationError(
                    'Gönderi içeriği veya görsel zorunludur.'
                )
        else:
            content = attrs.get('content', '').strip()
            image = attrs.get('image')
            if not content and not image:
                raise serializers.ValidationError(
                    'Gönderi içeriği veya görsel zorunludur.'
                )

        return attrs

    def create(self, validated_data):
        validated_data.pop('remove_image', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_image = validated_data.pop('remove_image', False)
        if remove_image and instance.image:
            instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)

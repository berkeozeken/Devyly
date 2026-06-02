from django.contrib import admin

from .models import FeedPost


@admin.register(FeedPost)
class FeedPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'short_content', 'is_active', 'created_at')
    search_fields = ('content', 'author__email')
    list_filter = ('is_active', 'created_at')

    def short_content(self, obj):
        return obj.content[:80]
    short_content.short_description = 'İçerik'

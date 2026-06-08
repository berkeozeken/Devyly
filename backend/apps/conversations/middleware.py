from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _user_from_token(token_key):
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken, TokenError

    User = get_user_model()
    try:
        token = AccessToken(token_key)
        user_id = token["user_id"]
        return User.objects.get(pk=user_id, is_active=True)
    except (TokenError, KeyError, User.DoesNotExist, Exception):
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        if scope.get("type") in ("websocket", "http"):
            qs = scope.get("query_string", b"").decode()
            token_list = parse_qs(qs).get("token", [])
            token_key = token_list[0] if token_list else None
            scope["user"] = await _user_from_token(token_key) if token_key else AnonymousUser()
        return await super().__call__(scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)

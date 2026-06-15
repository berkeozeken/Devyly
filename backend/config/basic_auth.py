import base64
import binascii

from django.conf import settings
from django.http import HttpResponse


def _unauthorized() -> HttpResponse:
    res = HttpResponse("Unauthorized", status=401)
    res["WWW-Authenticate"] = 'Basic realm="Devyly API Docs"'
    return res


def docs_basic_auth(view_func):
    """Wrap a view with HTTP Basic Auth using DOCS_BASIC_AUTH_* settings."""
    def wrapper(request, *args, **kwargs):
        expected_user = getattr(settings, "DOCS_BASIC_AUTH_USERNAME", "")
        expected_pass = getattr(settings, "DOCS_BASIC_AUTH_PASSWORD", "")

        # Skip protection when credentials are not configured
        if not expected_user or not expected_pass:
            return view_func(request, *args, **kwargs)

        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Basic "):
            return _unauthorized()

        try:
            decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
            username, _, password = decoded.partition(":")
        except (binascii.Error, UnicodeDecodeError):
            return _unauthorized()

        if username != expected_user or password != expected_pass:
            return _unauthorized()

        return view_func(request, *args, **kwargs)

    wrapper.__name__ = view_func.__name__
    wrapper.__module__ = view_func.__module__
    return wrapper

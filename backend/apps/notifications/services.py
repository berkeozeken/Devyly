from .models import Notification


def create_notification(*, recipient, actor=None, notification_type, title, message="", link=""):
    if not recipient:
        return None
    if actor and actor == recipient:
        return None
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        type=notification_type,
        title=title,
        message=message,
        link=link,
    )

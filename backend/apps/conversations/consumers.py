from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from .models import Conversation, Message


class ConversationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4001)
            return

        try:
            self.conversation_id = int(self.scope["url_route"]["kwargs"]["conversation_id"])
        except (KeyError, ValueError):
            await self.close(code=4000)
            return

        self.group_name = f"conversation_{self.conversation_id}"

        if not await self._is_participant(user, self.conversation_id):
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def receive_json(self, content):
        user = self.scope["user"]
        event_type = content.get("type", "message")

        if event_type == "typing":
            is_typing = bool(content.get("is_typing", False))
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.typing",
                    "user_id": user.id,
                    "user_name": user.get_full_name(),
                    "is_typing": is_typing,
                },
            )
            return

        body = (content.get("body") or "").strip()
        if not body:
            return

        data = await self._save_message(user, self.conversation_id, body)

        # Broadcast to conversation group (DM detail view — typing, read receipts)
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "chat.message", "message": data},
        )

        # Broadcast to each participant's inbox group (live inbox list update)
        inbox_payloads = await self._build_inbox_payloads(self.conversation_id, data)
        for payload in inbox_payloads:
            await self.channel_layer.group_send(
                f"user_{payload['viewer_id']}_inbox",
                {
                    "type": "inbox.message",
                    "conversation": payload["conversation"],
                    "message": payload["message"],
                },
            )

    async def chat_message(self, event):
        await self.send_json({"event": "message", **event["message"]})

    async def chat_typing(self, event):
        await self.send_json({
            "event": "typing",
            "user_id": event["user_id"],
            "user_name": event["user_name"],
            "is_typing": event["is_typing"],
        })

    async def messages_read(self, event):
        await self.send_json({
            "event": "messages_read",
            "reader_id": event["reader_id"],
            "conversation_id": event["conversation_id"],
        })

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @database_sync_to_async
    def _is_participant(self, user, conversation_id):
        return Conversation.objects.filter(pk=conversation_id, participants=user).exists()

    @database_sync_to_async
    def _save_message(self, user, conversation_id, body):
        msg = Message.objects.create(
            conversation_id=conversation_id,
            sender=user,
            body=body,
        )
        now = timezone.now()
        Conversation.objects.filter(pk=conversation_id).update(
            updated_at=now,
            last_message_at=now,
        )
        return {
            "id": msg.id,
            "conversation": conversation_id,
            "sender": user.id,
            "sender_name": user.get_full_name(),
            "sender_role": user.role,
            "body": msg.body,
            "is_read": False,
            "created_at": msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def _build_inbox_payloads(self, conversation_id, message_data):
        conv = Conversation.objects.prefetch_related("participants").select_related(
            "job_post",
            "job_application__job_post",
        ).get(pk=conversation_id)

        participants = list(conv.participants.all())

        job_title = None
        if conv.job_post_id:
            try:
                job_title = conv.job_post.title
            except Exception:
                pass
        elif conv.job_application_id:
            try:
                job_title = conv.job_application.job_post.title
            except Exception:
                pass

        payloads = []
        for viewer in participants:
            others = [u for u in participants if u.id != viewer.id]
            other = others[0] if others else None

            photo_url = None
            if other and other.profile_photo:
                try:
                    photo_url = other.profile_photo.url
                except Exception:
                    pass

            unread = Message.objects.filter(
                conversation_id=conversation_id,
                is_read=False,
            ).exclude(sender=viewer).count()

            payloads.append({
                "viewer_id": viewer.id,
                "conversation": {
                    "id": conv.id,
                    "other_user": other.id if other else None,
                    "other_user_name": other.get_full_name() if other else "",
                    "other_user_role": other.role if other else "",
                    "other_user_profile_photo": photo_url,
                    "other_user_gender": other.gender if other else None,
                    "job_title": job_title,
                    "last_message": message_data,
                    "last_message_at": message_data["created_at"],
                    "unread_count": unread,
                    "created_at": conv.created_at.isoformat(),
                    "updated_at": message_data["created_at"],
                },
                "message": message_data,
            })

        return payloads


class InboxConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"user_{user.id}_inbox"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def inbox_message(self, event):
        await self.send_json({
            "event": "inbox_message",
            "conversation": event["conversation"],
            "message": event["message"],
        })

    async def inbox_read(self, event):
        await self.send_json({
            "event": "inbox_read",
            "conversation_id": event["conversation_id"],
            "reader_id": event["reader_id"],
        })

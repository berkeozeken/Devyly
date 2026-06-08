"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Eye, MessageSquare, Send, X } from "lucide-react";

import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getWsUrl } from "@/lib/ws";
import type { Conversation, Message } from "@/types";

/* ── Typing Bubble ─────────────────────────────────────────────── */
function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-muted px-3 py-2 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "120ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "240ms" }} />
      </div>
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────── */
function Avatar({ name, photo, gender }: { name: string; photo?: string | null; gender?: string | null }) {
  const g = gender?.toUpperCase();
  const color =
    g === "MALE"   ? "bg-blue-100 text-blue-700"  :
    g === "FEMALE" ? "bg-pink-100 text-pink-700"  :
                     "bg-gray-200 text-gray-600";
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${color}`}>
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

/* ── Yardımcı fonksiyonlar ─────────────────────────────────────── */
function getConversationTime(conv: Conversation): string | null {
  return (
    conv.last_message_at ||
    conv.last_message?.created_at ||
    conv.updated_at ||
    conv.created_at ||
    null
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} gün`;
}

function lastMsgPreview(conv: Conversation, currentUserId: number | null): string {
  if (!conv.last_message) return "";
  const prefix =
    conv.last_message.sender === currentUserId
      ? "Siz"
      : (conv.last_message.sender_name || conv.other_user_name);
  return `${prefix}: ${conv.last_message.body}`;
}

function sortByLatest(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => {
    const aTime = getConversationTime(a);
    const bTime = getConversationTime(b);
    return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
  });
}

/* ── ChatWidget ───────────────────────────────────────────────────── */
type View = "list" | "detail";

export default function ChatWidget() {
  const currentUser = getUser();
  const currentUserId = currentUser?.id ?? null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // detail WS (per-conversation)
  const wsRef = useRef<WebSocket | null>(null);
  // inbox WS (always-on, user-level)
  const inboxWsRef = useRef<WebSocket | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const selectedConvRef = useRef<Conversation | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const openConversationRef = useRef<(conv: Conversation) => void>(() => {});

  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // ── Inbox WS — connect once on mount, stays active regardless of panel state ──
  useEffect(() => {
    if (!currentUserId) return;

    const wsUrl = getWsUrl("/ws/conversations/inbox/");
    const ws = new WebSocket(wsUrl);
    inboxWsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const eventType = data.event;

        if (eventType === "inbox_message") {
          const convPayload = data.conversation as Conversation;
          const msgData = data.message as Message;
          const isFromMe = msgData.sender === currentUserId;
          const convIsOpen = selectedConvRef.current?.id === convPayload.id;

          setConversations((prev) => {
            const exists = prev.some((c) => c.id === convPayload.id);
            let updated: Conversation[];

            if (exists) {
              updated = prev.map((c) => {
                if (c.id !== convPayload.id) return c;
                // Mevcut fotoğraf URL'si korunur (REST'ten gelen mutlak URL)
                return {
                  ...c,
                  last_message: msgData,
                  last_message_at: msgData.created_at,
                  updated_at: msgData.created_at,
                  unread_count: isFromMe
                    ? c.unread_count
                    : convIsOpen
                    ? c.unread_count
                    : convPayload.unread_count,
                };
              });
            } else {
              // İlk mesajla yeni conversation listeye ekleniyor
              const newConv: Conversation = {
                ...convPayload,
                last_message: msgData,
                last_message_at: msgData.created_at,
                updated_at: msgData.created_at,
                unread_count: isFromMe ? 0 : convIsOpen ? 0 : convPayload.unread_count,
              };
              updated = [newConv, ...prev];
            }

            return sortByLatest(updated);
          });

          // Update global unread count (launcher badge)
          if (!isFromMe && !convIsOpen) {
            const oldUnread = conversationsRef.current.find((c) => c.id === convPayload.id)?.unread_count ?? 0;
            const delta = convPayload.unread_count - oldUnread;
            if (delta > 0) setUnreadCount((p) => p + delta);
          }

          return;
        }

        if (eventType === "inbox_read") {
          const { conversation_id } = data as { conversation_id: number; reader_id: number };
          const oldUnread = conversationsRef.current.find((c) => c.id === conversation_id)?.unread_count ?? 0;
          setConversations((prev) =>
            prev.map((c) => (c.id === conversation_id ? { ...c, unread_count: 0 } : c))
          );
          setUnreadCount((p) => Math.max(0, p - oldUnread));
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => { inboxWsRef.current = null; };

    return () => {
      ws.close();
      inboxWsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ── Initial unread count ───────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    api.get<{ unread_count: number }>("/conversations/unread-count/")
      .then((r) => setUnreadCount(r.data.unread_count))
      .catch(() => {});
  }, [currentUserId]);

  // ── Fetch conversation list when panel opens ──────────────────
  useEffect(() => {
    if (!open || view !== "list") return;
    setLoadingConvs(true);
    api.get<Conversation[]>("/conversations/")
      .then((r) => setConversations(r.data))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
    api.get<{ unread_count: number }>("/conversations/unread-count/")
      .then((r) => setUnreadCount(r.data.unread_count))
      .catch(() => {});
  }, [open, view]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  }, []);

  const updateTypingState = useCallback((next: boolean) => {
    if (isTypingRef.current === next) return;
    isTypingRef.current = next;
    sendTyping(next);
  }, [sendTyping]);

  // ── Close detail WS when panel closes or going back to list ──
  useEffect(() => {
    if (!open || view === "list") {
      updateTypingState(false);
      wsRef.current?.close();
      wsRef.current = null;
      setIsOtherTyping(false);
    }
  }, [open, view, updateTypingState]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      updateTypingState(false);
      wsRef.current?.close();
      // inboxWsRef is cleaned up by its own useEffect
    };
  }, [updateTypingState]);

  // ── Scroll to bottom ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  const handleBodyChange = useCallback((value: string) => {
    setBody(value);
    updateTypingState(Boolean(value.trim()));
  }, [updateTypingState]);

  // Used by detail WS for instant update (sender side) — inbox WS also updates list
  const updateConversationWithMessage = useCallback((incoming: Message) => {
    setConversations((prev) => {
      const next = prev.map((conv) => {
        if (conv.id !== incoming.conversation) return conv;
        const isIncoming = incoming.sender !== currentUserId;
        const convIsOpen = selectedConvRef.current?.id === conv.id;
        return {
          ...conv,
          last_message: {
            id: incoming.id,
            body: incoming.body,
            sender: incoming.sender,
            sender_name: incoming.sender_name,
            is_read: incoming.is_read,
            created_at: incoming.created_at,
          },
          last_message_at: incoming.created_at,
          updated_at: incoming.created_at,
          unread_count:
            isIncoming && !convIsOpen ? conv.unread_count + 1 : conv.unread_count,
        };
      });
      return sortByLatest(next);
    });
  }, [currentUserId]);

  const openConversation = useCallback(async (conv: Conversation) => {
    setSelectedConv(conv);
    setView("detail");
    setMessages([]);
    setIsOtherTyping(false);
    setLoadingMsgs(true);

    try {
      const res = await api.get<Message[]>(`/conversations/${conv.id}/messages/`);
      setMessages(res.data);
      api.post(`/conversations/${conv.id}/mark-read/`).catch(() => {});
      if (conv.unread_count > 0) {
        setUnreadCount((p) => Math.max(0, p - conv.unread_count));
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
        );
      }
    } catch {
      // silent
    } finally {
      setLoadingMsgs(false);
    }

    // Connect detail WS
    const wsUrl = getWsUrl(`/ws/conversations/${conv.id}/`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const eventType = data.event;

        if (eventType === "typing") {
          if (data.user_id !== currentUserId) setIsOtherTyping(data.is_typing);
          return;
        }

        if (eventType === "messages_read") {
          if (data.reader_id !== currentUserId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.sender === currentUserId ? { ...m, is_read: true } : m
              )
            );
          }
          return;
        }

        // message event
        const msg = data as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Also update conversations list (instant sender-side update)
        updateConversationWithMessage(msg);
        setIsOtherTyping(false);
        if (msg.sender !== currentUserId) {
          api.post(`/conversations/${conv.id}/mark-read/`).catch(() => {});
        }
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => { wsRef.current = null; };
  }, [currentUserId, updateConversationWithMessage]);

  // Keep openConversationRef in sync for the global event listener
  useEffect(() => { openConversationRef.current = openConversation; }, [openConversation]);

  // Global event: devyly:open-chat — opens widget and activates a conversation
  useEffect(() => {
    const handler = async (e: Event) => {
      const { conversationId } = (e as CustomEvent<{ conversationId: number }>).detail;

      // Already showing the same conversation — just ensure widget is open
      if (selectedConvRef.current?.id === conversationId) {
        setOpen(true);
        return;
      }

      // Close any existing detail WS before switching
      wsRef.current?.close();
      wsRef.current = null;

      setOpen(true);

      // Use cached conversation if available, otherwise fetch it
      const cached = conversationsRef.current.find((c) => c.id === conversationId);
      if (cached) {
        openConversationRef.current(cached);
      } else {
        try {
          const res = await api.get<Conversation>(`/conversations/${conversationId}/`);
          setConversations((prev) => {
            if (prev.some((c) => c.id === conversationId)) return prev;
            return sortByLatest([res.data, ...prev]);
          });
          openConversationRef.current(res.data);
        } catch {}
      }
    };

    window.addEventListener("devyly:open-chat", handler);
    return () => window.removeEventListener("devyly:open-chat", handler);
  }, []); // empty deps — uses refs throughout

  const handleSend = useCallback(async () => {
    if (!body.trim() || !selectedConv) return;
    const msgBody = body.trim();
    setBody("");

    updateTypingState(false);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", body: msgBody }));
    } else {
      try {
        const res = await api.post<Message>(`/conversations/${selectedConv.id}/messages/`, { body: msgBody });
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        updateConversationWithMessage(res.data);
      } catch {
        setBody(msgBody);
      }
    }
  }, [body, selectedConv, updateTypingState, updateConversationWithMessage]);

  const goBack = () => {
    updateTypingState(false);
    wsRef.current?.close();
    wsRef.current = null;
    setView("list");
    setSelectedConv(null);
    setMessages([]);
    setBody("");
    setIsOtherTyping(false);
  };

  const label = unreadCount > 0
    ? `Mesajlar (${unreadCount > 9 ? "9+" : unreadCount})`
    : "Mesajlar";

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showReadStatus = lastMessage !== null && lastMessage.sender === currentUserId;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="bg-card rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-3 duration-200"
          style={{ width: 360, height: 520 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border bg-card shrink-0">
            {view === "detail" ? (
              <>
                <button
                  onClick={goBack}
                  className="text-muted-foreground hover:text-foreground text-sm shrink-0"
                >
                  ←
                </button>
                <div className="flex-1 min-w-0">
                  {selectedConv && (
                    <Link
                      href={`/users/${selectedConv.other_user}`}
                      className="text-sm font-semibold text-foreground hover:text-blue-500 hover:underline truncate block"
                    >
                      {selectedConv.other_user_name}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm font-semibold text-foreground flex-1">{label}</span>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          {view === "list" ? (
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <p className="text-xs text-muted-foreground p-4">Yükleniyor...</p>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4">Henüz mesaj yok.</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0"
                    onClick={() => openConversation(conv)}
                  >
                    <Avatar
                      name={conv.other_user_name}
                      photo={conv.other_user_profile_photo}
                      gender={conv.other_user_gender}
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm truncate ${
                            conv.unread_count > 0
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {conv.other_user_name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {(() => {
                            const t = getConversationTime(conv);
                            return t ? (
                              <span className="text-[11px] text-muted-foreground">{timeAgo(t)}</span>
                            ) : null;
                          })()}
                          {conv.unread_count > 0 && (
                            <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 min-w-5 text-center leading-none">
                              {conv.unread_count > 9 ? "9+" : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      {conv.job_title && (
                        <p className="text-xs text-muted-foreground truncate">{conv.job_title}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMsgPreview(conv, currentUserId)}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingMsgs ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Yükleniyor...</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">İlk mesajı siz gönderin.</p>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUserId;
                    const isLast = idx === messages.length - 1;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className="flex flex-col gap-0.5"
                          style={{
                            maxWidth: "80%",
                            alignItems: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                              isMe ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.body}
                          </div>
                          {isMe && isLast && showReadStatus && (
                            <span className="text-muted-foreground flex justify-end">
                              {msg.is_read ? <Eye size={11} /> : <Check size={11} />}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isOtherTyping && <TypingBubble />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-2 flex gap-2 items-end shrink-0">
                <textarea
                  className="flex-1 text-sm border border-input rounded px-2 py-1.5 resize-none bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
                  rows={2}
                  placeholder="Mesajınızı yazın..."
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!body.trim()}
                  className="shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 h-12 px-5 bg-primary text-primary-foreground rounded-full shadow-2xl border border-white/10 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:translate-y-0 transition-all duration-150 text-sm font-semibold"
      >
        <MessageSquare size={15} />
        <span>Mesajlar</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-bold px-1"
            style={{
              backgroundColor: "var(--brand)",
              color: "#0f172a",
              boxShadow: "0 0 6px var(--brand)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

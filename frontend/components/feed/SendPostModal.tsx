"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Send, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import type { UserSearchResult } from "@/types";

interface Props {
  postId: number;
  onClose: () => void;
}

function UserAvatar({ name, photo, gender }: { name: string; photo?: string | null; gender?: string | null }) {
  if (photo) {
    return <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  const initial = name.charAt(0).toUpperCase() || "?";
  const g = gender?.toUpperCase();
  const cls =
    g === "MALE" ? "bg-blue-200 text-blue-800"
    : g === "FEMALE" ? "bg-pink-200 text-pink-800"
    : "bg-gray-200 text-gray-600";
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${cls}`}>
      {initial}
    </div>
  );
}

export default function SendPostModal({ postId, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [sending, setSending] = useState(false);

  // Initial load
  useEffect(() => {
    setSearching(true);
    api.get<UserSearchResult[]>("/conversations/search-users/")
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, []);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearching(true);
      api.get<UserSearchResult[]>(`/conversations/search-users/?q=${encodeURIComponent(query)}`)
        .then((res) => setUsers(res.data))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const res = await api.post<{ conversation_id: number }>(
        `/feed-posts/${postId}/send-dm/`,
        { recipient_id: selected.id }
      );
      toast.success(`Gönderi ${selected.name} adlı kişiye iletildi.`);
      // Trigger ChatWidget to open the conversation live
      window.dispatchEvent(
        new CustomEvent("devyly:open-chat", { detail: { conversationId: res.data.conversation_id } })
      );
      onClose();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Gönderi iletilemedi.");
    } finally {
      setSending(false);
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    DEVELOPER: "bg-blue-100 text-blue-600",
    RECRUITER: "bg-purple-100 text-purple-600",
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send size={15} className="text-muted-foreground" />
            Gönderiyi İlet
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim veya email ara..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            autoFocus
          />
        </div>

        {/* User list */}
        <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-1">
          {searching && (
            <p className="text-xs text-muted-foreground px-2 py-3">Aranıyor...</p>
          )}
          {!searching && users.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3">Kullanıcı bulunamadı.</p>
          )}
          {!searching && users.map((u) => {
            const isSelected = selected?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelected(isSelected ? null : u)}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-muted/50",
                ].join(" ")}
              >
                <UserAvatar name={u.name} photo={u.profile_photo} gender={u.gender} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                  {u.role}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={13} /> İptal
          </button>
          <button
            onClick={handleSend}
            disabled={!selected || sending}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={13} />
            {sending ? "İletiliyor..." : selected ? `${selected.name.split(" ")[0]}'e Gönder` : "Kullanıcı Seç"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

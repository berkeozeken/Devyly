"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Notification } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  return `${d} gün önce`;
}

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    api
      .get<Notification[]>("/notifications/")
      .then((res) => setNotifications(res.data))
      .catch(() => toast.error("Bildirimler yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/mark-read/`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
      } catch {
        // silent
      }
    }
    if (n.link) router.push(n.link);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Bildirim silinemedi.");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/notifications/mark-all-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error("Bildirimler işaretlenemedi.");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Bildirimler</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} okunmamış bildirim</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? "İşaretleniyor..." : "Tümünü okundu işaretle"}
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz bildiriminiz yok.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={[
                  "relative border rounded-xl px-4 py-3 cursor-pointer transition-colors",
                  n.is_read
                    ? "bg-card border-border hover:bg-muted/60"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10 dark:bg-primary/10 dark:border-primary/25",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`text-sm ${n.is_read ? "text-foreground" : "font-semibold text-foreground"}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--brand)", boxShadow: "0 0 4px var(--brand)" }}
                      />
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="text-muted-foreground/50 hover:text-red-400 text-xs p-1 rounded transition-colors"
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

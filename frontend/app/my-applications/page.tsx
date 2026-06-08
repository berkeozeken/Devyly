"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import type {
  Conversation,
  InterviewRescheduleRequest,
  JobApplication,
  JobApplicationStatus,
  RescheduleStatus,
} from "@/types";

const STATUS_COLORS: Record<JobApplicationStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  REVIEWING: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  INTERVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
};

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  APPLIED: "Başvuruldu",
  REVIEWING: "İnceleniyor",
  INTERVIEW: "Mülakat",
  REJECTED: "Reddedildi",
  ACCEPTED: "Kabul Edildi",
};

const APP_STATUS_FILTER_LABELS: Record<string, string> = {
  all: "Tüm Durumlar", APPLIED: "Başvuruldu", REVIEWING: "İnceleniyor",
  INTERVIEW: "Mülakat", REJECTED: "Reddedildi", ACCEPTED: "Kabul Edildi",
};

const APP_ORDERING_LABELS: Record<string, string> = {
  newest: "En Yeni", oldest: "En Eski", status: "Duruma Göre", interview_date: "Mülakat Tarihi",
};

const RESCHEDULE_LABELS: Record<RescheduleStatus, string> = {
  PENDING: "Beklemede",
  ACCEPTED: "Kabul Edildi",
  REJECTED: "Reddedildi",
};

const RESCHEDULE_COLORS: Record<RescheduleStatus, string> = {
  PENDING: "text-amber-600",
  ACCEPTED: "text-emerald-600",
  REJECTED: "text-red-500",
};

function MyApplicationsContent() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [requests, setRequests] = useState<InterviewRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAppId, setDialogAppId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([{ start: "", end: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ordering, setOrdering] = useState("newest");

  // Tarih değişikliği talepleri tek seferlik fetch
  useEffect(() => {
    api
      .get<InterviewRescheduleRequest[]>("/interview-reschedule-requests/my/")
      .then((res) => setRequests(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Filtre bazlı başvuru fetch
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("ordering", ordering);
      const res = await api.get<JobApplication[]>(`/job-applications/my/?${params.toString()}`);
      setApps(res.data);
    } catch {
      toast.error("Başvurular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, ordering]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const getLatestRequest = (appId: number) =>
    requests.find((r) => r.job_application === appId);

  const addSlot = () => setSlots((prev) => [...prev, { start: "", end: "" }]);
  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: "start" | "end", value: string) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const closeDialog = () => {
    setDialogAppId(null);
    setReason("");
    setSlots([{ start: "", end: "" }]);
  };

  const formatSlotDate = (dt: string) => {
    const d = new Date(dt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  };

  const handleRescheduleSubmit = async () => {
    if (!dialogAppId) return;
    for (const slot of slots) {
      if (!slot.start) { toast.error("Başlangıç zamanı boş olamaz."); return; }
      if (!slot.end) { toast.error("Bitiş zamanı boş olamaz."); return; }
      if (new Date(slot.end) <= new Date(slot.start)) {
        toast.error("Bitiş zamanı başlangıç zamanından sonra olmalı.");
        return;
      }
    }
    const availableSlots = slots.map((s) => `${formatSlotDate(s.start)} - ${formatSlotDate(s.end)}`).join("\n");
    setSubmitting(true);
    try {
      const res = await api.post<InterviewRescheduleRequest>(
        `/job-applications/${dialogAppId}/reschedule-request/`,
        { reason, available_slots: availableSlots }
      );
      setRequests((prev) => [res.data, ...prev]);
      toast.success("Tarih değişikliği talebi gönderildi.");
      closeDialog();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Talep gönderilemedi.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartConversation = async (appId: number) => {
    try {
      const res = await api.post<Conversation>("/conversations/start/", { job_application: appId });
      window.dispatchEvent(
        new CustomEvent("devyly:open-chat", { detail: { conversationId: res.data.id } })
      );
    } catch {
      toast.error("Konuşma başlatılamadı.");
    }
  };

  const hasFilters = debouncedSearch || statusFilter !== "all" || ordering !== "newest";

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setOrdering("newest");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Başvurularım</h1>

        {/* Filtre bar */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              className="h-11 text-sm w-48"
              placeholder="İlan veya şirket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="h-11 text-sm w-36">
                <SelectValue>{APP_STATUS_FILTER_LABELS[statusFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tüm Durumlar</SelectItem>
                <SelectItem value="APPLIED" className="text-sm">Başvuruldu</SelectItem>
                <SelectItem value="REVIEWING" className="text-sm">İnceleniyor</SelectItem>
                <SelectItem value="INTERVIEW" className="text-sm">Mülakat</SelectItem>
                <SelectItem value="REJECTED" className="text-sm">Reddedildi</SelectItem>
                <SelectItem value="ACCEPTED" className="text-sm">Kabul Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordering} onValueChange={(v) => setOrdering(v ?? "newest")}>
              <SelectTrigger className="h-11 text-sm w-40">
                <SelectValue>{APP_ORDERING_LABELS[ordering]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-sm">En Yeni</SelectItem>
                <SelectItem value="oldest" className="text-sm">En Eski</SelectItem>
                <SelectItem value="status" className="text-sm">Duruma Göre</SelectItem>
                <SelectItem value="interview_date" className="text-sm">Mülakat Tarihi</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11 text-sm text-muted-foreground"
                onClick={clearFilters}
              >
                Temizle
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz başvurunuz yok.</p>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => {
              const latestReq = getLatestRequest(app.id);

              return (
                <Card key={app.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/jobs/${app.job_post}`}
                          className="font-medium text-foreground hover:opacity-70 transition-opacity"
                        >
                          {app.job_title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{app.company_name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>

                    {app.cover_letter && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{app.cover_letter}</p>
                    )}

                    {app.status === "INTERVIEW" && (
                      <div className="border-t pt-3 space-y-1">
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Mülakat Bilgileri
                        </p>
                        {app.interview_date && (
                          <p className="text-sm text-foreground">
                            📅{" "}
                            {new Date(app.interview_date).toLocaleString("tr-TR", {
                              day: "2-digit", month: "long", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                        {app.interview_link && (
                          <a href={app.interview_link} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline block">
                            🔗 Mülakat Linki
                          </a>
                        )}
                        {app.interview_note && (
                          <p className="text-sm text-muted-foreground">{app.interview_note}</p>
                        )}

                        {latestReq ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs">
                              Tarih değişikliği talebi:{" "}
                              <span className={`font-medium ${RESCHEDULE_COLORS[latestReq.status]}`}>
                                {RESCHEDULE_LABELS[latestReq.status]}
                              </span>
                            </p>
                            {latestReq.status !== "PENDING" && latestReq.available_slots && (
                              <p className="text-xs text-muted-foreground whitespace-pre-line">
                                <span className="font-medium text-foreground">Önerilen saatler:</span>{"\n"}
                                {latestReq.available_slots}
                              </p>
                            )}
                            {latestReq.recruiter_response && (
                              <p className="text-xs text-muted-foreground italic">{latestReq.recruiter_response}</p>
                            )}
                            {latestReq.status === "PENDING" && (
                              <Button size="sm" variant="outline" className="mt-1" disabled>
                                Bekleyen Talep Var
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1"
                            onClick={() => setDialogAppId(app.id)}
                          >
                            Tarih Değişikliği Talep Et
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground/50">
                        {new Date(app.created_at).toLocaleDateString("tr-TR")}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleStartConversation(app.id)}
                      >
                        Mesaj Gönder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarih Değişikliği Dialog */}
      <Dialog open={dialogAppId !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tarih Değişikliği Talep Et</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Neden uygun değil?</Label>
              <Textarea
                rows={2}
                placeholder="Bu tarih benim için uygun değil çünkü..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Uygun Zamanlar *</Label>
              {slots.map((slot, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Başlangıç</Label>
                    <Input
                      type="datetime-local"
                      className="h-8 text-xs"
                      value={slot.start}
                      onChange={(e) => updateSlot(i, "start", e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Bitiş</Label>
                    <Input
                      type="datetime-local"
                      className="h-8 text-xs"
                      value={slot.end}
                      onChange={(e) => updateSlot(i, "end", e.target.value)}
                    />
                  </div>
                  {slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-700 shrink-0"
                      onClick={() => removeSlot(i)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={addSlot}
              >
                + Uygun Zaman Ekle
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRescheduleSubmit} disabled={submitting}>
                {submitting ? "Gönderiliyor..." : "Talebi Gönder"}
              </Button>
              <Button variant="outline" onClick={closeDialog}>
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function MyApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["DEVELOPER"]}>
      <MyApplicationsContent />
    </ProtectedRoute>
  );
}

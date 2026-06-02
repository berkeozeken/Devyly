"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import type {
  InterviewRescheduleRequest,
  JobApplication,
  JobApplicationStatus,
  RescheduleStatus,
} from "@/types";

const STATUS_COLORS: Record<JobApplicationStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
};

const RESCHEDULE_COLORS: Record<RescheduleStatus, string> = {
  PENDING: "text-yellow-600",
  ACCEPTED: "text-green-600",
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

  useEffect(() => {
    const init = async () => {
      try {
        const [appsRes, reqsRes] = await Promise.all([
          api.get<JobApplication[]>("/job-applications/my/"),
          api.get<InterviewRescheduleRequest[]>("/interview-reschedule-requests/my/"),
        ]);
        setApps(appsRes.data);
        setRequests(reqsRes.data);
      } catch {
        toast.error("Başvurular yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">My Applications</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz başvuru yok.</p>
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
                          className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                        >
                          {app.job_title}
                        </Link>
                        <p className="text-sm text-gray-500">{app.company_name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </div>

                    {app.cover_letter && (
                      <p className="text-sm text-gray-500 line-clamp-2">{app.cover_letter}</p>
                    )}

                    {/* Interview info */}
                    {app.status === "INTERVIEW" && (
                      <div className="border-t pt-3 space-y-1">
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Mülakat Bilgileri
                        </p>
                        {app.interview_date && (
                          <p className="text-sm text-gray-700">
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
                          <p className="text-sm text-gray-600">{app.interview_note}</p>
                        )}

                        {/* Reschedule status or button */}
                        {latestReq ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs">
                              Tarih değişikliği talebi:{" "}
                              <span className={`font-medium ${RESCHEDULE_COLORS[latestReq.status]}`}>
                                {latestReq.status}
                              </span>
                            </p>
                            {latestReq.status !== "PENDING" && latestReq.available_slots && (
                              <p className="text-xs text-gray-500 whitespace-pre-line">
                                <span className="font-medium text-gray-600">Önerilen saatler:</span>{"\n"}
                                {latestReq.available_slots}
                              </p>
                            )}
                            {latestReq.recruiter_response && (
                              <p className="text-xs text-gray-500 italic">{latestReq.recruiter_response}</p>
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

                    <p className="text-xs text-gray-300">
                      {new Date(app.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
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
                    <Label className="text-xs text-gray-500">Başlangıç</Label>
                    <Input
                      type="datetime-local"
                      className="h-8 text-xs"
                      value={slot.start}
                      onChange={(e) => updateSlot(i, "start", e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-gray-500">Bitiş</Label>
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

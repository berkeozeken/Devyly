"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const STATUS_OPTIONS: JobApplicationStatus[] = [
  "APPLIED", "REVIEWING", "INTERVIEW", "REJECTED", "ACCEPTED",
];

interface InterviewDraft {
  interview_date: string;
  interview_link: string;
  interview_note: string;
}

interface RescheduleDraft {
  status: RescheduleStatus;
  recruiter_response: string;
  new_interview_date: string;
  new_interview_link: string;
  new_interview_note: string;
}

function ReceivedApplicationsContent() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<InterviewRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, InterviewDraft>>({});
  const [rescheduleDrafts, setRescheduleDrafts] = useState<Record<number, RescheduleDraft>>({});
  const [editingRescheduleIds, setEditingRescheduleIds] = useState<number[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [appsRes, reqsRes] = await Promise.all([
          api.get<JobApplication[]>("/job-applications/received/"),
          api.get<InterviewRescheduleRequest[]>("/interview-reschedule-requests/received/"),
        ]);
        setApps(appsRes.data);
        setRescheduleRequests(reqsRes.data);

        const initDrafts: Record<number, InterviewDraft> = {};
        appsRes.data.forEach((a) => {
          initDrafts[a.id] = {
            interview_date: a.interview_date ? new Date(a.interview_date).toISOString().slice(0, 16) : "",
            interview_link: a.interview_link,
            interview_note: a.interview_note,
          };
        });
        setDrafts(initDrafts);

        const appMap: Record<number, JobApplication> = {};
        appsRes.data.forEach((a) => { appMap[a.id] = a; });

        const initRescheduleDrafts: Record<number, RescheduleDraft> = {};
        reqsRes.data.forEach((r) => {
          const relatedApp = appMap[r.job_application];
          initRescheduleDrafts[r.id] = {
            status: r.status,
            recruiter_response: r.recruiter_response,
            new_interview_date: relatedApp?.interview_date
              ? new Date(relatedApp.interview_date).toISOString().slice(0, 16)
              : "",
            new_interview_link: relatedApp?.interview_link ?? "",
            new_interview_note: relatedApp?.interview_note ?? "",
          };
        });
        setRescheduleDrafts(initRescheduleDrafts);
      } catch {
        toast.error("Başvurular yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getLatestReschedule = (appId: number) =>
    rescheduleRequests.find((r) => r.job_application === appId);

  const handleStatusChange = async (id: number, status: JobApplicationStatus) => {
    try {
      const res = await api.patch<JobApplication>(`/job-applications/${id}/`, { status });
      setApps((prev) => prev.map((a) => (a.id === id ? res.data : a)));

      if (status === "INTERVIEW") {
        const latestReschedule = getLatestReschedule(id);
        if (latestReschedule?.status === "REJECTED") {
          const reqRes = await api.patch<InterviewRescheduleRequest>(
            `/interview-reschedule-requests/${latestReschedule.id}/`,
            { status: "PENDING" }
          );
          setRescheduleRequests((prev) =>
            prev.map((r) => (r.id === latestReschedule.id ? reqRes.data : r))
          );
          setRescheduleDrafts((prev) => ({
            ...prev,
            [latestReschedule.id]: {
              ...prev[latestReschedule.id],
              status: "PENDING",
              recruiter_response: reqRes.data.recruiter_response,
            },
          }));
        }
      }

      toast.success("Durum güncellendi.");
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleInterviewSave = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    try {
      const res = await api.patch<JobApplication>(`/job-applications/${id}/`, {
        interview_date: draft.interview_date || null,
        interview_link: draft.interview_link,
        interview_note: draft.interview_note,
      });
      setApps((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      toast.success("Mülakat bilgileri kaydedildi.");
    } catch {
      toast.error("Mülakat bilgileri kaydedilemedi.");
    }
  };

  const parseAvailableSlots = (slots: string): Array<{ start: Date; end: Date }> | null => {
    const lines = slots.split("\n").map((s) => s.trim()).filter(Boolean);
    const ranges: Array<{ start: Date; end: Date }> = [];
    for (const line of lines) {
      const parts = line.split(" - ");
      if (parts.length !== 2) return null;
      const parseDate = (s: string): Date | null => {
        const [datePart, timePart] = s.trim().split(" ");
        if (!datePart || !timePart) return null;
        const [day, month, year] = datePart.split(".");
        const [hour, minute] = timePart.split(":");
        if (!day || !month || !year || !hour || !minute) return null;
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
        return isNaN(d.getTime()) ? null : d;
      };
      const start = parseDate(parts[0]);
      const end = parseDate(parts[1]);
      if (!start || !end) return null;
      ranges.push({ start, end });
    }
    return ranges.length > 0 ? ranges : null;
  };

  const handleRescheduleResponse = async (reqId: number, jobApplicationId: number) => {
    const draft = rescheduleDrafts[reqId];
    if (!draft) return;

    if (draft.status === "ACCEPTED") {
      const req = rescheduleRequests.find((r) => r.id === reqId);
      const isNewAccept = req?.status !== "ACCEPTED";
      if (isNewAccept) {
        if (!draft.new_interview_date) {
          toast.error("Talep kabul edildiğinde yeni mülakat tarihi zorunludur.");
          return;
        }
        if (req?.available_slots) {
          const ranges = parseAvailableSlots(req.available_slots);
          if (!ranges) {
            toast.error("Uygun zaman aralıkları okunamadı.");
            return;
          }
          const selected = new Date(draft.new_interview_date);
          const inRange = ranges.some((r) => selected >= r.start && selected <= r.end);
          if (!inRange) {
            toast.error("Seçilen mülakat tarihi adayın uygun olduğu zaman aralıkları içinde olmalı.");
            return;
          }
        }
      }
    }

    try {
      const res = await api.patch<InterviewRescheduleRequest>(
        `/interview-reschedule-requests/${reqId}/`,
        { status: draft.status, recruiter_response: draft.recruiter_response }
      );
      setRescheduleRequests((prev) => prev.map((r) => (r.id === reqId ? res.data : r)));

      if (draft.status === "ACCEPTED") {
        const savedReq = rescheduleRequests.find((r) => r.id === reqId);
        if (savedReq?.status !== "ACCEPTED") {
          const appRes = await api.patch<JobApplication>(`/job-applications/${jobApplicationId}/`, {
            interview_date: draft.new_interview_date,
            interview_link: draft.new_interview_link,
            interview_note: draft.new_interview_note,
          });
          setApps((prev) => prev.map((a) => (a.id === jobApplicationId ? appRes.data : a)));
          setDrafts((prev) => ({
            ...prev,
            [jobApplicationId]: {
              interview_date: draft.new_interview_date,
              interview_link: draft.new_interview_link,
              interview_note: draft.new_interview_note,
            },
          }));
        }
      } else if (draft.status === "REJECTED") {
        const appRes = await api.patch<JobApplication>(`/job-applications/${jobApplicationId}/`, {
          status: "REJECTED",
        });
        setApps((prev) => prev.map((a) => (a.id === jobApplicationId ? appRes.data : a)));
      } else if (draft.status === "PENDING") {
        const appRes = await api.patch<JobApplication>(`/job-applications/${jobApplicationId}/`, {
          status: "INTERVIEW",
        });
        setApps((prev) => prev.map((a) => (a.id === jobApplicationId ? appRes.data : a)));
      }

      setEditingRescheduleIds((prev) => prev.filter((id) => id !== reqId));
      toast.success("Talep güncellendi.");
    } catch {
      toast.error("Talep güncellenemedi.");
    }
  };

  const updateDraft = (id: number, field: keyof InterviewDraft, value: string) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const updateRescheduleDraft = (id: number, field: keyof RescheduleDraft, value: string) =>
    setRescheduleDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const cancelRescheduleEdit = (reqId: number) => {
    setEditingRescheduleIds((prev) => prev.filter((id) => id !== reqId));
    const req = rescheduleRequests.find((r) => r.id === reqId);
    if (!req) return;
    const relatedApp = apps.find((a) => a.id === req.job_application);
    setRescheduleDrafts((prev) => ({
      ...prev,
      [reqId]: {
        status: req.status,
        recruiter_response: req.recruiter_response,
        new_interview_date: relatedApp?.interview_date
          ? new Date(relatedApp.interview_date).toISOString().slice(0, 16)
          : "",
        new_interview_link: relatedApp?.interview_link ?? "",
        new_interview_note: relatedApp?.interview_note ?? "",
      },
    }));
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Received Applications</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz gelen başvuru yok.</p>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const latestReschedule = getLatestReschedule(app.id);
              const isInterviewActive = app.status === "INTERVIEW";

              return (
                <Card key={app.id}>
                  <CardContent className="py-4 space-y-4">
                    {/* Candidate info + status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-gray-800">{app.developer_name}</p>
                        <p className="text-xs text-gray-400">{app.developer_email}</p>
                        <p className="text-sm text-gray-600">{app.job_title} — {app.company_name}</p>
                        {app.cover_letter && (
                          <p className="text-sm text-gray-500 line-clamp-2">{app.cover_letter}</p>
                        )}
                        <p className="text-xs text-gray-300">
                          {new Date(app.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                      <div className="w-36 shrink-0">
                        <Select
                          value={app.status}
                          onValueChange={(v) => handleStatusChange(app.id, v as JobApplicationStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Interview fields + reschedule — only visible when INTERVIEW and no rejected reschedule */}
                    {isInterviewActive && (
                      <>
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Mülakat Bilgileri</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Mülakat Tarihi</Label>
                          <Input type="datetime-local" className="h-8 text-xs"
                            value={drafts[app.id]?.interview_date ?? ""}
                            onChange={(e) => updateDraft(app.id, "interview_date", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Toplantı Linki</Label>
                          <Input type="url" className="h-8 text-xs" placeholder="https://meet.google.com/..."
                            value={drafts[app.id]?.interview_link ?? ""}
                            onChange={(e) => updateDraft(app.id, "interview_link", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Notlar</Label>
                        <Textarea rows={2} className="text-xs" placeholder="Aday hakkında notlar..."
                          value={drafts[app.id]?.interview_note ?? ""}
                          onChange={(e) => updateDraft(app.id, "interview_note", e.target.value)} />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleInterviewSave(app.id)}>
                        Mülakat Bilgilerini Kaydet
                      </Button>
                    </div>

                    {/* Reschedule request history */}
                    {latestReschedule && (
                      <div className={`border-t pt-3 space-y-3 rounded-md p-3 ${
                        latestReschedule.status === "PENDING"
                          ? "bg-yellow-50"
                          : latestReschedule.status === "ACCEPTED"
                          ? "bg-green-50"
                          : "bg-gray-50"
                      }`}>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${
                            latestReschedule.status === "PENDING"
                              ? "text-yellow-700"
                              : latestReschedule.status === "ACCEPTED"
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}>
                            {latestReschedule.status === "PENDING" ? "⚠ " : ""}Tarih Değişikliği Talebi
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            latestReschedule.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : latestReschedule.status === "ACCEPTED"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {latestReschedule.status}
                          </span>
                        </div>
                        {latestReschedule.reason && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Neden:</span> {latestReschedule.reason}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          <span className="font-medium">Uygun saatler:</span>{"\n"}
                          {latestReschedule.available_slots}
                        </p>
                        {latestReschedule.recruiter_response && (
                          <p className="text-sm text-gray-600 italic">
                            <span className="font-medium not-italic">Yanıt:</span>{" "}
                            {latestReschedule.recruiter_response}
                          </p>
                        )}

                        {/* Action form */}
                        {rescheduleDrafts[latestReschedule.id] && (
                          latestReschedule.status === "PENDING" || editingRescheduleIds.includes(latestReschedule.id)
                            ? (
                              <div className="space-y-2 pt-1">
                                <div className="space-y-1">
                                  <Label className="text-xs">Karar</Label>
                                  <Select
                                    value={rescheduleDrafts[latestReschedule.id].status}
                                    onValueChange={(v) =>
                                      updateRescheduleDraft(latestReschedule.id, "status", v ?? "")
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING" className="text-xs">PENDING</SelectItem>
                                      <SelectItem value="ACCEPTED" className="text-xs">ACCEPTED</SelectItem>
                                      <SelectItem value="REJECTED" className="text-xs">REJECTED</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  rows={2}
                                  className="text-xs"
                                  placeholder="Yanıtınız (opsiyonel)..."
                                  value={rescheduleDrafts[latestReschedule.id].recruiter_response}
                                  onChange={(e) =>
                                    updateRescheduleDraft(latestReschedule.id, "recruiter_response", e.target.value)
                                  }
                                />
                                {rescheduleDrafts[latestReschedule.id].status === "ACCEPTED" && latestReschedule.status !== "ACCEPTED" && (
                                  <div className="space-y-2 border border-green-200 rounded-md p-3 bg-green-50">
                                    <p className="text-xs font-semibold text-green-700">Yeni Mülakat Bilgileri</p>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Yeni Mülakat Tarihi *</Label>
                                      <Input
                                        type="datetime-local"
                                        className="h-8 text-xs"
                                        value={rescheduleDrafts[latestReschedule.id].new_interview_date}
                                        onChange={(e) =>
                                          updateRescheduleDraft(latestReschedule.id, "new_interview_date", e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Yeni Toplantı Linki</Label>
                                      <Input
                                        type="url"
                                        className="h-8 text-xs"
                                        placeholder="https://meet.google.com/..."
                                        value={rescheduleDrafts[latestReschedule.id].new_interview_link}
                                        onChange={(e) =>
                                          updateRescheduleDraft(latestReschedule.id, "new_interview_link", e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Yeni Not</Label>
                                      <Textarea
                                        rows={2}
                                        className="text-xs"
                                        placeholder="Notlar..."
                                        value={rescheduleDrafts[latestReschedule.id].new_interview_note}
                                        onChange={(e) =>
                                          updateRescheduleDraft(latestReschedule.id, "new_interview_note", e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleRescheduleResponse(latestReschedule.id, latestReschedule.job_application)
                                    }
                                  >
                                    Yanıtı Kaydet
                                  </Button>
                                  {latestReschedule.status !== "PENDING" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => cancelRescheduleEdit(latestReschedule.id)}
                                    >
                                      İptal
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                            : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-1"
                                onClick={() =>
                                  setEditingRescheduleIds((prev) => [...prev, latestReschedule.id])
                                }
                              >
                                Kararı Düzenle
                              </Button>
                            )
                        )}
                      </div>
                    )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ReceivedApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["RECRUITER"]}>
      <ReceivedApplicationsContent />
    </ProtectedRoute>
  );
}

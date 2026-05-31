"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  IN_REVIEW: "In Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/stats/")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Dashboard verileri yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <h2 className="text-2xl font-semibold text-gray-700">Dashboard</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Yükleniyor...</p>
        ) : stats ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Applications" value={stats.total_applications} accent="text-blue-600" />
              <StatCard label="Pending" value={stats.pending_applications} accent="text-yellow-600" />
              <StatCard label="Interview" value={stats.interview_applications} accent="text-purple-600" />
              <StatCard label="Offer" value={stats.offer_applications} accent="text-green-600" />
              <StatCard label="Rejected" value={stats.rejected_applications} accent="text-red-500" />
              <StatCard label="Accepted" value={stats.accepted_applications} accent="text-emerald-600" />
              <StatCard label="Companies" value={stats.total_companies} />
              <StatCard label="Interviews" value={stats.total_interviews} />
              <StatCard label="Notes" value={stats.total_notes} />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recent_applications.length === 0 ? (
                    <p className="text-sm text-gray-400">Henüz başvuru yok.</p>
                  ) : (
                    <ul className="space-y-3">
                      {stats.recent_applications.map((app) => (
                        <li key={app.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{app.position}</p>
                            <p className="text-xs text-gray-400">
                              {app.company_name} · {app.applied_date}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[app.status] ?? app.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Interviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upcoming Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.upcoming_interviews.length === 0 ? (
                    <p className="text-sm text-gray-400">Yaklaşan mülakat yok.</p>
                  ) : (
                    <ul className="space-y-3">
                      {stats.upcoming_interviews.map((iv) => (
                        <li key={iv.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {iv.application_position}
                            </p>
                            <p className="text-xs text-gray-400">{iv.company_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-purple-600">
                              {iv.interview_type}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(iv.interview_date).toLocaleString("tr-TR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-400">Veriler yüklenirken hata oluştu.</p>
        )}
      </div>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

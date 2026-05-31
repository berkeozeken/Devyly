"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import InterviewForm from "@/components/interviews/InterviewForm";
import InterviewList from "@/components/interviews/InterviewList";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Application, Interview, InterviewResult } from "@/types";

function InterviewsContent() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchInterviews = async () => {
    const res = await api.get<Interview[]>("/interviews/");
    setInterviews(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [ivRes, appRes] = await Promise.all([
          api.get<Interview[]>("/interviews/"),
          api.get<Application[]>("/applications/"),
        ]);
        setInterviews(ivRes.data);
        setApplications(appRes.data);
      } catch {
        toast.error("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/interviews/${id}/`);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      toast.success("Mülakat silindi.");
    } catch {
      toast.error("Mülakat silinemedi.");
    }
  };

  const handleResultChange = async (id: number, result: InterviewResult) => {
    try {
      const res = await api.patch<Interview>(`/interviews/${id}/`, { result });
      setInterviews((prev) => prev.map((iv) => (iv.id === id ? res.data : iv)));
      toast.success("Sonuç güncellendi.");
    } catch {
      toast.error("Sonuç güncellenemedi.");
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    await fetchInterviews();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-700">Interviews</h2>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} className="mr-1" />
            {showForm ? "İptal" : "Yeni Mülakat"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <InterviewForm
            applications={applications}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : (
          <InterviewList
            interviews={interviews}
            onDelete={handleDelete}
            onResultChange={handleResultChange}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <InterviewsContent />
    </ProtectedRoute>
  );
}

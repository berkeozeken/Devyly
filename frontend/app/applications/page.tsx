"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ApplicationForm from "@/components/applications/ApplicationForm";
import ApplicationList from "@/components/applications/ApplicationList";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Application, ApplicationStatus, Company } from "@/types";

function ApplicationsContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchApplications = async () => {
    const res = await api.get<Application[]>("/applications/");
    setApplications(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [appRes, compRes] = await Promise.all([
          api.get<Application[]>("/applications/"),
          api.get<Company[]>("/companies/"),
        ]);
        setApplications(appRes.data);
        setCompanies(compRes.data);
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
      await api.delete(`/applications/${id}/`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success("Başvuru silindi.");
    } catch {
      toast.error("Başvuru silinemedi.");
    }
  };

  const handleStatusChange = async (id: number, status: ApplicationStatus) => {
    try {
      const res = await api.patch<Application>(`/applications/${id}/`, { status });
      setApplications((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      toast.success("Durum güncellendi.");
    } catch {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    await fetchApplications();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-700">Applications</h2>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} className="mr-1" />
            {showForm ? "İptal" : "Yeni Başvuru"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <ApplicationForm
            companies={companies}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : (
          <ApplicationList
            applications={applications}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <ApplicationsContent />
    </ProtectedRoute>
  );
}

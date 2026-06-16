"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import CompanyForm from "@/components/companies/CompanyForm";
import CompanyList from "@/components/companies/CompanyList";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { COMPANY_VERIFICATION_EMAIL } from "@/lib/constants";
import type { Company } from "@/types";

function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchCompanies = async () => {
    const res = await api.get<Company[]>("/companies/");
    setCompanies(res.data);
  };

  useEffect(() => {
    fetchCompanies()
      .catch(() => toast.error("Şirketler yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/companies/${id}/`);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success("Şirket silindi.");
    } catch {
      toast.error("Şirket silinemedi.");
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    await fetchCompanies();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Companies</h1>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} className="mr-1.5" />
            {showForm ? "İptal" : "Yeni Şirket"}
          </Button>
        </div>

        {/* Verification info */}
        {companies.length > 0 && !companies.some((c) => c.is_verified) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            İlan yayınlamak için doğrulanmış bir şirketiniz olmalı. Şirket doğrulaması için{" "}
            <a href={`mailto:${COMPANY_VERIFICATION_EMAIL}`} className="underline font-medium">
              {COMPANY_VERIFICATION_EMAIL}
            </a>{" "}
            adresine mail atın.
          </div>
        )}

        {/* Form */}
        {showForm && (
          <CompanyForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : (
          <CompanyList companies={companies} onDelete={handleDelete} />
        )}
      </div>
    </AppLayout>
  );
}

export default function CompaniesPage() {
  return (
    <ProtectedRoute allowedRoles={["RECRUITER"]}>
      <CompaniesContent />
    </ProtectedRoute>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import JobPostForm from "@/components/jobs/JobPostForm";
import JobPostList from "@/components/jobs/JobPostList";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { COMPANY_VERIFICATION_EMAIL } from "@/lib/constants";
import type { Company, JobPost } from "@/types";
import { useRouter } from "next/navigation";

const WORK_TYPE_LABELS: Record<string, string> = {
  all: "Tüm Türler", REMOTE: "Uzaktan", HYBRID: "Hibrit", ONSITE: "Ofis",
};
const JOB_ORDERING_LABELS: Record<string, string> = {
  newest: "En Yeni", oldest: "En Eski", title_asc: "Başlık A-Z", title_desc: "Başlık Z-A",
};

function MyJobsContent() {
  const router = useRouter();
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNewJobClick = () => {
    const hasVerifiedCompany = companies.some((c) => c.is_verified);
    if (!hasVerifiedCompany) {
      toast.error(
        `İlan yayınlamak için doğrulanmış bir şirketiniz olmalı. Şirket doğrulaması için ${COMPANY_VERIFICATION_EMAIL} adresine mail atın.`,
        { action: { label: "Şirketlerim", onClick: () => router.push("/companies") } },
      );
      return;
    }
    setDialogOpen(true);
  };

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [location, setLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [workType, setWorkType] = useState("all");
  const [ordering, setOrdering] = useState("newest");

  useEffect(() => {
    api.get<Company[]>("/companies/").then((res) => setCompanies(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 300);
    return () => clearTimeout(t);
  }, [location]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedLocation) params.set("location", debouncedLocation);
      if (workType !== "all") params.set("work_type", workType);
      params.set("ordering", ordering);
      const res = await api.get<JobPost[]>(`/job-posts/my/?${params.toString()}`);
      setPosts(res.data);
    } catch {
      toast.error("İlanlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedLocation, workType, ordering]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/job-posts/${id}/`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("İlan silindi.");
    } catch {
      toast.error("İlan silinemedi.");
    }
  };

  const handleFormSuccess = (newPost: JobPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setDialogOpen(false);
  };

  const hasFilters =
    debouncedSearch || debouncedLocation || workType !== "all" || ordering !== "newest";

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setLocation("");
    setDebouncedLocation("");
    setWorkType("all");
    setOrdering("newest");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Jobs</h1>
          <Button size="sm" onClick={handleNewJobClick}>
            <Plus size={15} className="mr-1.5" />
            Yeni İlan
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              className="h-11 text-sm w-48"
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              className="h-11 text-sm w-36"
              placeholder="Konum..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Select value={workType} onValueChange={(v) => setWorkType(v ?? "all")}>
              <SelectTrigger className="h-11 text-sm w-40">
                <SelectValue>{WORK_TYPE_LABELS[workType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">Tüm Türler</SelectItem>
                <SelectItem value="REMOTE" className="text-sm">Uzaktan</SelectItem>
                <SelectItem value="HYBRID" className="text-sm">Hibrit</SelectItem>
                <SelectItem value="ONSITE" className="text-sm">Ofis</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordering} onValueChange={(v) => setOrdering(v ?? "newest")}>
              <SelectTrigger className="h-11 text-sm w-36">
                <SelectValue>{JOB_ORDERING_LABELS[ordering]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-sm">En Yeni</SelectItem>
                <SelectItem value="oldest" className="text-sm">En Eski</SelectItem>
                <SelectItem value="title_asc" className="text-sm">Başlık A-Z</SelectItem>
                <SelectItem value="title_desc" className="text-sm">Başlık Z-A</SelectItem>
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
        ) : (
          <JobPostList posts={posts} showDelete onDelete={handleDelete} emptyMessage="Henüz ilanınız yok." />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İlan Oluştur</DialogTitle>
          </DialogHeader>
          <JobPostForm
            companies={companies}
            onSuccess={handleFormSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function MyJobsPage() {
  return (
    <ProtectedRoute allowedRoles={["RECRUITER"]}>
      <MyJobsContent />
    </ProtectedRoute>
  );
}

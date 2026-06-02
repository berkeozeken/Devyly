"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import api from "@/lib/api";
import type { Company, JobPost } from "@/types";

function MyJobsContent() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [postsRes, companiesRes] = await Promise.all([
          api.get<JobPost[]>("/job-posts/my/"),
          api.get<Company[]>("/companies/"),
        ]);
        setPosts(postsRes.data);
        setCompanies(companiesRes.data);
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-700">My Jobs</h2>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="mr-1" />
            Yeni İlan
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : (
          <JobPostList posts={posts} showDelete onDelete={handleDelete} />
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

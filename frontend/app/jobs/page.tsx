"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import JobPostList from "@/components/jobs/JobPostList";
import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { JobPost } from "@/types";

function JobsContent() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuth(isAuthenticated());
    setReady(true);

    api
      .get<JobPost[]>("/job-posts/")
      .then((res) => setPosts(res.data))
      .catch(() => toast.error("İlanlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (!ready) return null;

  const content = (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Job Feed</h2>
      {loading ? (
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      ) : (
        <JobPostList posts={posts} />
      )}
    </div>
  );

  if (auth) return <AppLayout>{content}</AppLayout>;
  return <PublicLayout>{content}</PublicLayout>;
}

export default function JobsPage() {
  return <JobsContent />;
}

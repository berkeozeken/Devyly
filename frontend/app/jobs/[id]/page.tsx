"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import type { JobApplication, JobPost, User } from "@/types";

function Field({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground">{String(value)}</p>
    </div>
  );
}

function JobDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [post, setPost] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = isAuthenticated() ? getUser() : null;
    setCurrentUser(user);
    setReady(true);

    const isDev = user?.role === "DEVELOPER";

    const init = async () => {
      try {
        const postRes = await api.get<JobPost>(`/job-posts/${id}/`);
        setPost(postRes.data);

        if (isDev) {
          const myApps = await api.get<JobApplication[]>("/job-applications/my/");
          const alreadyApplied = myApps.data.some((a) => String(a.job_post) === id);
          setApplied(alreadyApplied);
        }
      } catch {
        toast.error("İlan yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const isDeveloper = currentUser?.role === "DEVELOPER";

  const handleApplyClick = () => {
    if (!currentUser?.is_phone_verified) {
      toast.error("Başvuru yapmadan önce telefon numaranızı doğrulamanız gerekir.", {
        action: { label: "Telefonumu Doğrula", onClick: () => router.push("/settings") },
      });
      return;
    }
    setDialogOpen(true);
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await api.post(`/job-posts/${id}/apply/`, { cover_letter: coverLetter });
      toast.success("Başvurunuz alındı!");
      setApplied(true);
      setDialogOpen(false);
      setCoverLetter("");
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Başvuru gönderilemedi.";
      if (httpStatus === 403 && msg.includes("telefon")) {
        setDialogOpen(false);
        toast.error(msg, {
          action: { label: "Telefonumu Doğrula", onClick: () => router.push("/settings") },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  const body = (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link
          href="/jobs"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          İlanlara Dön
        </Link>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        ) : post ? (
          <Card>
            <CardContent className="py-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{post.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.company_name}
                    {post.location ? ` · ${post.location}` : ""}
                  </p>
                  {!post.is_active && (
                    <span className="inline-block mt-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Pasif İlan
                    </span>
                  )}
                </div>

                {!currentUser && post.is_active && (
                  <Link href={`/login?next=${encodeURIComponent(`/jobs/${id}`)}`}>
                    <Button size="sm">Başvur</Button>
                  </Link>
                )}
                {isDeveloper && post.is_active && !currentUser?.is_email_verified && (
                  <div className="text-right space-y-1">
                    <Button size="sm" disabled>Başvur</Button>
                    <p className="text-xs text-muted-foreground">
                      <Link href="/resend-verification" className="underline">
                        Email doğrulaması gerekli
                      </Link>
                    </p>
                  </div>
                )}
                {isDeveloper && post.is_active && currentUser?.is_email_verified && (
                  <Button size="sm" disabled={applied} onClick={handleApplyClick}>
                    {applied ? "Başvuruldu" : "Başvur"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Çalışma Şekli" value={post.work_type} />
                <Field label="Maaş Aralığı" value={post.salary_range} />
                <Field label="İşe Alan" value={post.recruiter_name} />
                <Field
                  label="Yayın Tarihi"
                  value={new Date(post.created_at).toLocaleDateString("tr-TR")}
                />
              </div>

              {post.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Açıklama</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{post.description}</p>
                </div>
              )}

              {post.requirements && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gereksinimler</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{post.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-red-400">İlan bulunamadı.</p>
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Başvuru Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Ön Yazı (opsiyonel)</Label>
              <Textarea
                rows={5}
                placeholder="Bu pozisyonla ilgileniyorum çünkü..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} disabled={submitting}>
                {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (currentUser) return <AppLayout>{body}</AppLayout>;
  return <PublicLayout>{body}</PublicLayout>;
}

export default function JobDetailPage() {
  return <JobDetailContent />;
}

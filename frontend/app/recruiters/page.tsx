"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { PublicRecruiter } from "@/types";

function Avatar({ name, photo, gender }: { name: string; photo?: string | null; gender?: string | null }) {
  const g = gender?.toUpperCase();
  const color =
    g === "MALE"   ? "bg-blue-100 text-blue-700"  :
    g === "FEMALE" ? "bg-pink-100 text-pink-700"  :
                     "bg-gray-200 text-gray-600";
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base shrink-0 ${color}`}>
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function RecruitersContent() {
  const [recruiters, setRecruiters] = useState<PublicRecruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [ready, setReady] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [location, setLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [isHiring, setIsHiring] = useState(false);

  useEffect(() => {
    setAuth(isAuthenticated());
    setReady(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 300);
    return () => clearTimeout(t);
  }, [location]);

  const fetchRecruiters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedLocation) params.set("location", debouncedLocation);
      if (isHiring) params.set("is_hiring", "true");
      const res = await api.get<PublicRecruiter[]>(`/users/recruiters/?${params.toString()}`);
      setRecruiters(res.data);
    } catch {
      toast.error("Recruiter'lar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedLocation, isHiring]);

  useEffect(() => {
    fetchRecruiters();
  }, [fetchRecruiters]);

  const hasFilters = debouncedSearch || debouncedLocation || isHiring;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setLocation("");
    setDebouncedLocation("");
    setIsHiring(false);
  };

  if (!ready) return null;

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Recruiters</h1>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            className="h-11 text-sm w-52"
            placeholder="İsim veya şirket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            className="h-11 text-sm w-36"
            placeholder="Konum..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isHiring}
              onChange={(e) => setIsHiring(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            İşe Alıyorlar
          </label>
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
      ) : recruiters.length === 0 ? (
        <p className="text-sm text-muted-foreground">Uygun recruiter bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recruiters.map((rec) => (
            <Link
              key={rec.id}
              href={`/users/${rec.id}`}
              className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:border-border-strong hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] transition-all duration-200"
            >
              <Avatar name={rec.name} photo={rec.profile_photo} gender={rec.gender} />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{rec.name}</span>
                  {rec.is_hiring && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
                      İşe Alıyor
                    </span>
                  )}
                </div>
                {rec.company_name && (
                  <p className="text-xs text-muted-foreground truncate">{rec.company_name}</p>
                )}
                {rec.title && <p className="text-xs text-muted-foreground">{rec.title}</p>}
                {rec.location && <p className="text-xs text-muted-foreground">{rec.location}</p>}
                {rec.industry && (
                  <p className="text-xs text-muted-foreground">{rec.industry}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (auth) return <AppLayout>{content}</AppLayout>;
  return <PublicLayout>{content}</PublicLayout>;
}

export default function RecruitersPage() {
  return <RecruitersContent />;
}

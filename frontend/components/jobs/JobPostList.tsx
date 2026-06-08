"use client";

import { ArrowRight, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobPost } from "@/types";

const WORK_TYPE_LABEL: Record<string, string> = {
  REMOTE: "Uzaktan",
  HYBRID: "Hibrit",
  ONSITE: "Ofis",
};

const WORK_TYPE_CHIP: Record<string, string> = {
  REMOTE: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  HYBRID: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  ONSITE: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
};

interface Props {
  posts: JobPost[];
  showDelete?: boolean;
  onDelete?: (id: number) => void;
  emptyMessage?: string;
}

export default function JobPostList({
  posts,
  showDelete = false,
  onDelete,
  emptyMessage = "İlan bulunamadı.",
}: Props) {
  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id} className="hover:border-border-strong">
          <CardContent className="py-5 space-y-2.5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/jobs/${post.id}`}
                  className="font-semibold text-[15px] text-foreground hover:opacity-70 transition-opacity leading-snug"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground flex-wrap">
                  {post.company_name && <span>{post.company_name}</span>}
                  {post.location && (
                    <>
                      <span className="opacity-30">·</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} className="shrink-0" />
                        {post.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {post.work_type && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${WORK_TYPE_CHIP[post.work_type] ?? "bg-muted text-muted-foreground"}`}>
                    {WORK_TYPE_LABEL[post.work_type] ?? post.work_type}
                  </span>
                )}
                {!post.is_active && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Pasif
                  </span>
                )}
                {showDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            </div>

            {/* Salary */}
            {post.salary_range && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {post.salary_range}
              </p>
            )}

            {/* Description */}
            {post.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-xs text-muted-foreground/50">
                {new Date(post.created_at).toLocaleDateString("tr-TR")}
              </p>
              <Link
                href={`/jobs/${post.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:opacity-60 transition-opacity"
              >
                Detaylar
                <ArrowRight size={11} />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

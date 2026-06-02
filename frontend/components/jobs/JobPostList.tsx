"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobPost } from "@/types";

interface Props {
  posts: JobPost[];
  showDelete?: boolean;
  onDelete?: (id: number) => void;
}

export default function JobPostList({ posts, showDelete = false, onDelete }: Props) {
  if (posts.length === 0) {
    return <p className="text-sm text-gray-400">Henüz ilan yok.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/jobs/${post.id}`}
                  className="font-semibold text-gray-800 hover:text-blue-600 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="text-sm text-gray-500">
                  {post.company_name}
                  {post.location ? ` · ${post.location}` : ""}
                  {post.work_type ? ` · ${post.work_type}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!post.is_active && (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                    Pasif
                  </span>
                )}
                {showDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </div>

            {post.salary_range && (
              <p className="text-xs text-green-600 font-medium">{post.salary_range}</p>
            )}

            {post.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
            )}

            {post.requirements && (
              <p className="text-xs text-gray-400 line-clamp-1">
                <span className="font-medium text-gray-500">Gereksinimler: </span>
                {post.requirements}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-300">
                {new Date(post.created_at).toLocaleDateString("tr-TR")}
              </p>
              <Link
                href={`/jobs/${post.id}`}
                className="text-xs text-blue-500 hover:underline"
              >
                Detay →
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

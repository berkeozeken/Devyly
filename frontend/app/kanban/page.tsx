"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import KanbanBoard from "@/components/kanban/KanbanBoard";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import api from "@/lib/api";
import type { ApplicationStatus, KanbanApplication } from "@/types";

type KanbanData = Record<ApplicationStatus, KanbanApplication[]>;

function KanbanContent() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<KanbanData>("/applications/kanban/")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Kanban verileri yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="px-6 py-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700">Kanban</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : data ? (
          <KanbanBoard data={data} />
        ) : (
          <p className="text-sm text-red-400">Veriler yüklenirken hata oluştu.</p>
        )}
      </div>
    </AppLayout>
  );
}

export default function KanbanPage() {
  return (
    <ProtectedRoute>
      <KanbanContent />
    </ProtectedRoute>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import NoteForm from "@/components/notes/NoteForm";
import NoteList from "@/components/notes/NoteList";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Application, Note } from "@/types";

function NotesContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchNotes = async () => {
    const res = await api.get<Note[]>("/notes/");
    setNotes(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [noteRes, appRes] = await Promise.all([
          api.get<Note[]>("/notes/"),
          api.get<Application[]>("/applications/"),
        ]);
        setNotes(noteRes.data);
        setApplications(appRes.data);
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
      await api.delete(`/notes/${id}/`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Not silindi.");
    } catch {
      toast.error("Not silinemedi.");
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    await fetchNotes();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-700">Notes</h2>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} className="mr-1" />
            {showForm ? "İptal" : "Yeni Not"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <NoteForm
            applications={applications}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        ) : (
          <NoteList notes={notes} onDelete={handleDelete} />
        )}
      </div>
    </AppLayout>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesContent />
    </ProtectedRoute>
  );
}

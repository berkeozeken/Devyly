"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Note } from "@/types";

interface Props {
  notes: Note[];
  onDelete: (id: number) => void;
}

export default function NoteList({ notes, onDelete }: Props) {
  if (notes.length === 0) {
    return <p className="text-sm text-gray-400">Henüz not yok.</p>;
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardContent className="py-4 flex gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium text-gray-800">{note.title}</p>
              <p className="text-xs text-gray-400">
                {note.application_position} — {note.company_name}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-gray-300">
                {new Date(note.created_at).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 shrink-0 self-start"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 size={15} />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

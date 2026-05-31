"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Interview, InterviewResult } from "@/types";

const RESULT_COLORS: Record<InterviewResult, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const RESULT_OPTIONS: InterviewResult[] = ["PENDING", "PASSED", "FAILED", "CANCELLED"];

interface Props {
  interviews: Interview[];
  onDelete: (id: number) => void;
  onResultChange: (id: number, result: InterviewResult) => void;
}

export default function InterviewList({ interviews, onDelete, onResultChange }: Props) {
  if (interviews.length === 0) {
    return <p className="text-sm text-gray-400">Henüz mülakat yok.</p>;
  }

  return (
    <div className="space-y-3">
      {interviews.map((iv) => (
        <Card key={iv.id}>
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{iv.application_position}</p>
              <p className="text-sm text-gray-500">{iv.company_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {iv.interview_type} ·{" "}
                {new Date(iv.interview_date).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {iv.interviewer_name ? ` · ${iv.interviewer_name}` : ""}
              </p>
              {iv.meeting_link && (
                <a
                  href={iv.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Toplantı linki
                </a>
              )}
            </div>

            {/* Result badge */}
            <span
              className={`self-start sm:self-auto text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${RESULT_COLORS[iv.result]}`}
            >
              {iv.result}
            </span>

            {/* Result change */}
            <div className="w-36 shrink-0">
              <Select
                value={iv.result}
                onValueChange={(v) => onResultChange(iv.id, v as InterviewResult)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 shrink-0"
              onClick={() => onDelete(iv.id)}
            >
              <Trash2 size={16} />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

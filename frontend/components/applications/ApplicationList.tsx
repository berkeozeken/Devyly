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
import type { Application, ApplicationStatus } from "@/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "APPLIED", "IN_REVIEW", "INTERVIEW", "OFFER", "REJECTED", "ACCEPTED",
];

interface Props {
  applications: Application[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
}

export default function ApplicationList({ applications, onDelete, onStatusChange }: Props) {
  if (applications.length === 0) {
    return <p className="text-sm text-gray-400">Henüz başvuru yok.</p>;
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{app.position}</p>
              <p className="text-sm text-gray-500">
                {app.company_name}
                {app.location ? ` · ${app.location}` : ""}
                {app.work_type ? ` · ${app.work_type}` : ""}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{app.applied_date}</p>
            </div>

            {/* Status badge */}
            <span
              className={`self-start sm:self-auto text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[app.status]}`}
            >
              {app.status.replace("_", " ")}
            </span>

            {/* Status change */}
            <div className="w-36 shrink-0">
              <Select
                value={app.status}
                onValueChange={(v) => onStatusChange(app.id, v as ApplicationStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s.replace("_", " ")}
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
              onClick={() => onDelete(app.id)}
            >
              <Trash2 size={16} />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

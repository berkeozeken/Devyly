import { Card, CardContent } from "@/components/ui/card";
import type { KanbanApplication } from "@/types";

const COLUMN_COLORS: Record<string, string> = {
  APPLIED: "border-t-blue-400",
  IN_REVIEW: "border-t-yellow-400",
  INTERVIEW: "border-t-purple-400",
  OFFER: "border-t-green-400",
  REJECTED: "border-t-red-400",
  ACCEPTED: "border-t-emerald-400",
};

const COLUMN_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  IN_REVIEW: "In Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
};

interface Props {
  status: string;
  applications: KanbanApplication[];
}

export default function KanbanColumn({ status, applications }: Props) {
  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {COLUMN_LABELS[status] ?? status}
        </span>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div
        className={`flex flex-col gap-2 min-h-24 rounded-lg border-t-4 bg-gray-50 p-2 ${
          COLUMN_COLORS[status] ?? "border-t-gray-300"
        }`}
      >
        {applications.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">Boş</p>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="shadow-sm">
              <CardContent className="py-3 px-3 space-y-1">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {app.position}
                </p>
                <p className="text-xs text-gray-500">{app.company_name}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {app.work_type && (
                    <span className="text-xs bg-white border rounded px-1.5 py-0.5 text-gray-400">
                      {app.work_type}
                    </span>
                  )}
                  {app.location && (
                    <span className="text-xs bg-white border rounded px-1.5 py-0.5 text-gray-400 truncate max-w-[100px]">
                      {app.location}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300">{app.applied_date}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

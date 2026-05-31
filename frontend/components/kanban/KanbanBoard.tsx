import KanbanColumn from "./KanbanColumn";
import type { ApplicationStatus, KanbanApplication } from "@/types";

const STATUS_ORDER: ApplicationStatus[] = [
  "APPLIED",
  "IN_REVIEW",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ACCEPTED",
];

type KanbanData = Record<ApplicationStatus, KanbanApplication[]>;

interface Props {
  data: KanbanData;
}

export default function KanbanBoard({ data }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          applications={data[status] ?? []}
        />
      ))}
    </div>
  );
}

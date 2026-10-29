import type { QuestionStatus } from "@/lib/questions-admin";

export const STATUS_LABEL: Record<QuestionStatus, string> = {
  draft: "Borrador",
  ai_reviewed: "Revisada por IA",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_CLASS: Record<QuestionStatus, string> = {
  draft: "border-cream/40 text-cream/80",
  ai_reviewed: "border-gold text-gold",
  approved: "border-chip-green bg-chip-green text-cream",
  rejected: "border-card bg-card text-cream",
};

export function StatusBadge({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border-2 px-1.5 font-hud text-[11px] font-bold uppercase tracking-wider ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

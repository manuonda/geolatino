import { requireAdmin } from "@/lib/admin";
import { QuestionForm } from "@/features/admin/components/QuestionForm";
import { createQuestionAction } from "../actions";

export default async function NewQuestionPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl text-gold">Nueva pregunta</h1>
      <p className="text-sm text-cream/80">
        Se guarda como borrador. Después la aprobás y la asignás a un día desde el calendario.
      </p>
      <QuestionForm action={createQuestionAction} submitLabel="Crear borrador" />
    </div>
  );
}

import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/features/admin/components/ActionForm";
import { QuestionForm } from "@/features/admin/components/QuestionForm";
import { StatusBadge } from "@/features/admin/components/StatusBadge";
import { leakedPlaceWords } from "@/features/admin/questionSchema";
import { getQuestion, isLocked } from "@/lib/questions-admin";
import { todayInBuenosAires } from "@/lib/timezone";
import {
  approveQuestionAction,
  assignQuestionAction,
  rejectQuestionAction,
  updateQuestionAction,
} from "../actions";

const OK_MESSAGES: Record<string, string> = {
  creada: "Pregunta creada como borrador.",
  guardada: "Cambios guardados.",
  aprobada: "Pregunta aprobada.",
  rechazada: "Pregunta rechazada.",
  asignada: "Calendario actualizado.",
};

export default async function QuestionDetailPage({ params, searchParams }: PageProps<"/admin/preguntas/[id]">) {
  // El layout también controla, pero layout y página se renderizan en paralelo.
  await requireAdmin();
  const { id } = await params;
  const { ok } = await searchParams;
  const question = await getQuestion(decodeURIComponent(id));
  if (!question) notFound();

  const today = todayInBuenosAires();
  const locked = isLocked(question, today);
  const leaks = leakedPlaceWords(question.placeName, [question.prompt, ...question.hints]);
  const okMessage = typeof ok === "string" ? OK_MESSAGES[ok] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/preguntas" className="font-hud text-xs text-cream/70 hover:text-gold">
          ← Preguntas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-gold">{question.id}</h1>
          <StatusBadge status={question.status} />
          <span className="font-hud text-sm text-cream/80">
            {question.roundDate ? `${question.roundDate} · lugar ${question.position}` : "Sin día asignado"}
          </span>
        </div>
        {okMessage && <p className="border-l-[3px] border-chip-green pl-3 text-sm">{okMessage}</p>}
        {question.rejectReason && (
          <p className="border-l-[3px] border-card pl-3 text-sm">Motivo del rechazo: {question.rejectReason}</p>
        )}
        {question.reviewedBy && (
          <p className="text-xs text-cream/60">
            Revisada por {question.reviewedBy}
            {question.reviewedAt ? ` el ${question.reviewedAt.slice(0, 10)}` : ""}
          </p>
        )}
        {leaks.length > 0 && (
          <p className="border-[3px] border-gold px-3 py-2 text-sm">
            ⚠ El acertijo o las pistas mencionan parte del nombre del lugar: <strong>{leaks.join(", ")}</strong>.
          </p>
        )}
      </div>

      {!locked && (
        <section className="grid gap-4 border-[3px] border-cream/20 bg-pitch p-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h2 className="font-hud text-xs font-bold tracking-widest text-gold">REVISIÓN</h2>
            {question.status !== "approved" ? (
              <ActionForm action={approveQuestionAction.bind(null, question.id)} submitLabel="Aprobar">
                <p className="text-sm text-cream/80">La pregunta queda lista para asignarle un día.</p>
              </ActionForm>
            ) : (
              <p className="text-sm text-cream/80">Aprobada.</p>
            )}
          </div>

          {question.status !== "rejected" && (
            <ActionForm
              action={rejectQuestionAction.bind(null, question.id)}
              submitLabel="Rechazar"
              tone="danger"
            >
              <label className="flex flex-col gap-1 text-sm">
                Motivo del rechazo
                <input name="reason" className="admin-input" required />
              </label>
            </ActionForm>
          )}

          {question.status === "approved" && (
            <ActionForm action={assignQuestionAction} submitLabel={question.roundDate ? "Mover" : "Asignar"} tone="plain">
              <input type="hidden" name="id" value={question.id} />
              <div className="flex gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  Día
                  <input type="date" name="date" min={today} defaultValue={question.roundDate ?? ""} className="admin-input" />
                </label>
                <label className="flex flex-col gap-1">
                  Lugar
                  <select name="position" defaultValue={question.position ?? 1} className="admin-input">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="text-xs text-cream/60">Dejá el día vacío para sacarla del calendario.</p>
            </ActionForm>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-hud text-xs font-bold tracking-widest text-gold">CONTENIDO</h2>
        <QuestionForm
          action={updateQuestionAction.bind(null, question.id)}
          defaults={question}
          submitLabel="Guardar cambios"
          locked={locked}
        />
        {question.sourceUrl && (
          <a href={question.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-gold underline">
            Ver la fuente
          </a>
        )}
      </section>
    </div>
  );
}

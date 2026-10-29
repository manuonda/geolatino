"use client";

import { useActionState } from "react";
import { EMPTY_FORM_STATE, type FormState } from "@/features/admin/formState";
import type { QuestionInput } from "@/features/admin/questionSchema";
import { PinPicker } from "./PinPicker";

type QuestionFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: QuestionInput;
  submitLabel: string;
  /** Pregunta ya jugada: solo se edita la historia. */
  locked?: boolean;
};

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      {children}
      {hint && <span className="text-cream/60">{hint}</span>}
      {error && <span className="text-card">{error}</span>}
    </label>
  );
}

export function QuestionForm({ action, defaults, submitLabel, locked = false }: QuestionFormProps) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {locked && (
        <p className="border-[3px] border-gold bg-pitch px-3 py-2 text-sm">
          Esta pregunta ya se jugó: solo se puede corregir la historia.
        </p>
      )}
      {/* Con fieldset disabled los campos no se envían; por eso la pregunta bloqueada los repite ocultos. */}
      <fieldset disabled={locked} className="flex flex-col gap-4 disabled:opacity-60">
        <Field label="Acertijo" error={e.prompt}>
          <textarea name="prompt" rows={2} defaultValue={defaults?.prompt} className="admin-input" required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto]">
          <Field label="Lugar (la respuesta)" error={e.placeName} hint="Ej.: La Bombonera, Buenos Aires, Argentina">
            <input name="placeName" defaultValue={defaults?.placeName} className="admin-input" required />
          </Field>
          <Field label="País" error={e.countryCode}>
            <input
              name="countryCode"
              defaultValue={defaults?.countryCode}
              maxLength={2}
              placeholder="AR"
              className="admin-input w-20 uppercase"
              required
            />
          </Field>
          <Field label="Deporte" error={e.sport}>
            <input name="sport" defaultValue={defaults?.sport ?? "fútbol"} className="admin-input w-32" />
          </Field>
          <Field label="Dificultad" error={e.difficulty}>
            <select name="difficulty" defaultValue={defaults?.difficulty ?? 3} className="admin-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {[0, 1, 2].map((i) => (
          <Field key={i} label={`Pista ${i + 1}`} error={e[`hint${i + 1}`]}>
            <input name={`hint${i + 1}`} defaultValue={defaults?.hints[i]} className="admin-input" required />
          </Field>
        ))}
        <Field label="Fuente" error={e.sourceUrl} hint="URL de Wikidata o Wikipedia">
          <input name="sourceUrl" type="url" defaultValue={defaults?.sourceUrl ?? ""} className="admin-input" />
        </Field>
        <PinPicker defaultLat={defaults?.lat} defaultLng={defaults?.lng} errors={{ lat: e.lat, lng: e.lng }} />
      </fieldset>

      {locked && defaults && <LockedHiddenFields values={defaults} />}

      <Field label="Historia (se muestra después de responder)" error={e.story}>
        <textarea name="story" rows={3} defaultValue={defaults?.story} className="admin-input" />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border-[3px] border-night bg-gold px-4 py-2 font-hud text-sm font-bold text-night block-shadow hover:bg-cream disabled:opacity-60"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
        {state.message && (
          <p role="alert" className="text-sm text-card">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function LockedHiddenFields({ values }: { values: QuestionInput }) {
  const fields: [string, string | number][] = [
    ["prompt", values.prompt],
    ["placeName", values.placeName],
    ["countryCode", values.countryCode],
    ["sport", values.sport],
    ["difficulty", values.difficulty],
    ["hint1", values.hints[0]],
    ["hint2", values.hints[1]],
    ["hint3", values.hints[2]],
    ["sourceUrl", values.sourceUrl ?? ""],
    ["lat", values.lat],
    ["lng", values.lng],
  ];
  return (
    <>
      {fields.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

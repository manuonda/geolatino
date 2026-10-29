"use client";

import { useActionState, type ReactNode } from "react";
import { EMPTY_FORM_STATE, type FormState } from "@/features/admin/formState";

type ActionFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel?: string;
  tone?: "gold" | "danger" | "plain";
};

const TONES = {
  gold: "border-night bg-gold text-night hover:bg-cream",
  danger: "border-night bg-card text-cream hover:bg-cream hover:text-night",
  plain: "border-cream/40 bg-pitch text-cream hover:border-gold hover:text-gold",
};

/** Formulario chico de una sola acción, con el error que devuelva la Server Action. */
export function ActionForm({
  action,
  children,
  className = "",
  submitLabel,
  pendingLabel = "Guardando…",
  tone = "gold",
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className={`flex flex-col gap-2 ${className}`}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className={`self-start border-[3px] px-3 py-1.5 font-hud text-sm font-bold disabled:opacity-60 ${TONES[tone]}`}
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      {state.message && (
        <p role="alert" className="text-sm text-card">
          {state.message}
        </p>
      )}
    </form>
  );
}

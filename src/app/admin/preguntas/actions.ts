"use server";

import { redirect } from "next/navigation";
import { fieldErrors, readQuestionForm } from "@/features/admin/questionSchema";
import type { FormState } from "@/features/admin/formState";
import { requireAdmin } from "@/lib/admin";
import {
  approveQuestion,
  assignQuestion,
  createQuestion,
  rejectQuestion,
  updateQuestion,
} from "@/lib/questions-admin";
import { todayInBuenosAires } from "@/lib/timezone";

// Cada action llama a requireAdmin(): se pueden invocar sin pasar por el layout de /admin.

export async function createQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readQuestionForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await createQuestion(parsed.data);
  if (!result.ok) return { message: result.error };
  redirect(`/admin/preguntas/${encodeURIComponent(result.value)}?ok=creada`);
}

export async function updateQuestionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = readQuestionForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await updateQuestion(id, parsed.data, todayInBuenosAires());
  if (!result.ok) return { message: result.error };
  redirect(`/admin/preguntas/${encodeURIComponent(id)}?ok=guardada`);
}

export async function approveQuestionAction(id: string): Promise<FormState> {
  const admin = await requireAdmin();
  const result = await approveQuestion(id, admin.email);
  if (!result.ok) return { message: result.error };
  redirect(`/admin/preguntas/${encodeURIComponent(id)}?ok=aprobada`);
}

export async function rejectQuestionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "");
  const result = await rejectQuestion(id, admin.email, reason, todayInBuenosAires());
  if (!result.ok) return { message: result.error };
  redirect(`/admin/preguntas/${encodeURIComponent(id)}?ok=rechazada`);
}

/**
 * Asigna o saca una pregunta del calendario.
 * Campos: id, date (vacío para sacarla), position y returnTo (ruta de admin a la que volver).
 */
export async function assignQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const position = Number(formData.get("position"));
  if (!id) return { message: "Elegí una pregunta" };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { message: "Fecha inválida" };

  const result = await assignQuestion(id, date ? { date, position } : null, todayInBuenosAires());
  if (!result.ok) return { message: result.error };

  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(returnTo.startsWith("/admin/") ? returnTo : `/admin/preguntas/${encodeURIComponent(id)}?ok=asignada`);
}

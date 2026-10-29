/** Respuesta de una Server Action de admin a su formulario. */
export type FormState = {
  errors?: Record<string, string>;
  message?: string;
};

export const EMPTY_FORM_STATE: FormState = {};

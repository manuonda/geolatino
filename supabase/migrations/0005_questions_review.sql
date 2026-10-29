-- Revisión en el panel de admin: quién aprobó o rechazó, cuándo y por qué.
alter table questions
  add column reviewed_by text,
  add column reviewed_at timestamptz,
  add column reject_reason text,
  add column updated_at timestamptz not null default now();

-- Una pregunta rechazada no puede tener día asignado.
alter table questions
  add constraint questions_rejected_unassigned
  check (status <> 'rejected' or round_date is null);

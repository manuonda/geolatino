-- Banco de preguntas. Reemplaza a src/data/questions.json.
-- Las ids nuevas siguen el formato de las del JSON (EST-0001); la secuencia arranca en 1000
-- para no chocar con las que carga el seed.
create sequence questions_id_seq start 1000;

create table questions (
  id text primary key default 'EST-' || lpad(nextval('questions_id_seq')::text, 4, '0'),
  round_date date,
  position smallint check (position between 1 and 5),
  prompt text not null check (length(trim(prompt)) > 0),
  place_name text not null check (length(trim(place_name)) > 0),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  sport text not null default 'fútbol',
  difficulty smallint not null check (difficulty between 1 and 5),
  hints text[] not null check (cardinality(hints) = 3),
  story text not null default '',
  source_url text,
  status text not null default 'draft'
    check (status in ('draft', 'ai_reviewed', 'approved', 'rejected')),
  is_reserve boolean not null default false,
  created_at timestamptz not null default now(),
  -- Fecha y lugar van juntos: o la pregunta está asignada a un día, o no.
  check ((round_date is null) = (position is null)),
  unique (round_date, position)
);

alter sequence questions_id_seq owned by questions.id;

alter table questions enable row level security;

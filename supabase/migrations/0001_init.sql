create table players (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table plays (
  player_id uuid not null references players on delete cascade,
  round_date date not null,
  question_id text not null,
  guess_lat double precision not null,
  guess_lng double precision not null,
  distance_km numeric not null,
  hints_used int not null,
  raw_score int not null,
  score int not null,
  created_at timestamptz not null default now(),
  primary key (player_id, round_date, question_id)
);

alter table players enable row level security;
alter table plays enable row level security;

create view daily_ranking with (security_invoker = true) as
select p.round_date, p.player_id, pl.display_name, pl.avatar_url,
       sum(p.score) as total_score, count(*) as answered,
       max(p.created_at) as finished_at
from plays p join players pl on pl.id = p.player_id
group by p.round_date, p.player_id, pl.display_name, pl.avatar_url;
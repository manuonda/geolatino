-- Estadísticas del perfil. Todo sale de plays; no hay tablas nuevas.

-- Una fila por jugador y ronda, con su posición en el ranking de ese día.
create view player_rounds with (security_invoker = true) as
select
  round_date,
  player_id,
  total_score,
  answered,
  finished_at,
  rank() over (partition by round_date order by total_score desc, finished_at asc) as rank,
  count(*) over (partition by round_date) as players
from daily_ranking;

-- Rachas de días seguidos jugados. En días consecutivos, round_date - número de fila
-- da la misma fecha: agrupar por ese valor deja cada racha en una fila ("islas").
create view player_streaks with (security_invoker = true) as
select
  player_id,
  min(round_date) as start_date,
  max(round_date) as end_date,
  count(*) as length
from (
  select
    player_id,
    round_date,
    round_date - (row_number() over (partition by player_id order by round_date))::int as island
  from (select distinct player_id, round_date from plays) as days
) as numbered
group by player_id, island;

-- Totales por jugador.
create view player_stats with (security_invoker = true) as
select
  p.player_id,
  count(distinct p.round_date) as rounds_played,
  count(*) as questions_answered,
  sum(p.score) as total_score,
  count(*) filter (where p.raw_score >= 80) as hits,
  count(*) filter (where p.raw_score = 100) as perfect,
  round(avg(p.distance_km), 1) as avg_distance_km,
  round(avg(p.hints_used), 2) as avg_hints,
  r.best_score,
  r.avg_round_score,
  r.best_rank
from plays p
join (
  select
    player_id,
    max(total_score) as best_score,
    round(avg(total_score)) as avg_round_score,
    min(rank) as best_rank
  from player_rounds
  group by player_id
) r on r.player_id = p.player_id
group by p.player_id, r.best_score, r.avg_round_score, r.best_rank;

# Perfil y estadísticas del jugador

Plan para que un jugador con sesión vea sus estadísticas. Es la fase 9 de `docs/task-list.json`.

## Estado

Para revisar. Depende de que las migraciones 0001 y 0002 estén corridas en Supabase (tarea L4). No necesita la tabla `questions`, salvo las estadísticas por país.

## Alcance

- `/perfil` es privado: cada jugador ve solo lo suyo.
- Un perfil público (`/jugador/[id]`) queda para después: es la decisión D6, por privacidad.

## Qué muestra

Todo sale de `plays`, sin tablas nuevas:

- rondas jugadas: días distintos con al menos una jugada;
- puntaje total, promedio por ronda y mejor ronda;
- racha actual y racha máxima de días seguidos;
- distancia promedio, pistas por pregunta y aciertos perfectos (`raw_score = 100`);
- posición en el ranking de cada día y mejor posición;
- historial de los últimos 30 días;
- aciertos por país, después de la clave foránea `plays.question_id → questions.id` (fase 1).

## Base de datos

Migración `supabase/migrations/NNNN_player_stats.sql`, con vistas `with (security_invoker = true)` como `daily_ranking`:

- `player_rounds`: una fila por jugador y día, con `sum(score)`, y la posición con `rank() over (partition by round_date order by total_score desc, finished_at)`. Se puede armar sobre `daily_ranking`.
- `player_stats`: totales por jugador, sobre `player_rounds` y `plays`.
- `player_streaks`: rachas con la técnica de islas. En días seguidos, `round_date - (row_number() over (partition by player_id order by round_date))::int` da la misma fecha, así que agrupar por ese valor da cada racha con su largo y su último día.
  - Racha máxima: el grupo más largo.
  - Racha actual: el grupo cuyo último día es hoy o ayer (hora de Buenos Aires). Si no hay ninguno, es 0. Ayer cuenta porque el jugador todavía puede jugar hoy.

## Código

- `src/lib/stats.ts`: `getPlayerStats(playerId)` lee las tres vistas con el cliente admin y devuelve un solo objeto tipado.
- `src/app/(marketing)/perfil/page.tsx`:
  - `await connection()`, porque depende de la sesión y de la fecha;
  - sin sesión, redirige a `/auth/login?next=/perfil`;
  - con sesión, `getSessionUserId()` y después `getPlayerStats()`.
- `src/shared/components/GameMenu.tsx`: "Mis estadísticas" pasa de `badge: "pronto"` a `href: "/perfil"`.

## Cómo probarlo

- Jugadores de prueba con jugadas en días 1, 2 y 3: racha 3. Sin el día 2: racha máxima 1.
- Un jugador sin jugadas ve un estado vacío con un enlace a `/jugar`, no un error.

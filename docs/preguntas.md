# Preguntas: banco, generación y publicación diaria

Plan para pasar de 5 preguntas en `src/data/questions.json` a una ronda nueva por día, generada con IA y aprobada por una persona.

## Estado

Diseño cerrado. Nada implementado.

Hoy `getPublicRound` en `src/lib/questions.ts` devuelve `bank.slice(0, 5)` cuando no hay preguntas para la fecha. Las 5 preguntas existentes tienen fecha 2026-10-05, así que desde ese día todos juegan la misma ronda.

## Reglas del juego

- Hay una ronda por día, igual para todos, con 5 preguntas.
- Cada pregunta se usa en un solo día y no se repite.
- Una jugada anónima se puntúa pero no se guarda. Una jugada con sesión se guarda en `plays` y cuenta para `daily_ranking`. Esto ya funciona en `src/app/api/jugada/route.ts`.
- Premium: archivo de rondas pasadas. Esas jugadas no cuentan para el ranking (ver fase 5).

## Ciclo de una pregunta

```
candidata ─► generada ─► ai_reviewed ─► approved ─► programada ─► jugada
 (lote)      (generador)  (chequeos +    (persona)   (round_date)
                           revisor)
                              │
                              └─► rejected
```

Una pregunta `ai_reviewed` ya tiene `round_date` (hoy + 7), pero solo se juega si llega `approved`, salvo en el último recurso descrito en "Fallback". Por eso la migración no incluye el `check (round_date is null or status = 'approved')` de la primera versión del plan.

## Fuentes y costos

- **Datos**: Wikidata (SPARQL). Los datos son CC0. Toda petición lleva un User-Agent descriptivo con un contacto, por ejemplo `GeolatinoBot/1.0 (contacto@dominio)`. Si la respuesta es 429, se espera lo que indique `Retry-After` y se reintenta una vez.
- **Coordenadas**: salen siempre de Wikidata. Ningún modelo las genera ni las corrige. Si el revisor duda de una ubicación, rechaza la pregunta.
- **Modelos**:
  - Generador: `claude-sonnet-5-5`.
  - Revisor: `claude-opus-5-5`. El revisor es más fuerte que el generador a propósito.
- **Costo estimado**: unos $2.50 por mes. El razonamiento interno (thinking) se cobra como salida, así que el costo puede ser 2 o 3 veces mayor. La primera semana se registra `response.usage` de cada llamada para medir el costo real.
- **Prompt caching**: no sirve aquí. El cache dura 5 minutos o 1 hora, y la llamada es una vez por día. El ahorro viene de enviar solo los datos de los 5 candidatos.
- **Proveedor intercambiable**: el job usa las interfaces `QuestionGenerator` y `QuestionReviewer`. Cada proveedor (Claude hoy, quizás OpenAI después) es un adaptador. El JSON schema y la validación con zod viven en nuestro código. Los prompts están en archivos aparte.

## Fases

Cada fase es un PR y deja el sistema funcionando.

### Fase 1: preguntas en Supabase

- `supabase/migrations/0003_questions.sql`: crea la tabla `questions` con estas columnas:
  - `id`
  - `round_date` y `position`: van juntas, las dos con valor o las dos en null.
  - `prompt`, `place_name`, `lat`, `lng`, `country_code`, `sport`, `difficulty`, `hints`, `story`, `source_url`
  - `status`: `draft`, `ai_reviewed`, `approved` o `rejected`.
  - `is_reserve`
  - `created_at`

  Además:
  - Un `unique (round_date, position)`.
  - RLS activo y sin políticas: solo el servidor lee la tabla.
- `scripts/seed-questions.mjs`: carga `src/data/questions.json`.
- `supabase/migrations/0004_plays_question_fk.sql`: agrega la clave foránea de `plays.question_id` a `questions.id`, con `on delete restrict`. Se corre después del seed.
- `src/lib/questions.ts`: lee de Supabase. Se reemplazan `findRoundDate` y `getQuestionById` por `findRoundQuestion`. Se quita el fallback `bank.slice(0, 5)`.
- Las tres funciones que usan este módulo pasan a usar `await`: `src/app/api/ronda/route.ts`, `src/app/api/jugada/route.ts` y `src/app/(play)/jugar/page.tsx`.
- `src/data/questions.json` se borra cuando `/jugar` funcione leyendo de Supabase.

### Fase 2: lote de candidatos

- Tabla `stadium_candidates` con estas columnas: nombre, club, ciudad, país, `lat`, `lng`, año, capacidad, id de Wikidata, `used_at`.
- `scripts/import-wikidata.mjs`: una consulta SPARQL de estadios de fútbol de Latinoamérica, con upsert por id de Wikidata.
- Un workflow de GitHub Actions lo ejecuta cada 2 semanas.

### Fase 3: job diario

Un workflow de GitHub Actions con `schedule` (en UTC) ejecuta `scripts/daily-questions.mjs`:

1. Toma 5 candidatos con `used_at` en null.
2. El **generador** recibe solo los datos de esos 5 candidatos y devuelve, con salida estructurada, el acertijo, 3 pistas, la historia y la dificultad.
3. **Chequeos automáticos**:
   - la coordenada cae dentro del país;
   - ni el acertijo ni las pistas contienen el nombre del lugar;
   - no hay estadios duplicados;
   - la dificultad varía dentro de la ronda.
4. El **revisor** compara cada pregunta con los datos de origen y responde `pass`, `fix` (con el texto corregido) o `reject` (con el motivo).
5. Las preguntas que pasan se guardan como `ai_reviewed` con `round_date` = hoy + 7.
6. Fallback para la ronda de mañana (ver abajo).

Secretos del workflow: la URL de Supabase, la secret key de Supabase y la API key de Anthropic. La API de Claude se paga por uso y es aparte de la suscripción a Claude Code.

### Fase 4: bandeja de aprobación

- Una página de admin protegida por la variable de entorno `ADMIN_EMAILS`.
- Muestra cada pregunta `ai_reviewed` con el pin en el mapa y la nota del revisor. La persona aprueba, edita o rechaza.
- Permite marcar rondas aprobadas como reserva (`is_reserve`, sin fecha).
- Avisos:
  - quedan menos de 7 días aprobados;
  - la reserva tiene menos de 10 rondas.

### Fase 5: archivo premium

- Columna `plays.mode`, con valor `daily` o `archive`. `daily_ranking` filtra solo `daily`.
- Un endpoint propio para jugar rondas pasadas, que verifica que el usuario sea premium. `/api/jugada` sigue aceptando solo hoy y ayer.

### Fase 6: más contenido

- Columna `category`: estadio, lugar de nacimiento de un jugador, sede de una final, etc.
- Básquet con `sport = 'basquet'`.

## Fallback

El job diario revisa la ronda de mañana (D-1). Esto no ocurre al momento de jugar:

1. Si las 5 preguntas de mañana están `approved`, no se hace nada.
2. Si no, se toma una ronda de la reserva y se le asigna la fecha. Las preguntas no aprobadas vuelven a la bandeja sin fecha.
3. Si la reserva está vacía, se publica la ronda `ai_reviewed`.

Nunca hay un día sin ronda.

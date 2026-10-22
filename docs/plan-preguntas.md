# Preguntas: de dónde salen, dónde se guardan y cómo se programan

Plan para revisar e implementar. Hoy las preguntas viven en `src/data/questions.json`. La idea es pasarlas a una tabla de Supabase y armar un circuito para producirlas: candidatos de Wikidata, redacción, verificación y programación por fecha.

## Estado actual

- Hay 5 preguntas, todas con `fecha` 2026-10-05.
- Si una fecha no tiene preguntas, `getPublicRound` devuelve las 5 primeras del banco. Desde el 6 de octubre se repite la misma ronda todos los días, y con el ranking quien juega dos días ya sabe las respuestas.
- `/jugar` se genera estática al compilar (sale `○ /jugar` en `pnpm build`). Calcula la fecha una sola vez, en el build, así que muestra la ronda de ese día hasta el próximo despliegue.

## Reglas

- Las coordenadas, `lugar` e `historia` no llegan al navegador antes de la jugada. Solo el servidor lee la tabla, igual que `plays`.
- Solo se programan preguntas verificadas por una persona.
- Un día sin ronda muestra "No hay ronda hoy". No se repiten preguntas de otros días.

## Paso 0 — `/jugar` dinámica

Independiente del resto. Se puede hacer ya.

En `src/app/(play)/jugar/page.tsx`, la página pasa a `async` y llama a `await connection()` (de `next/server`) antes de `todayInBuenosAires()`, como `/ranking`.

Verificación: `pnpm build` muestra `ƒ /jugar` en vez de `○ /jugar`.

## Paso 1 — Tabla

`supabase/migrations/0003_questions.sql`:

    create table questions (
      id text primary key,
      mundo text not null default 'deporte',
      estado text not null default 'borrador'
        check (estado in ('borrador', 'verificada', 'descartada')),
      round_date date,
      orden int check (orden between 1 and 5),
      lugar text not null,
      lat double precision not null check (lat between -90 and 90),
      lng double precision not null check (lng between -180 and 180),
      pais text not null,
      fuente text not null,
      wikidata_id text unique,
      pregunta text,
      deporte text,
      dificultad int check (dificultad between 1 and 5),
      pistas text[],
      historia text,
      created_at timestamptz not null default now(),
      unique (mundo, round_date, orden),
      check (estado <> 'verificada' or (
        pregunta is not null and deporte is not null and dificultad is not null
        and historia is not null and pistas is not null and cardinality(pistas) = 3
      )),
      check (round_date is null or (estado = 'verificada' and orden is not null))
    );

    alter table questions enable row level security;

- Los datos del lugar son obligatorios desde que entra el candidato. Los textos, la dificultad y el deporte se completan al redactar, y son obligatorios para marcar la pregunta como verificada.
- `wikidata_id` es único: el mismo lugar no entra dos veces.
- La última restricción impide programar una pregunta sin verificar o sin orden.
- `mundo` queda desde ahora para Historia y Cultura: cada mundo tiene su propia ronda por día.
- RLS activo sin políticas: solo el cliente admin la lee.

## Paso 2 — Migrar el JSON

`scripts/import-questions.mjs` se corre una vez: lee `src/data/questions.json` y hace upsert en `questions` con el cliente admin. `fecha` pasa a `round_date` y `verificada: true` a `estado = 'verificada'`.

Después de migrar, `questions.json` se borra del repo. Si el repo de GitHub es público, cualquiera puede leer ahí las respuestas.

Verificación: `select id, round_date, orden, estado from questions order by round_date, orden;` devuelve las 5 filas.

## Paso 3 — `src/lib/questions.ts` lee la base

Las funciones mantienen el nombre y pasan a `async`:

- `getPublicRound(date)` trae las preguntas con `round_date = date`, ordenadas por `orden`, y devuelve solo los campos de `PublicQuestion`. Sin filas devuelve `[]`, sin el respaldo de las 5 primeras.
- `getQuestionById(id)` trae la fila completa.
- `findRoundDate(questionId, dates)` consulta la pregunta y devuelve su `round_date` si está entre las fechas pedidas.
- `getAllQuestions` y la importación del JSON se borran.

Hay que agregar `await` en los tres lugares que las usan: `src/app/api/ronda/route.ts`, `src/app/api/jugada/route.ts` y `src/app/(play)/jugar/page.tsx`.

`src/types/question.ts`: `fecha` pasa a llamarse `round_date` o se mapea en `questions.ts`. Conviene mapear y no cambiar los nombres que usan los componentes.

Verificación: jugar la ronda completa en `pnpm dev`. Después, en Supabase, mover la ronda a otra fecha y comprobar que `/jugar` muestra "No hay pregunta para hoy".

## Paso 4 — Candidatos desde Wikidata

`scripts/wikidata-candidates.mjs` consulta el endpoint SPARQL de Wikidata (`https://query.wikidata.org/sparql`) y carga cada resultado como `borrador`, con `lugar`, `lat`, `lng`, `pais`, `fuente` y `wikidata_id`. Los textos (`pregunta`, `pistas`, `historia`) quedan para el paso 5. Los datos de Wikidata son CC0: se pueden usar sin pedir permiso.

Consulta de partida para estadios de seis países (a ajustar):

    SELECT ?item ?itemLabel ?coord ?countryLabel WHERE {
      VALUES ?country { wd:Q414 wd:Q155 wd:Q96 wd:Q77 wd:Q739 wd:Q298 }
      ?item wdt:P31 wd:Q483110;
            wdt:P17 ?country;
            wdt:P625 ?coord.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }

Los países son Argentina, Brasil, México, Uruguay, Colombia y Chile. `P625` trae las coordenadas como `Point(lng lat)`, con la longitud primero.

Probada el 2026-10-18: devolvió 684 estadios (Brasil 372, Chile 117, México 76, Argentina 69, Colombia 30, Uruguay 20). Para que conteste:

- El pedido lleva `format=json` y un `User-Agent` propio con un contacto; sin eso Wikidata puede rechazarlo.
- Solo trae lo marcado directamente como "estadio" (`Q483110`). Los marcados con una subclase, como "estadio de fútbol", quedan afuera. Para incluirlos se usa `wdt:P31/wdt:P279* wd:Q483110`, que es más lenta y puede cortar por tiempo: conviene consultar un país por vez. El script inserta con `on conflict (wikidata_id) do nothing`, así se puede correr varias veces.

Verificación: `select count(*) from questions where estado = 'borrador';` crece después de correrlo, y una segunda corrida no duplica filas.

## Paso 5 — Redacción y verificación

Para empezar, en el Table Editor de Supabase. Por cada borrador:

1. Enunciado: un acertijo que no nombre el lugar.
2. Tres pistas, de la más general (región) a la más específica.
3. Historia: por qué se le dice así o qué pasó ahí, con tus palabras. El texto de Wikipedia tiene licencia CC BY-SA y no se copia.
4. Abrir `lat` y `lng` en un mapa y confirmar que el punto cae en el lugar.
5. Confirmar cada dato de la historia en `fuente` o en otra fuente fiable.
6. Pasar `estado` a `verificada`, o a `descartada` si no sirve.

Si un modelo de IA propone los textos, igual se hacen los pasos 4 y 5: inventa datos con seguridad.

## Paso 6 — Programación

- Asignar `round_date` y `orden` a 5 preguntas verificadas por día.
- Dificultad creciente: las preguntas 4 y 5 valen ×3.
- Variar países dentro de la misma ronda.
- Tener al menos 14 días programados por delante.

Días sin ronda en las próximas dos semanas:

    select d::date as dia
    from generate_series(current_date, current_date + 13, interval '1 day') d
    where (select count(*) from questions q
           where q.mundo = 'deporte' and q.round_date = d::date) < 5;

## Para después

- Página `/admin` protegida para redactar y programar sin entrar a Supabase.
- Script que pida a un modelo de IA el borrador de enunciado, pistas e historia a partir de los datos de Wikidata.
- Aviso automático cuando falten menos de 7 días programados.
- Rondas de Historia y Cultura con el mismo circuito, cambiando `mundo` y la consulta de Wikidata.

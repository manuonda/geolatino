# Preguntas: banco, generación y publicación diaria

Plan para pasar de 5 preguntas en `src/data/questions.json` a una ronda nueva por día, generada con IA y aprobada por una persona.

## Estado

Diseño cerrado para las fases 1 a 6. Las fases 7 (generación con Gemini) y 8 (idiomas) se agregaron el 2026-10-21 y la fase 4a (ABM de admin) el 2026-10-28; están para revisar. El seguimiento de tareas está en `docs/task-list.json`.

Hecho:

- `/jugar` se genera en cada pedido (`await connection()` en `src/app/(play)/jugar/page.tsx`). Antes se generaba al compilar y mostraba la ronda del día del build. Commit `bda07ba`.
- Fase 1 en código: las preguntas se leen de la tabla `questions`, sin el fallback `bank.slice(0, 5)`. Un día sin preguntas aprobadas muestra "No hay pregunta para hoy". Falta correr 0003, el seed y 0004 en el Supabase real.

Tests: `pnpm test` (unitarios) y `pnpm test:db` (Postgres + PostgREST en Docker, con todas las migraciones).

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
- **Textos de apoyo**: la API REST de Wikipedia (`/api/rest_v1/page/summary/{título}`) da el resumen del artículo. Se consulta en el idioma del país del estadio (pt para Brasil, es para el resto), porque ahí suele haber más detalle sobre apodos e historia. Es gratis y sin clave, con la misma regla de User-Agent. El texto tiene licencia CC BY-SA: se usa como hecho para el generador y nunca se copia tal cual en la pregunta.
- **Segunda fuente de coordenadas**: OpenStreetMap (Overpass, `leisure=stadium`). Si queda a más de 1 km de Wikidata, la pregunta va a revisión con la diferencia anotada. No reemplaza la coordenada de Wikidata.
- **Coordenadas**: salen siempre de Wikidata. Ningún modelo las genera ni las corrige. Si el revisor duda de una ubicación, rechaza la pregunta.
- **Modelos** (diseño original; la fase 7 propone pasar a Gemini):
  - Generador: `claude-sonnet-5-5`.
  - Revisor: `claude-opus-5-5`. El revisor es más fuerte que el generador a propósito.
- **Costo estimado**: unos $2.50 por mes. El razonamiento interno (thinking) se cobra como salida, así que el costo puede ser 2 o 3 veces mayor. La primera semana se registra `response.usage` de cada llamada para medir el costo real.
- **Prompt caching**: no sirve aquí. El cache dura 5 minutos o 1 hora, y la llamada es una vez por día. El ahorro viene de enviar solo los datos de los 5 candidatos.
- **Proveedor intercambiable**: el job usa las interfaces `QuestionGenerator` y `QuestionReviewer`. Cada proveedor (Claude hoy, quizás OpenAI después) es un adaptador. El JSON schema y la validación con zod viven en nuestro código. Los prompts están en archivos aparte.

## Hallazgos de Wikidata (2026-10-18 al 2026-10-21)

- Los 5 `fuente` de `src/data/questions.json` apuntan a entidades que no son estadios (por ejemplo `Q275701` es un accidente de avión). Las coordenadas sí están bien: quedan a menos de 20 m de las de Wikidata. El seed de la fase 1 tiene que usar los ids correctos: Bombonera `Q499855`, Maracaná `Q155174`, Azteca `Q320454`, Centenario `Q498245`, El Campín `Q179027`.
- Los ids de Wikidata salen siempre de la consulta. Ningún modelo ni persona los escribe a mano.
- La consulta tiene que incluir subclases (`wdt:P31/wdt:P279* wd:Q483110`). Con `wdt:P31 wd:Q483110` solo hay 684 estadios en AR, BR, MX, UY, CO y CL, y la Bombonera no aparece. Con subclases son 1208 (Argentina pasa de 69 a 176).
- El apodo (`P1449`) está en 4 de esos 1208 estadios. El "por qué se le dice así" sale de Wikipedia, no de Wikidata.
- La capacidad (`P1083`) está en unos dos tercios.
- Hay muchos estadios municipales poco conocidos. Para elegir candidatos conviene ordenar por cantidad de artículos de Wikipedia (`wikibase:sitelinks`). Sin probar todavía.
- El endpoint necesita `format=json` en la URL. Con solo el header `Accept` la respuesta no se pudo leer como JSON.

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

### Fase 4a: ABM de preguntas y calendario

Va antes de la IA: permite cargar y validar preguntas a mano en cuanto exista la tabla `questions` (fase 1). Cuando llegue Gemini, sus preguntas `ai_reviewed` entran a esta misma bandeja.

- `src/lib/admin.ts`: `requireAdmin()` lee la sesión y compara el email con `ADMIN_EMAILS` (lista separada por comas). Si no coincide, `notFound()`.
- `src/app/admin/layout.tsx` llama a `requireAdmin()`. **Cada Server Action también la llama**: una action se puede invocar sin pasar por el layout.
- Rutas:
  - `/admin/preguntas`: lista con filtros por estado, fecha y país.
  - `/admin/preguntas/nueva`: alta con acertijo, 3 pistas, historia, dificultad y el pin elegido con un clic en el mapa.
  - `/admin/preguntas/[id]`: editar, aprobar o rechazar con motivo.
  - `/admin/calendario`: los próximos 14 días con sus 5 lugares. Verde: 5 aprobadas. Amarillo: incompleto o con preguntas sin aprobar. Rojo: vacío. Desde ahí se asignan preguntas aprobadas a un día y lugar.
- `src/app/admin/preguntas/actions.ts`: crear, editar, aprobar, rechazar y asignar fecha, con validación zod. Usan el cliente admin de Supabase.
- Migración: columnas `reviewed_by`, `reviewed_at` y `reject_reason` en `questions`.
- Reglas:
  - Una pregunta cuya `round_date` ya llegó no se edita, salvo el texto de `story`: hay jugadas guardadas con su puntaje.
  - Solo se juegan preguntas `approved`. El `unique (round_date, position)` impide dos preguntas en el mismo lugar.
  - Aviso en el calendario cuando quedan menos de 7 días completos.
- Con la fase 2, `/admin/candidatos` lista los estadios importados de Wikidata y el botón "crear pregunta" abre el alta con nombre, país y coordenadas ya cargados.

### Fase 4: bandeja de la IA

Se suma a la fase 4a cuando existan las fases 3 y 7.

- La ficha de cada pregunta `ai_reviewed` muestra los `facts` usados y la nota del revisor.
- Permite marcar rondas aprobadas como reserva (`is_reserve`, sin fecha).
- Aviso cuando la reserva tiene menos de 10 rondas.

### Fase 5: archivo premium

- Columna `plays.mode`, con valor `daily` o `archive`. `daily_ranking` filtra solo `daily`.
- Un endpoint propio para jugar rondas pasadas, que verifica que el usuario sea premium. `/api/jugada` sigue aceptando solo hoy y ayer.

### Fase 6: más contenido

- Columna `category`: estadio, lugar de nacimiento de un jugador, sede de una final, etc.
- Básquet con `sport = 'basquet'`.

### Fase 7: generación con Gemini

Pedido del 2026-10-21: usar los modelos de Google (Gemini) para el generador y el revisor, en lugar de Claude. No cambia el diseño de la fase 3, porque el job ya usa las interfaces `QuestionGenerator` y `QuestionReviewer`.

- `src/lib/ai/gemini.ts` (o dentro de `scripts/`): adaptador de Gemini para las dos interfaces. Usa salida estructurada con el mismo JSON schema, y la respuesta se valida con zod igual que con cualquier otro proveedor.
- Recolección antes del generador: el job arma los `facts` de cada candidato (datos de Wikidata + resumen de Wikipedia + fuente de cada dato) y se los pasa al generador. El generador escribe solo con esos hechos.
- Columnas nuevas en `questions`:
  - `facts` (jsonb): lo que recibió el generador.
  - `review` (jsonb): veredicto y motivos del revisor.
  - `generated_by` (text): proveedor, modelo y versión del prompt.
- La bandeja de la fase 4 muestra `facts` y `review` al lado del texto.
- Secretos del workflow: la API key de Gemini en lugar de la de Anthropic.

Decisiones abiertas:

- Qué modelo de Gemini va en cada rol. El diseño original pone un revisor más fuerte que el generador a propósito. Otra opción es que el revisor sea de otro proveedor, para que no comparta los errores del generador.
- Plan gratis o pago. En el plan gratis, Google puede usar lo que se envía para mejorar sus productos, y los límites de uso cambian seguido. Revisar las condiciones vigentes en Google AI Studio antes de elegir. Con datos públicos de Wikidata y Wikipedia el riesgo es bajo.
- El costo estimado de $2.50 por mes era para Claude. Con Gemini hay que medirlo igual: registrar el uso de tokens de cada llamada la primera semana.

### Fase 8: idiomas

Idiomas pedidos: español, inglés, portugués y "latinos". La ronda, las coordenadas y el ranking son los mismos en todos los idiomas. Solo cambian los textos.

Decisión abierta: qué es "latinos". Los textos actuales están en español rioplatense, con voseo ("Tocá", "Probá"). Si "latinos" significa un español latinoamericano neutro, son dos variantes del español (`es-AR` y `es-419`). Si no, alcanza con un solo `es`.

Locales propuestos: `es` (base), `en`, `pt-BR`.

**8a. Interfaz.** Sigue la guía de `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`:

- Las páginas pasan a `src/app/[lang]/`, con los grupos `(marketing)` y `(play)` adentro. El root layout pasa a `src/app/[lang]/layout.tsx` y pone `<html lang>` según el idioma.
- `src/app/api/` y `src/app/auth/` quedan fuera de `[lang]`.
- Diccionarios: `src/i18n/dictionaries/{es,en,pt-BR}.json` y `getDictionary()`, que lee el idioma con `next/root-params`.
- `src/proxy.ts` hace dos cosas en el mismo archivo: redirige a `/{lang}` según `Accept-Language` (con `@formatjs/intl-localematcher` y `negotiator`, o la cookie `NEXT_LOCALE` si el usuario eligió otro idioma) y refresca la sesión de Supabase. Hay que excluir `/api` y `/auth` de la redirección.
- Textos que hoy están escritos en el código: botones, `GameMenu.tsx`, `/puntaje`, `ShareButton.tsx`, `opengraph-image.tsx`, `metadata` y el formato de fecha de `formatRoundDate` (hoy fijo en `es-AR`).
- `players.locale`: el idioma que eligió el jugador con sesión.

**8b. Contenido de las preguntas.**

- Tabla `question_translations`: `question_id`, `locale`, `prompt`, `hints`, `story`, `place_name`, `status` (`draft`, `ai_reviewed`, `approved`, `rejected`), con clave primaria `(question_id, locale)` y RLS sin políticas. Los textos de `questions` quedan como la versión base en español.
- En el job de la fase 3, después de la revisión en español, un **traductor** (Gemini) pasa cada pregunta a los otros idiomas y el **revisor** compara la traducción con el original y con los `facts`. El acertijo y las pistas se adaptan, no se traducen palabra por palabra.
- `place_name` usa la etiqueta de Wikidata en ese idioma cuando existe.
- `/api/ronda` y `/jugar` reciben el idioma. Si una pregunta no tiene traducción `approved` en ese idioma, se muestra en español.
- La bandeja de la fase 4 filtra por idioma. Aprobar el español sigue siendo obligatorio; las traducciones se pueden aprobar después.

## Fallback

El job diario revisa la ronda de mañana (D-1). Esto no ocurre al momento de jugar:

1. Si las 5 preguntas de mañana están `approved`, no se hace nada.
2. Si no, se toma una ronda de la reserva y se le asigna la fecha. Las preguntas no aprobadas vuelven a la bandeja sin fecha.
3. Si la reserva está vacía, se publica la ronda `ai_reviewed`.

Nunca hay un día sin ronda.

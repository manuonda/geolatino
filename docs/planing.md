# Login, jugadas y ranking

Plan para revisar e implementar. Next.js sigue calculando el puntaje. Supabase autentica y guarda.

Solo cuenta para el ranking la primera jugada de un usuario con sesión, escrita dentro de `POST /api/jugada`. Un segundo intento de la misma pregunta, el mismo día, no pisa la fila: la respuesta muestra la jugada guardada. `src/lib/proof.ts` no se modifica.

## Estado

Hecho:

- `@supabase/ssr` y `@supabase/supabase-js` en `package.json`
- Nombres de variables en `.env.example`
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_plays_round_date_index.sql`
- `NEXT_PUBLIC_SITE_URL` en `.env.example` y `.env`

- Código de los pasos 3 a 7. Compila con `pnpm build` y las rutas responden bien sin sesión.

Falta poner las claves reales de Supabase en `.env` (hoy tiene los valores de ejemplo), correr las dos migraciones en el panel de Supabase y configurar Google (paso 4). Sin eso no se probó el login real, el guardado de jugadas ni el ranking con datos.

Diferencias con lo planeado:

- El destino después del login viaja en una cookie (`gl-next`), no en la URL de retorno, para que esa URL coincida exacta con la permitida en Supabase.
- La sesión se lee con `getClaims()`, que verifica la firma del token.
- Archivos que el plan no nombraba: `src/lib/auth-redirect.ts`, `src/lib/players.ts` y `src/features/auth/components/SessionStatus.tsx`.

## Regla de acceso

RLS está activo en `players` y `plays`, sin políticas. El navegador no lee ni escribe esas tablas.

| Cliente | Archivo | Para qué |
|---|---|---|
| Cookies | `src/lib/supabase/server.ts` | Saber si hay usuario, login y logout |
| Secret key | `src/lib/supabase/admin.ts` | Insertar jugadores y jugadas, leer el ranking |

`admin.ts` no se importa desde un archivo con `"use client"`.

## Variables

En `.env`, que no se commitea:

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
    SUPABASE_SECRET_KEY=
    NEXT_PUBLIC_SITE_URL=

`NEXT_PUBLIC_SITE_URL` es la URL pública del sitio (`http://localhost:3000` en desarrollo, `https://geolatino.app` en producción). El login arma con ella la URL de retorno. No se usa el origen del pedido porque detrás de un proxy inverso puede ser `localhost:3000`. Falta agregarla a `.env.example`.

## Paso 2 — Verificar la base

El esquema ya está en `supabase/migrations/0001_init.sql`. Hay que ejecutarlo en Supabase → SQL Editor si todavía no corrió.

Agregar `supabase/migrations/0002_plays_round_date_index.sql`. La clave primaria de `plays` empieza por `player_id`, así que el ranking por fecha recorrería toda la tabla:

    create index plays_round_date_idx on plays (round_date);

`players.id` referencia `auth.users`. Para probar una fila: Authentication → Users → Add user, copiar el UUID, insertar en `players` y en `plays`, y correr `select * from daily_ranking`.

## Paso 3 — Clientes

`src/lib/supabase/server.ts`:

    import { createServerClient } from "@supabase/ssr";
    import { cookies } from "next/headers";

    export async function createClient() {
      const cookieStore = await cookies();

      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options),
                );
              } catch {
                // En un Server Component no se pueden escribir cookies.
                // src/proxy.ts refresca la sesión en cada pedido.
              }
            },
          },
        },
      );
    }

`src/lib/supabase/admin.ts`:

    import { createClient } from "@supabase/supabase-js";

    export function createAdminClient() {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
    }

## Paso 4 — Login con Google

En Google Cloud, la URI de redirección del OAuth es `https://<proyecto>.supabase.co/auth/v1/callback`.

En Supabase → Authentication, activar Google y permitir:

- `http://localhost:3000/auth/callback`
- `https://geolatino.app/auth/callback`

En Supabase → Authentication → URL Configuration, el Site URL es `https://geolatino.app`.

`src/app/auth/login/route.ts` redirige a Google. La URL de retorno es `NEXT_PUBLIC_SITE_URL` + `/auth/callback`.

`src/app/auth/callback/route.ts`:

1. Cambia el `code` por la sesión.
2. Hace upsert en `players` con el cliente admin. Si el upsert falla, cierra la sesión y redirige a `/` con un error: sin fila en `players`, cada insert en `plays` fallaría por clave foránea (`23503`).
3. Redirige solo si el destino empieza con `/` y no con `//`.

Nombre público: `display_name` se ve en el ranking. Se guarda el primer nombre (la primera palabra de `full_name` o `name` de Google), no el nombre completo. Si Google no manda nombre, se guarda `Jugador`, porque la columna es `not null`. Decisión a confirmar: dejar elegir un apodo.

`src/app/auth/logout/route.ts` es POST y redirige con estado 303. Con el 307 por defecto el navegador repite el POST contra `/`.

`src/proxy.ts` refresca la cookie en cada pedido. En esta versión de Next el archivo se llama `proxy.ts` y exporta `proxy`, no `middleware`. Seguir el ejemplo de la guía SSR de Supabase sin cambiarle el orden: es fácil perder las cookies si se devuelve otra respuesta que la que arma el cliente. Lleva `matcher` para que no corra en estáticos:

    export const config = {
      matcher: [
        "/((?!_next/static|_next/image|maplibre/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav)$).*)",
      ],
    };

Verificación: entrar con Google y ver la fila en `players`. Salir y comprobar que vuelve a `/` sin error 405.

## Paso 5 — Guardar la jugada

`src/lib/plays.ts` inserta en `plays`. Si Postgres devuelve `23505`, lee la fila existente y la devuelve. También exporta `getDailyRanking(roundDate)`.

`src/app/api/jugada/route.ts`:

1. Valida `questionId` y el guess: `lat` y `lng` son números finitos, `lat` entre -90 y 90, `lng` entre -180 y 180. `hintsUsed` se recorta a un entero entre 0 y `MAX_HINTS` antes de calcular y de guardar.
2. Busca la pregunta en la ronda de hoy y, si no está, en la de ayer (fechas de Buenos Aires). `round_date` es la fecha de la ronda donde apareció. Si no está en ninguna, rechaza sin devolver coordenadas. Se acepta ayer porque una ronda empezada a las 23:58 termina después de medianoche.
3. Calcula km, raw score, hints y multiplicador en el servidor.
4. Sin usuario, responde como hoy con `persisted: false` y no escribe.
5. Con usuario, llama a `saveFirstPlay`. La respuesta usa la fila guardada, no el segundo toque.

En `PlayResult` (`src/features/round/services/roundService.ts`) se agrega `persisted: boolean`.

## Paso 6 — Ranking

`src/app/(marketing)/ranking/page.tsx` es un Server Component. Consulta `daily_ranking` con `todayInBuenosAires()`, orden `total_score` descendente y `finished_at` ascendente, límite 50. La consulta usa el cliente admin.

La página llama a `await connection()` (de `next/server`) antes de consultar. El cliente admin no lee cookies, así que sin eso Next puede generar la página una sola vez al compilar y el ranking quedaría congelado. Esta versión de Next no documenta `export const dynamic`.

Verificación: `pnpm build && pnpm start`, guardar una jugada y recargar `/ranking`. En `pnpm dev` el problema no se ve.

## Paso 7 — Pantallas

- `src/app/(marketing)/page.tsx`: sin sesión, enlace "Entrar con Google para competir" a `/auth/login`. Con sesión, el nombre y un formulario POST a `/auth/logout`. Salir no es un `<Link>`.
- `src/shared/components/GameMenu.tsx`: enlace a `/ranking`.
- `src/features/results/components/RoundRecapView.tsx`: enlace "Ver ranking". Si ninguna jugada tiene `persisted`, avisar que esa ronda no entra al ranking.

## Para después

- Si el usuario ya tiene 5 jugadas de hoy, `/jugar` redirige a resultados leídos de la base, no de `sessionStorage`.
- Cada pista se pide al servidor. Hoy `hintsUsed` lo manda el navegador, y se puede declarar cero habiendo visto las pistas.
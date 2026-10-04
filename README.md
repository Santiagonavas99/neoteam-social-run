# NeoTeam Social Run

MVP del **Social Run · Aniversario NeoTeam** del 18 de octubre de 2026.

## Estado actual

- Landing pública `/`
- Registro `/registro`
- Validación con Zod
- Registro real conectado a Supabase mediante RPC pública limitada
- Código automático tipo `SR26-00001`
- Base visual de administración `/admin`
- Acceso del panel con PIN propio de 6 dígitos
- Supabase remoto ya provisionado
- RLS activo en las tablas del proyecto

## Stack

- Next.js 16.3.8
- React 19.3
- TypeScript
- Supabase
- Vercel

## Supabase

Proyecto remoto:

- Project ref: `ohatsnkgaeccltqwhkbv`
- URL: `https://ohatsnkgaeccltqwhkbv.supabase.co`

El navegador **no tiene acceso directo** a la tabla `registrations`.
El formulario usa la función RPC `register_social_run_participant`, que únicamente permite crear un registro validado y devuelve el código de inscripción.

### Setup inicial del panel

El panel necesita dos variables públicas de Supabase en cada entorno de Vercel donde se use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

En Vercel, agrega ambas a **Settings → Environment Variables** para `Preview` (y para `Production` si vas a usar el panel allí). Para una preview ligada a una rama concreta, selecciona esa rama. Estos valores identifican el proyecto Supabase y su clave publishable; **no configures el PIN como variable de Vercel**.

Para proteger el primer acceso, crea una clave privada de setup y guárdala solo en **Supabase → Edge Functions → Secrets**, con el nombre `ADMIN_SETUP_SECRET`. Puedes generarla localmente con `openssl rand -hex 32`. No la agregues al repositorio ni a una variable `NEXT_PUBLIC_*`.

Primer acceso: abre `/admin`, introduce `ADMIN_SETUP_SECRET` y escribe el nuevo PIN de 6 dígitos dos veces. El backend guarda el PIN cifrado en Supabase. En adelante, inicia sesión con el PIN; no vuelvas a escribir la clave de setup. El backend limita los intentos y rechaza el setup si el secreto no está configurado. Puedes eliminar `ADMIN_SETUP_SECRET` desde Supabase después de completar el primer acceso.

Las Edge Functions usan `Deno.env.get("ADMIN_SETUP_SECRET")`; Supabase aplica los cambios de secretos sin volver a desplegar la función.

Al cambiar el PIN, el panel solicita el PIN actual, crea una sesión nueva y revoca las anteriores.

## Variables de entorno

Crear `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://ohatsnkgaeccltqwhkbv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_hNaIF1UGc-ZU7GFdDqwn0A_3gHk9Mkg
```

La publishable key puede estar en el frontend; el acceso real a datos sigue controlado por RLS y por los permisos de la función RPC.

## Desarrollo

```bash
npm install
npm run dev
```

Para validar producción:

```bash
npm run typecheck
npm run build
```

> En el entorno donde se generó este starter el acceso a npm estaba bloqueado, por lo que el build final debe validarse en Vercel o en una máquina con acceso al registro npm.

## Base de datos

La base remota ya contiene:

- `events`
- `running_groups`
- `brands`
- `registrations`
- `raffles`
- `raffle_entries`
- `admin_profiles`

El proyecto remoto es por ahora la fuente de verdad del esquema. Cuando establezcamos el repo definitivo, conviene hacer un `supabase db pull` para guardar el esquema completo como migraciones versionadas.

## Roadmap inmediato

1. Subir este proyecto a GitHub.
2. Importarlo en Vercel.
3. Configurar las 3 variables de entorno en Vercel.
4. Validar registro real desde la URL preview.
5. Diseñar la dirección visual definitiva.
6. Completar el hardening y conectar `/admin` con métricas reales.
7. Check-in por QR.
8. Rifas entre asistentes confirmados.
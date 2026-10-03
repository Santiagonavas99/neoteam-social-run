# NeoTeam Social Run

MVP del **Social Run · Aniversario NeoTeam** del 18 de octubre de 2026.

## Estado actual

- Landing pública `/`
- Registro `/registro`
- Validación con Zod
- Registro real conectado a Supabase mediante RPC pública limitada
- Código automático tipo `SR26-00001`
- Base visual de administración `/admin`
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
6. Conectar `/admin` con Supabase Auth y métricas reales.
7. Check-in por QR.
8. Rifas entre asistentes confirmados.

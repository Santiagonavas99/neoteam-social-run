# Activar la seguridad del panel admin

Guía paso a paso para activar la protección del PIN que ya está en `main` (`v0.1.0`).

**Estado actual:** el código nuevo del proxy ya está desplegado en Vercel, pero falta `ADMIN_PROXY_SECRET`, así que `/admin` en producción devuelve **503**. La web pública (`/`, `/registro`) funciona normal.

**Regla de oro:** el valor del secreto nunca se pega en el chat, en el repo ni en una variable `NEXT_PUBLIC_*`. Solo va en Vercel y en Supabase.

---

## Resumen

| # | Dónde | Qué | Resultado |
|---|-------|-----|-----------|
| 1 | Terminal local | Generar el secreto | Una cadena de 64 caracteres |
| 2 | Vercel | Guardar `ADMIN_PROXY_SECRET` | — |
| 3 | Vercel | Redesplegar producción | `/admin` vuelve a funcionar |
| 4 | Móvil | Comprobar `/admin` | Sale la pantalla del PIN |
| 5 | Supabase Dashboard | Guardar el mismo secreto | — |
| 6 | Terminal local | CLI de Supabase: migración + funciones | Login protegido |
| 7 | Móvil | Prueba final | Todo verificado |

---

## 1. Generar el secreto (terminal local)

```bash
openssl rand -hex 32
```

Devuelve 64 caracteres hexadecimales, por ejemplo `3f9a…c21e`. Cópialo y guárdalo temporalmente en tu gestor de contraseñas; lo vas a pegar en Vercel y en Supabase.

> Sin el `32` al final, el comando no imprime nada.

## 2. Guardar el secreto en Vercel

1. Abre el proyecto **neoteam-social-run** en Vercel.
2. **Settings → Environment Variables → Add**.
3. Rellena:
   - **Key:** `ADMIN_PROXY_SECRET` (exacto, sin `NEXT_PUBLIC_`)
   - **Value:** la cadena del paso 1
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - **Sensitive:** actívalo si aparece la opción
4. **Save**.

## 3. Redesplegar producción (Vercel)

Las variables nuevas solo se aplican en despliegues nuevos.

1. Ve a **Deployments**.
2. Abre el último despliegue de **Production**.
3. **⋯ → Redeploy** y confirma.
4. Espera a que quede en **Ready**.

## 4. Comprobar (móvil)

Abre `https://<tu-dominio>/admin` en el móvil.

- ✅ Sale la pantalla del PIN y puedes entrar: el panel funciona como antes. Todavía no está protegido, porque las edge functions viejas ignoran el secreto.
- ❌ Sigue fallando: revisa que el nombre sea exactamente `ADMIN_PROXY_SECRET` y que redesplegaste **después** de guardarlo.

## 5. Guardar el mismo secreto en Supabase

1. Supabase Dashboard → proyecto `ohatsnkgaeccltqwhkbv`.
2. **Edge Functions → Secrets → Add new secret**.
3. **Name:** `ADMIN_PROXY_SECRET`; **Value:** el **mismo** valor que pusiste en Vercel.
4. **Save**.

> Si los valores de Vercel y Supabase no coinciden exactamente, después del paso 6 el panel responde "No autorizado".

## 6. Migración y funciones (terminal local, CLI de Supabase)

Todo esto se ejecuta en **tu terminal**, dentro de la carpeta del proyecto. La CLI envía los archivos del repo al proyecto remoto.

### 6.1 Instalar la CLI (solo la primera vez)

```bash
brew install supabase/tap/supabase
```

### 6.2 Iniciar sesión

```bash
supabase login
```

Se abre el navegador para autorizar con tu cuenta de Supabase.

### 6.3 Conectar la carpeta con el proyecto

```bash
cd ~/projects/neoteam-social-run
supabase link --project-ref ohatsnkgaeccltqwhkbv
```

Pide la **contraseña de la base de datos**: Dashboard → **Project Settings → Database**. Si no la recuerdas, puedes resetearla ahí; la web no se ve afectada.

### 6.4 Ver qué se va a aplicar (no cambia nada)

```bash
supabase migration list
```

Muestra dos columnas: **Local** (repo) y **Remote** (lo que Supabase tiene registrado).

- Lo esperado: solo `20261006090000` falta en **Remote**.
- Si faltan más, **para aquí** y comparte la salida para revisarla. Las cuatro migraciones del repo se pueden ejecutar más de una vez sin problema (`if not exists`, `on conflict`, `drop policy if exists`), pero conviene confirmarlo antes.

### 6.5 Aplicar la migración

```bash
supabase db push
```

Crea las funciones `admin_pin_reserve_attempt` y `admin_pin_mark_success` (límite de intentos atómico: 8 fallos por IP cada 10 min y 50 fallos en total por hora).

**Alternativa sin CLI:** Dashboard → **SQL Editor → New query**, pega el contenido de `supabase/migrations/20261006090000_admin_pin_atomic_attempts.sql` y pulsa **Run**.

### 6.6 Desplegar las edge functions

> Requisito: el paso 5 hecho. Desde este momento las funciones rechazan cualquier llamada sin el secreto.

```bash
supabase functions deploy admin-pin admin-logos
```

## 7. Prueba final (móvil primero, luego escritorio)

| Prueba | Esperado |
|--------|----------|
| Login con el PIN correcto | Entra al panel |
| 1 PIN incorrecto | "PIN incorrecto." |
| Check-in de un participante | Se guarda |
| Subir un logo en "Carrusel logos" | Se sube y aparece |
| Cerrar sesión y volver a entrar | Funciona |

Opcional (escritorio), para confirmar que las funciones no aceptan llamadas directas:

```bash
curl -s -X POST https://ohatsnkgaeccltqwhkbv.supabase.co/functions/v1/admin-pin \
  -H "apikey: <publishable key de .env.example>" \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}'
```

Esperado: `{"error":"No autorizado."}`.

---

## Si algo sale mal

| Síntoma | Causa probable | Arreglo |
|---------|----------------|---------|
| `/admin` da 503 | Falta el secreto en Vercel o no se redesplegó | Pasos 2 y 3 |
| "No autorizado." al entrar | Los secretos de Vercel y Supabase no coinciden | Repite el paso 5 con el mismo valor |
| "No pudimos verificar el acceso" (503) | Falta la migración del paso 6.5 | `supabase db push` o la alternativa del SQL Editor |
| "Demasiados intentos" | El límite funciona; o hubo más de 50 fallos en una hora | Espera 10 min (por IP) o 1 h (global) |

**Volver atrás:** redesplegar las versiones anteriores de las funciones desde el Dashboard (Edge Functions → función → Deployments). Las funciones SQL nuevas no hacen nada si nadie las llama.

## Fase 2: sorteos atómicos (rama `fix/atomic-draws`)

Cuando esa rama esté fusionada en `main`. Desde la terminal, en la carpeta del proyecto:

```bash
supabase migration list              # debe faltar solo 20261006091000 en Remote
supabase db push                     # crea draw_raffle, draw_dynamic, record_dynamic_participation
supabase functions deploy admin-pin  # la función empieza a usarlas
```

El orden importa: primero `db push`, luego `functions deploy`. Si despliegas la función antes, los sorteos y los escaneos fallarán hasta que exista la migración.

Prueba desde el móvil con una rifa y una dinámica **de prueba** (bórralas al terminar):

| Prueba | Esperado |
|--------|----------|
| Sortear una rifa abierta | Muestra los ganadores |
| Pulsar "Sortear" dos veces seguidas | Un solo sorteo; el segundo dice "Abre la rifa antes de sortear." |
| Escanear el mismo QR dos veces en una dinámica | La segunda vez indica que ya participó |
| Ganador instantáneo con 1 premio y varios escaneos | Nunca más ganadores que premios |

## Después

Con la fase 1 verificada, ejecuta `supabase db pull` y comparte el resultado: sirve para confirmar que las tablas `raffles`, `raffle_entries`, `registrations`, `dynamics` y `dynamic_participations` tienen las columnas que asumen los sorteos atómicos antes de la fase 2.

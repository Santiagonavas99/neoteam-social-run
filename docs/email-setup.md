# Configuración del correo (Resend)

Paso a paso para el correo del pase y el código de un solo uso en `/pase` (spec: [`2026-10-06-pass-email-design.md`](superpowers/specs/2026-10-06-pass-email-design.md)).

**Desde la 0.9.0 el panel se abre con un código que llega por correo, así que los pasos 1 a 4 tienen que estar hechos antes de desplegarlo.** El orden de despliegue está al final, en [Despliegue del panel (0.9.0)](#despliegue-del-panel-090).

Los correos los envían las funciones de Supabase (`registration-pass` y `admin-pin`), nunca Vercel ni el navegador. Por eso **todas las variables de esta guía son secretos de Supabase, y en Vercel no se agrega nada.**

Nunca pegues la API key en el chat, en el repo ni en una variable `NEXT_PUBLIC_*`.

## 1. Cuenta de Resend

1. Crea la cuenta en [resend.com](https://resend.com). El plan gratuito permite 3.000 correos al mes y **como máximo 100 al día**.
2. Activa el doble factor (Settings → Account). Quien entre a esta cuenta puede enviar correos a nombre del evento.

## 2. Dominio: `socialrun.site` (comprado en Vercel)

El dominio y sus DNS están en Vercel. Los correos salen desde el dominio principal, `socialrun.site` (así quedó verificado en Resend, región `sa-east-1`).

### 2a. Conectar la web al dominio

1. **Vercel → proyecto → Settings → Domains → Add:** `socialrun.site`.
2. Acepta agregar también `www.socialrun.site`, con redirección a `socialrun.site`.

Vercel crea solo los registros de la web, porque también es el proveedor de DNS.

### 2b. Verificar el dominio de envío en Resend

Sin un dominio verificado, Resend solo entrega correos a la dirección del dueño de la cuenta.

1. **Resend → Domains → Add domain:** `socialrun.site`. Región: `sa-east-1` (São Paulo).
2. Resend muestra tres registros. Agrega cada uno en **Vercel → Domains → `socialrun.site` → DNS Records → Add**:
   - en el campo **Name** de Vercel va solo la parte que está antes de `socialrun.site`, como en la tabla de abajo;
   - el **Value** lo copias de Resend; es largo y distinto para cada cuenta;
   - en el registro MX, pon la prioridad que indica Resend (normalmente `10`).

   | Tipo | Name (en Vercel) | Value | Para qué sirve |
   |------|------------------|-------|----------------|
   | `TXT` | `resend._domainkey` | `p=MIGf…` (de Resend) | DKIM: firma cada correo |
   | `MX` | `send` | `feedback-smtp.sa-east-1.amazonses.com` (de Resend), prioridad `10` | Recibir los rebotes |
   | `TXT` | `send` | `v=spf1 include:amazonses.com ~all` (de Resend) | SPF: autoriza a Resend a enviar |

3. Agrega también DMARC, que Gmail y Yahoo exigen para entregar bien. Cambia la dirección por un correo que revises:

   | Tipo | Name (en Vercel) | Value |
   |------|------------------|-------|
   | `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:tu-correo@example.com` |

4. **Resend → Verify DNS records.** Con los DNS de Vercel suele tardar unos minutos. Espera a que todos los registros digan **Verified**.

**Comprobación desde la terminal** (cada comando debe responder con el valor que pegaste):

```bash
dig +short TXT resend._domainkey.socialrun.site @ns1.vercel-dns.com
dig +short MX send.socialrun.site @ns1.vercel-dns.com
dig +short TXT send.socialrun.site @ns1.vercel-dns.com
dig +short TXT _dmarc.socialrun.site @ns1.vercel-dns.com
```

## 3. API key

1. **API Keys → Create API key.**
   - Name: `neoteam-social-run-supabase`.
   - Permission: **Sending access** (no Full access).
   - Domain: solo `socialrun.site`.
2. Cópiala. Resend la muestra una sola vez; empieza por `re_`.

## 4. Secretos en Supabase

| Secreto | Valor | Ejemplo |
|---------|-------|---------|
| `RESEND_API_KEY` | La key del paso 3 | `re_…` |
| `EMAIL_FROM` | Nombre y dirección del remitente, **en el dominio verificado** (si no coinciden, Resend rechaza el envío y la función responde 503) | `NeoTeam Social Run <pase@socialrun.site>` |
| `SITE_URL` | Dirección pública del sitio, sin barra final; se usa en el enlace a `/pase` | `https://socialrun.site` |

**Opción A: desde el panel.** Supabase → proyecto → Edge Functions → **Secrets** → agrega los tres.

**Opción B: por CLI, sin que la key quede en el historial de la terminal.** Crea un archivo temporal fuera del repo:

```bash
cat > ~/neoteam-email.env <<'EOF'
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=NeoTeam Social Run <pase@socialrun.site>
SITE_URL=https://socialrun.site
EOF
supabase secrets set --env-file ~/neoteam-email.env --project-ref ohatsnkgaeccltqwhkbv
rm ~/neoteam-email.env
```

Comprueba que existen (muestra nombres y huellas, nunca los valores):

```bash
supabase secrets list --project-ref ohatsnkgaeccltqwhkbv
```

Los secretos se aplican sin volver a desplegar, pero las funciones sí necesitan el código nuevo.

## 5. Migración del pase por correo (0.10.0)

Corre la migración `supabase/migrations/20261007010000_pass_email.sql` en el SQL editor:
1. primero dentro de `begin; … rollback;` para probarla;
2. después de verdad.

Crea la tabla `pass_email_codes` y agrega la columna `registrations.pass_emailed_at`.

## 6. Desplegar las funciones (0.10.0)

Primero la migración y después las funciones. En el orden inverso, recuperar el pase falla hasta que exista la tabla.

```bash
supabase functions deploy registration-pass admin-pin --project-ref ohatsnkgaeccltqwhkbv
```

Después mergea el PR para que Vercel despliegue la web. Mientras la web vieja conviva con la función nueva, el pase no se muestra al terminar la inscripción (se recupera en `/pase`), así que conviene hacerlo seguido.

## 7. Prueba final (0.10.0)

En un celular:
1. Inscríbete con tu propio correo:
   - llega el correo "Tu pase para el NeoTeam Social Run";
   - el QR se ve en Gmail;
   - se puede escanear en el Check-in del admin.
2. En `/pase`, escribe documento y correo:
   - llega el código de 6 dígitos;
   - el teclado lo ofrece desde el correo;
   - se abre el pase.
3. En el admin, en Participantes → **Reenviar pase**, el correo vuelve a llegar.
4. En Resend → **Logs**, cada envío aparece como `delivered`. Si alguno cayó en spam, revisa que exista DMARC y que el dominio esté Verified.

## Límites y errores

- **100 correos al día en el plan gratuito.** Cada inscripción gasta uno, cada código de `/pase` otro y cada entrada al panel otro. Si se esperan más de unas 80 inscripciones en un día, pasa a Resend Pro antes de ese día.
- **Si se pasa el límite:** Resend responde 429. La función registra `email 429`, y quien lo pidió ve "No pudimos enviar el correo, intenta más tarde". La inscripción se completa igual y el pase se sigue viendo en pantalla.
- **Logs:** el log de la función solo muestra `email <status>`; la respuesta de Resend nunca llega al navegador.
- **Si la key se filtra:** revócala en Resend → API Keys, crea una nueva y repite el paso 4.

## Despliegue del panel (0.9.0)

Haz primero los pasos 1 a 4. Después, en este orden:

1. **Migración:** `supabase/migrations/20261006150000_admin_users.sql` en el SQL editor. Si ya habías corrido su primera versión (con usuario y PIN), corre en su lugar `20261007003000_admin_users_email.sql`, que la convierte al formato con correo.
   - **Pruébala primero:** `begin;`, luego el contenido del archivo, luego el insert del primer admin (paso 2) y `select name, email, role from public.admin_users;`, y al final `rollback;`.
   - **Luego córrela de verdad.** Cierra las sesiones abiertas del panel actual.
2. **Primer admin**, en el SQL editor, con el correo en minúsculas:

   ```sql
   insert into public.admin_users (name, email, role)
   values ('Nombre', 'nombre@example.com', 'admin');
   ```

3. **Funciones:**

   ```bash
   supabase functions deploy admin-pin admin-logos --project-ref ohatsnkgaeccltqwhkbv
   ```

4. **Mergea el PR justo después,** para que Vercel despliegue el panel nuevo. Mientras uno de los dos lados no esté actualizado, nadie puede entrar.
5. **Prueba en un celular:**
   - `/admin` → tu correo → llega el código → entras;
   - recargas y sigues dentro;
   - después agregas al equipo en **Equipo**.
6. **Limpieza:** el secreto `ADMIN_SETUP_SECRET` ya no se usa; puedes borrarlo de Supabase.

Si un código no llega, revisa Resend → Logs y, en Supabase, los logs de la función `admin-pin`. Ambos muestran solo `email <status>`.

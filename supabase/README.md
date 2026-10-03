# Supabase · NeoTeam Social Run

El proyecto remoto `ohatsnkgaeccltqwhkbv` ya está provisionado y es la fuente de verdad actual.

No ejecutes un esquema inicial encima del proyecto remoto.

La función pública `register_social_run_participant` es intencional: permite registrar asistentes sin exponer lectura o edición directa sobre `public.registrations`.

Cuando el repositorio definitivo esté creado, el siguiente paso de mantenimiento es vincular Supabase CLI y ejecutar un `db pull` para versionar el esquema completo.

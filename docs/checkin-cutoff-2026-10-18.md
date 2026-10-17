# Cierre del check-in · SR26

- **Corte:** domingo 18 de octubre de 2026, 08:00:00 en Colombia (UTC−5), es decir, `2026-10-18T13:00:00Z`. A las 07:59:59.999 todavía se permite; a las 08:00:00 ya no.
- **Control doble:** el Edge Function `admin-pin` rechaza check-in QR/código y cambios de estado ordinarios; la migración agrega un trigger sobre `registrations` que hace cumplir el corte **en base de datos**, también ante solicitudes retrasadas o directas.
- **Conservación:** el trigger solo bloquea transiciones desde otros estados a `checked_in`. No elimina pases, asistencias previas ni elegibilidad de participantes ya validados. Corredores de otros eventos no se ven afectados.
- **Excepciones:** exclusivamente un usuario `admin` autenticado, desde Participantes, con motivo obligatorio de 10–400 caracteres. La función `sr26_admin_checkin_exception` realiza actualización y auditoría en una transacción. El rol `checkin` y las solicitudes anónimas no pueden ejecutarla. La tabla `checkin_exceptions` mantiene responsable, participante, hora y motivo, con RLS y sin lectura pública.
- **`events.checkin_open`:** es un campo heredado y actualmente `false`; no constituye un cierre automático ni se usa en la regla nueva. La fuente del plazo es `events.checkin_deadline`.

## Orden de despliegue obligatorio

1. Ejecutar la migración `20261017190000_sr26_checkin_cutoff.sql` en el Supabase del evento SR26. Verificar `select code, checkin_deadline from public.events where code='SR26'`.
2. Desplegar **la Edge Function `admin-pin` del mismo commit**, con la dependencia `_shared/checkin-window.ts`. No publicar únicamente Next/Vercel: el cierre efectivo se decide en Supabase.
3. Desplegar la web a producción y comprobar que la aplicación y la función apuntan al mismo Supabase. Un equipo hace prueba de QR, código manual y cambio de estado, sin alterar datos reales.
4. Tras cierre, comprobar con una transacción `BEGIN; … ROLLBACK;` la barrera de la BD, el mensaje 409 y una excepción auditada sobre datos de prueba. No dejar registros de prueba en producción.

## QA para aprobar merge

- [ ] Unit test del borde temporal y SQL de trigger/excepción.
- [ ] Lint + TypeScript + pruebas + build en GitHub Actions.
- [ ] Prueba de operador `checkin` (solo escáner), administrador (excepción), QR y código manual.
- [ ] Verificar que el check-in previo sigue contado para rifas y dinámicas.
- [ ] Verificar que la tabla de auditoría no se expone a clientes.
- [ ] No desplegar hasta que migración y Edge estén coordinados.

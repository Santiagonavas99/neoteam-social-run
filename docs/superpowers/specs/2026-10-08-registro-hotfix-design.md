# Hotfix — registro: validaciones por paso y elección de crew

Fecha: 2026-10-08

## Problema

El registro permite letras para CC/CE/TI/PPT, dominios de correo incompletos y fechas de nacimiento imposibles/antiguas/futuras. Los errores generales aparecen al final del wizard y la elección de comunidad obliga a interpretar un desplegable antes de decidir si se va solo.

## Decisiones

- Validar en cliente al salir de cada campo y durante la corrección de errores ya marcados, sin mostrar advertencias en campos intactos. Al pulsar Continuar, validar todos los campos del paso, mostrar el resumen en ese paso y bloquear el avance con errores. El servidor repite la validación antes del RPC.
- Documentos CC/CE/TI/PPT: entre 5 y 30 dígitos. Pasaporte y Otro: identificadores alfanuméricos de 5 a 30 caracteres, para no excluir documentos válidos.
- Correo: sintaxis válida más dominio público con al menos un punto y extensión de dominio delegada por IANA (snapshot de las 1.437 extensiones de octubre de 2026). Rechazar .commmm y conservar extensiones reales largas. No se garantiza existencia de buzón o del dominio específico sin verificación por correo.
- Quitar el placeholder redundante «Solo números» del documento; el tipo de documento sigue controlando las restricciones.
- Fecha: fecha calendario real, entre 1900-01-01 y el día presente de Colombia (no edad mínima sin una política de participación aprobada).
- Comunidad: primero «Voy por mi cuenta» o «Voy con un running crew». El primer camino guarda independiente; el segundo muestra el listado actual y el campo para otro crew. No preseleccionar equipo.
- WhatsApp y teléfono de emergencia: filtrar caracteres no numéricos al escribir y pegar. Conservar la normalización de autocompletado colombiano +57; rechazar letras en el servidor.
- Conservar valores después de errores del servidor; no modificar Supabase ni el contrato del RPC.

## Móvil y accesibilidad

A 390 px, decisiones en una columna, botones táctiles de 44 px o más, controles con etiquetas y errores anunciados. El selector del grupo solo aparece cuando se necesita. Sin nuevas dependencias.

## Seguridad y alcance

Zod valida definitivamente en el servidor. El HTML del cliente no se considera autoridad. No modificar flujo de pase, administración, base de datos o envío de correos.

# Participantes: impresión segura y fecha límite de inscripción

Fecha: 2026-10-08

## Peticiones

1. Al imprimir los inscritos, mostrar **solo nombre y running crew**; excluir cédula, correo y otros datos personales.
2. Agregar fecha límite de registro. **Confirmado: sábado 10 de octubre de 2026 a las 8:00 p. m., hora de Colombia (2026-10-11T01:00:00Z).**

## Impresión

La descarga «Descargar lista» existente en el panel es un respaldo administrativo CSV que contiene documento, código, talla, estado y llegada. No debe confundirse con un documento público listo para imprimir.

- Añadir «Imprimir inscritos» como acción claramente diferenciada.
- Obtener todas las inscripciones, no solo la página actual.
- Ordenar alfabéticamente por apellido y después por nombre.
- Excluir cancelados; mantener inscritos, check-in y ausentes.
- Solo dos columnas: **Nombre** y **Running crew**; para quien corre solo, «Independiente».
- Escapar todo texto generado desde los usuarios para evitar ejecución de HTML.
- No transmitir correos, números de documento ni otros campos al contenido imprimible.
- Conservar el respaldo CSV actual bajo el botón «Exportar respaldo», con advertencia explícita de que contiene datos personales.
- Impresión A4 y encabezados repetidos por página.

## Fecha límite: 2026-10-10 20:00 Colombia

El usuario confirmó el corte para el sábado 10 de octubre de 2026 a las 20:00 (America/Bogota), equivalente a 2026-10-11 01:00 UTC. Proteger UI (mensaje antes del cierre, estado cerrado después, incluso con la pestaña abierta), servidor (server action) y base de datos (trigger BEFORE INSERT en registrations para el evento SR26), para impedir eludir el bloqueo desde un cliente manipulado. Evitar restringir recuperaciones de pases y actualizaciones de registros existentes.

Los pases de quienes ya están inscritos deben seguir siendo recuperables después del cierre; un cierre no debe borrar registros ni bloquear accesos administrativos.

## Estado

La impresión puede implementarse y probarse de inmediato. La fecha límite está confirmada. La migración de base de datos debe aplicarse al proyecto NeoTeam antes de marcar finalizado el despliegue.

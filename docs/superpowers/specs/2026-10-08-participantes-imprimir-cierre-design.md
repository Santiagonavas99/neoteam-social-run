# Participantes: impresión segura y fecha límite de inscripción

Fecha: 2026-10-08

## Peticiones

1. Al imprimir los inscritos, mostrar **solo nombre y running crew**; excluir cédula, correo y otros datos personales.
2. Agregar fecha límite de registro. **Faltan la fecha y la hora exactas, con zona horaria de Colombia.**

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

## Fecha límite (pendiente de definir)

No introducir un día u hora supuestos, incluso con el evento programado para el 18 de octubre. Tras recibir el corte exacto, proteger ambos niveles: UI (visibilidad del cierre y mensajes) y escritura de registros en backend, idealmente también con la validación en el RPC de Supabase para evitar eludir restricciones desde un cliente manipulado.

Los pases de quienes ya están inscritos deben seguir siendo recuperables después del cierre; un cierre no debe borrar registros ni bloquear accesos administrativos.

## Estado

La impresión puede implementarse y probarse de inmediato. La fecha límite no debe activarse hasta confirmar fecha/hora.

# Dinámicas V2 — gestión simple + pantalla pública

Fecha: 2026-10-09. Aprobación: el usuario solicitó explícitamente PR para la V2 con control y pantalla de juego independiente.

## Problema observado
El módulo antiguo mezcla tipos, formulario de creación, cambios de estado, operaciones de QR y sorteos. El modelo backend ya soporta cinco tipos en el editor y en producción existen múltiples sorteos, incluidos borradores y resultados previos. No hay que reescribir el motor de selección aleatoria.

## Alcance V2
- Listado agrupado: Sorteos; Stands y retos; Premios instantáneos.
- Crear con asistente: tipo, datos/premio, condiciones. Guardar como borrador; opciones avanzadas en Configuración.
- Cada dinámica tiene Resumen, Configuración, Control, Pantalla pública, Resultados.
- `/juego/[id]` muestra una pantalla a pantalla completa en un monitor sin login y sin datos privados.
- Sorteo: el panel de administración puede iniciar cuenta atrás, ejecutar el sorteo existente, revelar ganadores uno a uno y finalizar la presentación.
- El sorteo sigue siendo irreversible a nivel de ganadores: el backend usa `draw_dynamic` atómico. "Volver a espera" solo oculta la presentación, nunca elimina resultados.
- Ensayo mediante `?ensayo=1`, con datos completamente ficticios y botones de simulación. No se modifica la base de datos.
- Para retos/stands/premios, primera plantilla de pantalla pública: contador anónimo de participaciones. Iteraciones posteriores: experiencias específicas.
- Pantalla pública lee proyección muy limitada mediante función `public_dynamic_game(uuid)`. Los nombres solo salen si el organizador ha avanzado una revelación; nunca se exponen email, cédula, códigos o identificadores privados.
- Los comandos de estado son atómicos y restringidos al rol de servicio Supabase, accesible solo tras autenticación administrativa en la Edge Function. No se otorgan permisos anónimos de escritura.

## Sincronización
- Pantallas públicas consultan el estado cada 2 segundos, no promesa de eventos instantáneos. El panel consulta estado cada 2 segundos mientras está abierto.
- Estaciones múltiples: bloqueo de fila en RPC para avanzar ganadores sin saltos ni dobles revelaciones.
- La consola de resultados permanece privada y permite reemplazar ganadores mediante el RPC existente.

## Despliegue
No aplicar migración a producción mientras no se apruebe el PR. Orden posterior: migración SQL; Edge `admin-pin`; merge; deploy Vercel y smoke tests en móvil/desktop.

## QA
1. Ensayo de ganador sin ninguna escritura.
2. Sorteo real desde borrador hasta finalización con confirmación; nombres no visibles hasta que se revele cada uno.
3. Un ganador ausente y su sustitución; los demás permanecen.
4. Check-in, gestión de inscritos, pasarela de email y resultados históricos sin cambios.
5. Página pública no muestra nombre/código/documento/email antes del reveal.
6. Pruebas SQL de permisos, estado y transición; CI web.

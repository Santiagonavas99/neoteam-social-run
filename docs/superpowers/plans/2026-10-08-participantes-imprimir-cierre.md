# Plan en curso — impresión y plazo de inscripción

- Rama: fix/registro-lista-impresion-cierre-20261008
- 1. Impresión segura de nombres + running crews, separada de exportación privada.
- 2. Pruebas para privacidad, cancelados, normalización de crews y HTML escapado.
- 3. Verificar CI y abrir PR sin fusionar a producción.
- 4. Cierre confirmado: 2026-10-10 20:00:00 -05:00, hora de Colombia.
- 5. Implementar aviso previo y pantalla cerrada con actualización sin recarga, barrera server action, trigger SQL de bloqueo de inserts en SR26 y pruebas de instantes alrededor del corte.
- 6. Usuario autorizó desplegar a producción. Confirmar QA, fusionar y aplicar migración al proyecto Supabase NeoTeam, comprobar READY en Vercel.

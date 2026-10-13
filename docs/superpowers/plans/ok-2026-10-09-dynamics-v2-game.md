# Plan aprobado — Dinámicas V2

1. Crear rama feat/dynamics-v2-game-screens-20261009 desde main.
2. Rediseñar listado y detalle con asistentes por tipo; reutilizar las reglas backend.
3. Implementar pantalla pública `/juego/[id]` con lectura sanitizada de solo-lectura y simulador de ensayo.
4. Separar controles privados mediante API `dynamicData` y máquina de estado SQL.
5. SQL tests y tests unitarios; revisar CI, Vercel preview y permiso de no-escritura de espectadores.
6. Abrir PR y dejar sin desplegar hasta autorización expresa.

V1 incluye control interactivo para sorteo y pantalla con contador para otros tipos. Las animaciones y juegos especializados de checkpoints, retos e instant wins quedan para siguiente iteración; no se afirma completitud de esos juegos.

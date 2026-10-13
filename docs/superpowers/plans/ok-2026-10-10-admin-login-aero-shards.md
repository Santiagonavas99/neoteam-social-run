# Plan aprobado · AeroShards en login administrativo

Especificación: [2026-10-10-admin-login-aero-shards-design.md](../specs/2026-10-10-admin-login-aero-shards-design.md)

Rama: `feat/admin-login-aero-shards-20261010`. Autorización: solicitud expresa de crear PR tras revisión del diseño de la pantalla real el 10 de octubre de 2026.

1. **Componente y dependencia.** Añadir `features/admin/auth/vendor/AeroShards.jsx`, `AeroShards.css`, `AeroShards.d.ts`, `vgpu` en `package.json` y `pnpm-lock.yaml`, y excluir el vendorizado del formateador en `biome.json`.
   - Comprobar que la importación existe y la instalación con lockfile congelado termina sin discrepancias.
2. **Integración solo en login.** Crear `features/admin/auth/login-background.tsx` y adaptar `features/admin/auth/auth-screen.tsx` para leer tokens oscuros, mostrar el fondo tras la interfaz y desmontarlo al entrar.
   - Móvil 390 px y desktop 1440 px: formulario legible, entrada de correo y código, reintentos, `Volver al evento`.
   - Navegadores sin WebGPU, GPU que arroja error y movimiento reducido: ingreso operable, fondo estático.
3. **Release.** Actualizar `CHANGELOG.md` y `package.json` a 0.34.0.
4. **Validación y revisión.** `pnpm ci:check` en CI GitHub; revisión visual y de OTP en la preview de Vercel. No fusionar ni desplegar producción sin aprobación.

No hay migraciones SQL ni cambios de variables secretas.

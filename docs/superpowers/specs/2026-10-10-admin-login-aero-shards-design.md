# Diseño · AeroShards en el ingreso a /admin

Fecha: 2026-10-10

## Problema
La pantalla de ingreso al panel de NeoTeam ya tiene un formulario OTP accesible y una composición limpia; se busca dar carácter al fondo sin introducir efectos en el panel interno ni distraer a quien inicia sesión.

## Decisión
Integrar AeroShards (React Bits, variante JS + CSS) como un fondo ambiental discreto, de aspecto oscuro y acentos cian, detrás exclusivamente de `AuthScreen`. La tarjeta OTP y el logotipo quedan en primer plano. Se usan los colores del tema oscuro de `DESIGN.md`, leídos como variables CSS para alimentar los parámetros hex que requiere el shader.

El componente se carga en cliente solo si existe WebGPU y el usuario no tiene activada la reducción de movimiento. Si el GPU falla, se desmonta y permanece el color base sin interrumpir el formulario. Sin eventos de cursor ni retención de clics.

## Móvil 390 px
- El fondo ocupa el viewport; el contenido mantiene su ancho y espaciamiento existentes y los controles >= 44 px.
- Densidad y velocidad reducidas. El motor dispone de selección interna de calidad por dispositivo.
- `prefers-reduced-motion` y navegadores sin `navigator.gpu` muestran un fondo estático desde el primer render.

## Accesibilidad y rendimiento
- Lienzo meramente decorativo, `aria-hidden` y `pointer-events: none`.
- Carga dinámica `ssr: false`, sin incluir WebGPU en pantallas autenticadas.
- No cambia el texto, el orden de tabulación, la verificación por correo, la cookie de sesión o la autorización.
- Dependencia `vgpu@0.3.1`, compatible con el componente de referencia suministrado; lockfile actualizado para instalación congelada. El JS vendorizado se excluye de formato Biome y conserva el crédito de origen.

## Alternativas descartadas
- Poner la animación en todo `/admin`: se descarta porque distrae durante check-in y gestión.
- Montarla sin comprobar WebGPU: provoca errores en navegadores no compatibles.
- Interactividad de partículas al clic: no aporta valor al acceso y puede distraer.
- Reemplazar el OTP o rediseñar el panel: fuera de alcance.

## Fuera de alcance
No se modifican Supabase, endpoints, autorización, sesiones, vistas internas ni la web pública.

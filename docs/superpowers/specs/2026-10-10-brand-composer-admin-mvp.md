# Compositor de marcas aliadas — MVP

## Objetivo
Añadir un editor gráfico dentro del panel de administración de NeoTeam para combinar una imagen base con logos de marcas ya publicadas, y descargar el resultado en PNG o JPG para redes sociales.

## Arquitectura
- Entrada: `adminData({resource:'brands',operation:'list'})` y `callLogos('list')` detrás de la sesión administrativa existente.
- Biblioteca: marcas activas visibles y logos del carrusel activos en la cinta de organizaciones; deduplicación por nombre normalizado (sin guardar copias).
- Las imágenes base y las sustituciones puntuales se cargan en memoria mediante `URL.createObjectURL` y no se suben ni se guardan en Supabase.
- Motor `composer-layout.ts`: dimensiones, áreas y distribución sin dependencias de React; pruebas sobre 17 marcas para todos los formatos y layouts.
- Motor `composer-renderer.ts`: mismo canvas de exportación para preview/descarga; carga de imágenes validada, `cover` del fondo, `contain` de logos sin deformarlos y tarjetas blancas opcionales.
- Los logos de Storage público de NeoTeam se obtienen mediante el optimizador de Next (URL mismo origen) para evitar errores de CORS; otros orígenes usan CORS. Si un logo externo no autoriza CORS, el usuario debe reemplazarlo localmente; no se exporta una pieza incompleta.
- Interfaz: 01 Fondo/formato, 02 Selección de marcas, 03 Composición, previsualización y exportación.
- Dimensiones soportadas: 1080x1080, 1080x1350, 1080x1440, 1080x1920 y 1920x1080.
- Orden manual simple, selección múltiple y búsqueda. Formatos PNG/JPG; JPG con calidad 0.94.
- Se renderiza sobre fondo opaco, de forma que JPG y PNG se comportan de manera consistente.

## Límites del MVP
No hay persistencia de plantillas ni un editor drag-and-drop. Las piezas se construyen y descargan en la sesión actual. No altera la landing, Supabase, la sincronización de logos, ni las imágenes del sitio.

## QA
1. Abrir Administración > Compositor de marcas y comprobar que check-in no tiene acceso.
2. Seleccionar 1, 6, 17 logos y cambiar entre los cinco formatos y tres layouts.
3. Subir JPG, PNG o WEBP como fondo; probar quitarlo y volver al preset.
4. Exportar PNG y JPG; verificar resoluciones reales y ausencia de logos deformados.
5. Simular un logo remoto bloqueado por CORS y reemplazarlo temporalmente.
6. Verificar que editar la composición no afecta Marcas ni Carrusel logos en producción.
7. Comprobar Safari/iOS y desktop en preview.

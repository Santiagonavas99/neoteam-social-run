# Cierre legal pendiente · Social Run NeoTeam (18/10/2026)

Borradores públicos: `/legal/terminos` y `/legal/privacidad`.

**Estado: borrador. No publicar en producción sin revisión y aprobación legal.**

## Confirmaciones indispensables

- [x] Identificar a las tres personas integrantes del **liderazgo de NeoTeam**: Camilo Benítez Soto, Nana Giraldo y Robinson Martinez. Se muestran sus nombres, no sus documentos, teléfonos ni correos personales.
- [ ] Designar el **responsable del tratamiento**: persona(s) natural(es) o entidad jurídica y, si aplica, responsables conjuntos. Ser líder de NeoTeam no determina automáticamente la representación legal ni la responsabilidad sobre el tratamiento de datos. No inferir que sean responsables solidarios, apoderados o representantes legales.
- [ ] Recopilar razón social / identificación jurídica cuando aplique, domicilio, dirección física, teléfono de contacto y **correo operativo para hábeas data**. No incorporar cédulas o teléfonos privados a un repositorio público sin justificación y autorización.
- [ ] Aprobar y fechar política de tratamiento con finalidades, conservación, derechos y procedimiento de consultas/reclamos.
- [ ] Definir participación de **menores de edad**. El formulario actual acepta TI y fechas de nacimiento de menores, pero no tiene autorización verificable de acudiente. No asumir que aceptar un checkbox por parte del menor resuelve el requisito.
- [ ] Establecer autorización **independiente** para tratamiento y publicación de imagen identificable con fines promocionales (y consentimiento del representante cuando corresponda).
- [ ] Auditar conservación de prueba de consentimiento: fecha/hora, versión del texto, identidad/referencia de registro, y elección de marketing. Hoy el backend transmite `p_terms_accepted`, `p_privacy_accepted` y `p_marketing_accepted`, pero esta rama no introduce cambios de base de datos.
- [ ] Verificar qué proveedores están activos y las condiciones de acceso/transmisión de datos (Supabase, alojamiento, correo y cualquier servicio de analytics).
- [ ] Confirmar que los datos del contacto de emergencia tienen tratamiento limitado a emergencias.
- [ ] Confirmar cobertura operativa de seguridad, protocolo de primeros auxilios, permisos, ruta y eventual póliza con el equipo organizador; no afirmar coberturas que no estén contratadas.
- [ ] Revisar texto con profesional jurídico colombiano antes de publicar la versión definitiva.

## Criterios de implementación

- Términos de participación y autorización de datos son consentimientos distintos.
- Casilla de futuras novedades sigue siendo opcional.
- La aceptación de riesgos ordinarios no supone exoneración universal de responsabilidad.
- Nunca colocar números de documento de organizadores, participantes ni teléfonos privados en código, historial Git o páginas públicas por inercia.
- No hacer merge de este PR hasta resolver los puntos esenciales anteriores.

### Marco de referencia orientativo

- Ley 1581 de 2012 y Decreto 1074 de 2015 (Colombia)
- https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/politicas-de-tratamiento-de-datos-personales
- https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/tratamiento-excepcional-y-autorizacion-del-representante-legal-con-interes-superior
- https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/tratamiento-de-fotografias-con-fines-publicitarios-se-viola-cuando-no-se-obtiene-la-autorizacion-previa

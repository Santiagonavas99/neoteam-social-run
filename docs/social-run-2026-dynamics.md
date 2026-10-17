# Social Run 2026: dinámicas de patrocinadores

Evento SR26, 18/10/2026. Los 15 registros ya existen como borradores con sus logos. No se activaron ni se ejecutaron sorteos.

| Marca | Premio | Mecánica |
| --- | --- | --- |
| MUSASG | 2 hidratantes | Isométricas |
| KUULMAX | 5 pares de medias | Planchas |
| MMTULUA | 1 inscripción + 20 % | Ruleta |
| Juancho Correlón | 1 inscripción 10K de la Luz | Ruleta |
| HIGHFORCE | 2 prendas | Ruleta |
| Ser Inspiración | 1 inscripción + 30 % | Por definir |
| Río Cali | Descuentos | Por definir |
| Corre y Libérate | Descuento | Por definir |
| Fatto con Amore | 2 cajas de chocolate | Por definir |
| Trike Fit | Camisa personalizada | Por definir |
| SM Shop | Bono | Trivia 10K de la Luz |
| Geraldine Giraldo | Lifting y laminado de cejas | Por definir |
| Toxic Training | 5 cortesías | Relevos |
| SA Importaciones | Zapatillas | Trivia Kipchoge |
| Dental | Blanqueamiento, 3 sesiones | Por definir |

Pendiente: confirmar reglas, preguntas y respuestas, límites de ganadores y descuentos. El PR #94 añade cronómetros, clasificación individual, ruletas con cupos y trivias con un intento por QR; **estas funciones no están publicadas en el backend productivo** hasta aplicar la migración y desplegar la Edge Function. No activar dinámicas incompletas.

## Reglas operativas que requieren validación antes de activar

- **MUSASG — isométricas:** registrar duración en milisegundos por participante, ordenar de mayor a menor; los dos hidratantes corresponden provisionalmente a los dos mejores tiempos, sujeto a confirmación del organizador.
- **KUULMAX — planchas:** misma clasificación descendente; cinco pares de medias, provisionalmente para los cinco mejores tiempos.
- **Toxic Training — relevos:** registrar equipo, integrantes y tiempo total; gana el menor tiempo válido. Confirmar cómo distribuir cinco cortesías entre equipos.
- **MMTULUA, Juancho Correlón y HIGHFORCE — ruleta:** inventario finito por premio, sorteo seguro en servidor, bloqueo de premios agotados, registro auditable y prevención de duplicados. La animación no decide el resultado.
- **SM Shop y SA Importaciones — trivia:** respuesta correcta validada por el organizador, una respuesta por participante y desempate definido. No almacenar una respuesta supuesta como verdadera.
- **Resto:** confirmar modalidad, unidades disponibles y condiciones de descuentos antes de activar.

### Criterios de aceptación

1. Cronómetro de inicio, pausa, reanudación y cierre con tiempos persistidos en servidor; controles de corrección auditados.
2. Ranking individual ascendente/descendente según modalidad y ranking de relevos por equipo, con desempates definidos.
3. Inventario y premios asignados en transacción para evitar sobreentregas con dos operadores simultáneos.
4. Aleatoriedad de sorteos/ruletas determinada por backend, con pruebas de elegibilidad, repetición, agotamiento y concurrencia.
5. Trivias con respuestas verificadas, control de intentos y resultados consultables.
6. Todas las operaciones desde una sola pestaña Mobile, sin romper QR, OTP, permisos, escritorio o resultados históricos.

**Estado al 17/10/2026:** se implementaron y probaron automatizadamente los RPC de cronómetros, ranking individual, ruletas y trivias. Los relevos generan una clasificación por equipo; la entrega de cinco cortesías no se automatiza sin que el organizador confirme el reparto. La ruleta incluye sectores proporcionales a la probabilidad configurada, puntero ganador y animación dirigida por el premio adjudicado en el backend. En borrador se muestra la configuración sin consultar APIs aún no publicadas; se permite un ensayo visual sin registrar premios. Cuando no existe inventario revisado, el gráfico se muestra como pendiente y no inventa premios. No se hicieron pruebas en teléfonos físicos ni de dos operadores compitiendo simultáneamente. Las 15 dinámicas se mantienen en borrador.

## Validación y plan seguro de publicación

- **CI:** `pnpm ci:check` aprobado (lint, typecheck, tests y build). `pnpm test:db` aprobado en GitHub Actions; incluye controles de permisos y límites de premios. La última revisión automatizada corresponde al commit que cierre este PR.
- **SQL real sin efectos:** el conjunto de funciones y pruebas se ejecutó contra el esquema de SR26 en una transacción `BEGIN … ROLLBACK`; no quedaron registros de ensayo ni se activó ninguna dinámica.
- **Reglas en servidor:** el cronómetro y la corrección se almacenan en PostgreSQL, el inventario de ruleta se asigna bajo bloqueo transaccional, la trivia registra un solo intento y los rankings individuales solo se cierran sin empates en el corte de premios.
- **Pendiente para operación real:** comprobación de cámara y navegación en iOS/Android, ensayo con dos operadores conectados a la vez, carga de respuestas correctas de ambas trivias y definición del descuento MMTULUA, premios equivalentes, desempates reales y distribución de relevos.

### Orden de lanzamiento, sujeto a aprobación explícita

1. Hacer respaldo y aplicar **solo** la migración `supabase/migrations/20261017143500_event_mechanics.sql` en el proyecto `ohatsnkgaeccltqwhkbv`. Es aditiva y únicamente anota borradores identificados.
2. Desplegar únicamente la función `admin-pin` del mismo commit a Supabase; no modificar OTP ni otras funciones.
3. Fusionar el PR #94 tras comprobar en Vercel que la preview coincide con el commit revisado.
4. Verificar un caso controlado de cada modalidad con registro de prueba autorizado y limpiar el ensayo, sin ejecutar los sorteos reales. Realizar revisión final de todas las dinámicas antes de activar.

**No ejecutar los pasos de publicación por adelantado.** La preview web sola no puede operar las mecánicas nuevas mientras el backend productivo no tenga la migración y la Edge Function.

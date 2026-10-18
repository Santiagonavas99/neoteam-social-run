# Social Run · Operación de Dinámicas (18 de octubre de 2026)

## Decisión de producto — PR #98

En Mobile: **una lista, una actividad, una pantalla, una acción principal**.
No hay pestañas internas ni pantalla pública separada. El administrador sortea y ve
los ganadores en su mismo celular. OTP, QR, datos históricos, escritorio y roles
permanecen en sus flujos actuales.

**Ruleta visual ≠ giro de un QR para adjudicar premios:** HIGHFORCE, Juancho
Correlón y MMTULUA son sorteos aleatorios entre corredores elegibles. La ruleta
es únicamente una forma de *mostrar* a los ganadores del mismo sorteo transaccional
`draw_dynamic`. El motor separado `dynamic_wheel_spin` permanece disponible
solo para otros eventos que expresamente requieran **una oportunidad por cada QR**.

### Hallazgo real: HIGHFORCE sin elegibles

Consulta de SR26 al preparar esta revisión: 218 inscritos, 1 persona con check-in,
y esa persona ya premiada en otra dinámica. HIGHFORCE exige check-in **y** excluye
ganadores anteriores; por ello `dynamic_eligible_count` retorna cero.
No es un error de aleatoriedad. No se permite sortear con cero elegibles.
El PR agrega una explicación visible y **ensayo de presentación con participantes
ficticios, sin insertar resultados ni alterar el historial**. Las reglas actuales
de HIGHFORCE solo se pueden cambiar deliberadamente en Editar; **no se cambian
automáticamente para forzar resultados de prueba**.

## Estado verificado de las 15 dinámicas

| Aliado | Mecánica correcta | Estado actual antes del PR | Qué queda por confirmar |
| --- | --- | --- | --- |
| HIGHFORCE | Sorteo aleatorio con presentación de ruleta, 2 prendas | Activa; 0 elegibles con reglas actuales | Prendas y criterios de elegibilidad |
| Juancho Correlón | Sorteo aleatorio con presentación de ruleta, 1 inscripción | Finalizada; participación histórica conservada | No repetir ni alterar ganador histórico |
| MMTULUA | Sorteo aleatorio con presentación de ruleta | Borrador | Si inscripción y 20 % son un solo paquete o dos premios |
| MUSASG | Isométricos por mayor tiempo | Borrador | Reglas físicas y adjudicación de 2 hidratantes |
| KUULMAX | Planchas por mayor tiempo | Borrador | Reglas y adjudicación de 5 pares de medias |
| TOXIC TRAINING | Relevos por equipos, menor tiempo | Activa, **pendiente de revisión** | Distribución de 5 cortesías y reglas de equipos |
| SA IMPORTACIONES | Trivia presencial | Borrador | Opciones y respuesta oficial a pregunta sobre Kipchoge |
| SM SHOP | Trivia presencial | Borrador | Respuesta oficial sobre ediciones de 10K de la Luz y valor del bono |
| SER INSPIRACIÓN | Modalidad por definir | Borrador | Condiciones de 1 inscripción y 30 % de descuento |
| RÍO CALI | Modalidad por definir | Borrador | Descuentos y cantidad de beneficiarios |
| CORRE Y LIBÉRATE | Modalidad por definir | Borrador | Descuento, elegibilidad y beneficiarios |
| FATTO CON AMORE | Modalidad por definir | Borrador | Reglas para entregar 2 cajas de chocolate |
| TRIKE FIT | Modalidad por definir | Borrador | Reglas para 1 camisa personalizada |
| GERALDINE GIRALDO | Modalidad por definir | Borrador | Si lifting y laminado son paquete o premios separados |
| DENTAL | Modalidad por definir | Borrador | Reglas para 1 blanqueamiento de 3 sesiones |

No se infieren respuestas oficiales, porcentajes de probabilidad, reglas deportivas
ni premios de las descripciones. Todas las actividades con `pending_review=true`
quedan bloqueadas **también en servidor** hasta aprobación explícita.

## Datos y seguridad

- Migración nueva: `20261018025000_social_run_unify_raffles.sql`, ejecutada en
  prueba con `BEGIN…ROLLBACK`, **sin mutaciones persistentes**.
- La migración transforma **solo** el borrador MMTULUA sin giros ni premios
  históricos de un motor QR a la rifa existente; mantiene `pending_review=true`.
- Prellena únicamente el texto conocido de ambas trivias, no su respuesta correcta.
  Actualiza descripciones obsoletas de los dos retos cronometrados aún en borrador.
- Configura el modo `team_relay` de TOXIC sin cambiar su estado activo ni levantar
  su bloqueo `pending_review`; no asigna automáticamente las cortesías.
- HIGHFORCE y Juancho Correlón **no se modifican en base de datos por la migración**.
  La presentación de ruleta se deriva de sus claves del plan.
- Los sorteos reales conservan los controles de elegibilidad del backend, exclusión
  opcional de ganadores anteriores, check-in, sorteo atómico y repetición segura.
- Los ensayos solo muestran nombres ficticios, no acceden ni escriben premios reales.
- No fusionar ni desplegar el PR sin aprobación. Pendiente prueba manual con teléfonos
  y dos operadores. No realizar sorteos reales en QA.

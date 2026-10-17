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

Pendiente: confirmar reglas, preguntas y respuestas, límites de ganadores y descuentos. El sistema actual no automatiza ruletas, tiempos ni clasificación por reto. No activar hasta validar estas condiciones.

## Reglas operativas por implementar antes de activar

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

**Estado:** el selector de modalidad del editor es únicamente configuración; no implica que cronómetro, ranking, ruleta ni trivia estén funcionales. No aprobar despliegue hasta completar y probar las mecánicas.

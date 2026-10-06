# ADR 0001: Pivote a B2B institucional sin procesamiento de pagos

- **Estado:** aceptada
- **Fecha:** 2026-10-04
- **Plan de ejecución:** `specs/pivote-b2b-sin-pagos.md`

## Contexto

Hasta ahora UniWheels funcionaba como un marketplace que cobraba una comisión del 12 % a cada conductor. La comisión se descontaba de una billetera prepago que el conductor recargaba con Wompi.

El análisis de viabilidad (`../negocio/reporte-viabilidad-pesimista.md`) encontró que ese modelo no es viable:

- **Ingresos:** con una tarifa de ~$4.500, la comisión deja ~$540 por cupo, mientras que un pago por Wompi cuesta ~$975. Cada recaudo digital da pérdida, y en el escenario pesimista el ingreso esperado es de ~$150.000 al mes.
- **Riesgo legal:** cobrar comisión y manejar el dinero hace que la plataforma parezca un intermediario de transporte. Eso debilita el argumento de "compartir gastos" frente a la infracción D12 (Ley 769, art. 131), cuya multa recae en el conductor.
- **Mercado:** los referentes (BlaBlaCar en Colombia, TRIBBU, Wheels Uniandes) no cobran comisión al usuario. El único modelo de negocio con evidencia en Colombia es el B2B (Try My Ride, TRIBBU).
- **Costo:** los pagos le suman complejidad a casi todos los servicios (billetera, webhooks, conciliación, liquidación) sin generar valor.

## Decisión

1. **Quién paga:** la institución paga una licencia o suscripción. Para su comunidad, el uso es gratis.
2. **UniWheels no procesa pagos.** No recauda, no custodia saldos y no cobra comisión.
3. **Aporte:** la app sugiere un aporte por cupo de ~43 % de lo que costaría una app de transporte (carro $2.000 + $400/km; moto $1.000 + $250/km; ver `docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md`). El conductor indica su aporte, menor o igual al sugerido, y el pasajero se lo paga **directamente**, por fuera de la app.
4. **El código de pagos se elimina**, no se desactiva: Wompi, billetera, recargas, liquidación, comisión y conciliación. Las tablas se eliminan con migraciones nuevas; las migraciones históricas no se tocan.
5. **Penalizaciones:** las de dinero se reemplazan por suspensión temporal, usando el mecanismo de suspensión que ya existe con Redis.
6. **Varias instituciones:** el modelo se diseña ahora (`docs/DISENO_MULTI_INSTITUCION.md`) y se implementa cuando haya un segundo cliente.

## Consecuencias

**Positivas**
- Sin dinero en la plataforma, el riesgo regulatorio de UniWheels baja: se acerca más a una herramienta de coordinación que a un servicio de transporte.
- Se eliminan la integración con Wompi, sus secretos, los webhooks, la conciliación y una superficie importante de ataque y de errores.
- El ingreso deja de depender del volumen de viajes y de la temporada académica.
- La propuesta para la universidad queda más clara: seguridad, comunidad verificada, panel de Bienestar y reportes.

**Negativas y riesgos**
- No hay ingresos hasta firmar con una institución, que tiene un ciclo de venta de meses.
- No hay trazabilidad del pago entre usuarios: no se puede auditar si el aporte se pagó, y los conflictos los resuelven las partes.
- El tope del aporte se puede incumplir por fuera de la app; la plataforma solo controla el valor que se publica.
- **El aporte sugerido supera el costo de operar el vehículo** (el conductor obtiene margen). Eso debilita el argumento de "compartir gastos" frente a la infracción D12 para **los conductores**. Fue una decisión consciente del usuario para atraer oferta, y **requiere un concepto de un abogado antes del lanzamiento**. La alternativa de solo costo compartido está documentada en las reglas, §1.2.
- Hay que reescribir partes de la tesis, la documentación y los textos legales.

## Alternativas descartadas

| Alternativa | Por qué se descartó |
|---|---|
| Mantener la comisión del 12 % | Ingreso marginal, pérdida en cada pago digital y mayor riesgo legal |
| Desactivar los pagos con un feature flag | Deja deuda, secretos y superficie de ataque, y confunde a quien lea el código. Si se necesitara, se recupera desde git |
| Comisión fija baja o suscripción para conductores | Mantiene el problema legal y crea fricción justo en el lado de la oferta, que es el más escaso |
| Implementar varias instituciones desde ya | Es un costo antes de validar con el primer cliente |

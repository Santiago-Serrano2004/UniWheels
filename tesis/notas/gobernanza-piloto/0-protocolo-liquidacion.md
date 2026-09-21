# Protocolo de Liquidación y Disputas — Borrador (Gate 0, tarea 0.1)

**Estado: BORRADOR para revisión de Santiago + revisión legal antes de publicarse.** Este
documento no es un texto final ni un T&C — es el insumo para tomar las decisiones de Gate 1
(1.1, 2.1) y para que exista una respuesta escrita a cada escenario antes de que ocurra con
dinero real.

Asume, como base de trabajo, la recomendación del plan de cobertura v2: **el pago de la tarifa
del viaje se hace 100% P2P (efectivo/Nequi/Daviplata) fuera de la plataforma; Wompi solo se usa
para que el conductor recargue saldo de comisión (`WR-`)**. Si Santiago decide otra cosa en 1.1,
este documento debe ajustarse antes de aprobarse.

## 1. Recarga fallida o duplicada

- **Recarga fallida** (Wompi responde error o timeout): no se acredita nada; el usuario ve un
  mensaje claro y puede reintentar. No requiere intervención humana.
- **Recarga duplicada** (el usuario paga dos veces por un error de la app o de Wompi, ej. doble
  clic): se acredita solo una vez (esto es lo que la corrección de idempotencia del plan técnico
  debe garantizar); el segundo cobro, si Wompi efectivamente lo procesó, se devuelve por el mismo
  medio de pago. Responsable: Santiago, atendido manualmente mientras el volumen sea bajo.
- **Plazo de resolución**: 5 días hábiles para casos de duplicidad.

## 2. Cancelación de viaje después de recargar

- La recarga de comisión no está atada a un viaje específico (es saldo general de la cuenta), así
  que cancelar un viaje no genera, por sí solo, ningún reembolso — el saldo simplemente queda
  disponible para el siguiente viaje.

## 3. Comisión pendiente de débito (`commission_status = pendiente_debito`)

- Ocurre cuando el viaje se completa pero el débito de comisión falla (ej. por una caída temporal
  entre servicios). El sistema no debe bloquear al conductor por esto de forma indefinida.
- **Regla**: si la comisión pendiente no se resuelve en 7 días, se reintenta automáticamente al
  siguiente crédito de saldo del conductor. Si el conductor nunca vuelve a recargar, la deuda se
  trata como pérdida no cobrable (ver `audit-claude.md` 3.6) — no se persigue legalmente por
  montos de esta magnitud.

## 4. Saldo negativo (crédito operativo hasta -$5.000 COP)

- Ya implementado como límite técnico. Regla de negocio: al llegar a -$5.000 COP, el conductor no
  puede publicar nuevas rutas hasta recargar. No hay penalización adicional ni reporte a centrales
  de riesgo — es solo un bloqueo funcional dentro de la app.

## 5. Devolución de saldo no consumido

- Un conductor que se gradúa, se retira o simplemente deja de usar la app puede solicitar la
  devolución de su saldo de recarga no consumido (fundamento: Ley 1480 de 2011, ver
  `audit-gemini.md` 5.11 — marco general razonable, confirmar con asesoría legal antes de
  publicarlo como política oficial).
- **Proceso mientras el volumen es bajo**: solicitud por correo a Santiago, verificación manual del
  saldo, transferencia bancaria/Nequi directa. Plazo objetivo: 10 días hábiles.
- **Canal de disputa**: el mismo correo/WhatsApp de soporte que ya existe para el proyecto — no
  hace falta un sistema de tickets para este volumen.

## 6. Cierre o suspensión del piloto (liquidación total)

- Si el piloto se suspende (por decisión de Santiago, de la universidad, o por cualquier motivo),
  todo saldo de recarga no consumido se devuelve a cada conductor por el mismo proceso del punto
  5, dentro de un plazo razonable (recomendado: 30 días), y se comunica por correo a todos los
  usuarios con saldo activo. Esto debe existir por escrito ANTES de aceptar la primera recarga
  real de un tercero — es una responsabilidad ética mínima, no un detalle opcional.

## 7. Responsable de cada caso

Mientras el piloto sea pequeño, Santiago es el responsable único de todos los casos anteriores.
Si el volumen crece lo suficiente para justificar más de una persona, este documento debe
actualizarse para definir separación de funciones (ver `audit-claude.md` sobre riesgo de
concentración de poder en una sola persona manejando ajustes financieros).

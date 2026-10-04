# Runbook de continuidad — Gate 5, tarea 7.1

Este documento responde a una pregunta concreta: **si Santiago no puede seguir manteniendo
UniWheels, ¿qué necesita saber otra persona para tomarlo?** No repite `DEPLOY.md` (que ya cubre
cómo desplegar) — apunta a él y agrega lo que falta: dónde están las cosas y quién decide qué.

## 1. Dónde está todo

- **Código**: este repositorio (monorepo `UniWheels/`). Ver `CLAUDE.md` en la raíz para el mapa de
  servicios.
- **Documentación de arquitectura**: `documentos_proyecto/` (fuera de `UniWheels/`, en el
  repositorio padre) — incluye la arquitectura de referencia, el backlog técnico, y el documento
  de especificación completo del proyecto.
- **Tesis**: Google Doc canónico (ver `tesis/README.md`), no este repositorio.
- **Cuentas y credenciales externas** (llenar esta tabla a medida que se creen cuentas reales; hoy
  ninguna está en producción con dinero real):

| Servicio | Para qué | Dónde están las credenciales |
|---|---|---|
| Cloudflare | DNS, proxy, TLS, R2 (backups y documentos) | Cuenta personal de Santiago — pendiente de definir un plan de sucesión de acceso |
| TomTom | Tráfico en tiempo real para el motor de ruteo | `services/ai-route-service/.env` |
| Hosting (VM) | Servidor de producción | Ver estado actual en memoria del proyecto — al momento de escribir este runbook, el despliegue está pausado por restricciones de cuenta en los proveedores de hosting gratuito probados (Oracle, Azure for Students) |

## 2. Cómo levantar el proyecto desde cero

Ver `docker/DEPLOY.md` para el procedimiento completo de despliegue a producción, y el
`CLAUDE.md` raíz de `UniWheels/` para desarrollo local (`./uniwheels help`).

## 3. Qué se pierde si nadie mantiene esto

- Sin backups externos configurados (ver Gate 3 del plan de cobertura de riesgos,
  `tesis/auditoria/2026-09-21-viabilidad-negocio/`), perder la VM de producción pierde también
  todos los datos: usuarios, viajes, documentos vehiculares.
- El dominio y las cuentas de servicios externos están a nombre personal de Santiago — si se
  pierde el acceso a esas cuentas, no hay forma de recuperar el servicio sin recrear todo desde
  cero.

## 4. Decisión pendiente: ¿quién más tiene acceso de respaldo?

Esta es la tarea 7.2 del plan de cobertura de riesgos — una decisión de Santiago, no algo que este
runbook pueda resolver. Opciones a considerar: otro estudiante del semillero de investigación (si
se dona el proyecto como Escenario C de `audit-claude.md` categoría 17), un profesor del programa,
o mantenerlo sin acceso de respaldo mientras el proyecto sea solo una tesis individual (aceptando
el riesgo de "bus factor" documentado como RC-7 en `CONSOLIDADO.md`).

## 5. Enlaces de referencia rápida

- Estado de producción y riesgos: `tesis/auditoria/2026-09-21-viabilidad-negocio/CONSOLIDADO.md`
- Plan de cobertura de riesgos: `tesis/auditoria/2026-09-21-viabilidad-negocio/plan-cobertura-v2-claude.md`
- Despliegue: `docker/DEPLOY.md`
- Convenciones de código: `CLAUDE.md` (raíz de `UniWheels/`)

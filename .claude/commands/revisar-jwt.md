---
description: Verifica que los servicios comparten el mismo contrato de JWT
allowed-tools: Bash(grep:*), Bash(rg:*), Bash(cat:*), Bash(find:*), Bash(git diff:*)
---
Revisa la coherencia del contrato JWT entre los servicios de `services/` (auth, vehicle, route-matching, trip, notification) y `ai-route-service`.

Comprueba y reporta discrepancias en:
1. **Secreto**: nombre de la variable (`JWT_SECRET` u otra) en cada `.env.example` y cómo se lee en config. Todos deben usar el mismo nombre y esperar el mismo valor compartido.
2. **Algoritmo y claims**: `alg` (HS256/RS256), claims esperados (`sub`, `exp`, `iss`, `aud`, roles/permisos). auth-service es el ÚNICO emisor; el resto solo valida.
3. **Librería y versión**: `firebase/php-jwt` en los Laravel, `pyjwt` en ai-route-service. Versiones compatibles.
4. **Middleware**: que todos los servicios consumidores apliquen el mismo middleware de validación en sus rutas protegidas.
5. **Manejo de expiración y errores**: respuesta 401 con la forma estándar `{ success:false, message }`.

Salida: tabla servicio × aspecto, marcando OK / discrepancia. Para cada discrepancia: archivo, qué difiere, y el valor correcto (el de auth-service manda). No cambies nada; solo reporta.

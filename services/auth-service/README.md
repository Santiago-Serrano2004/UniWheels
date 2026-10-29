# Microservicio de Autenticación y Usuarios (auth-service)

Microservicio en Laravel 13 responsable de la gestión de identidad, control de acceso basado en roles (RBAC) y suspensión de cuentas.

---

## 1. Responsabilidades
* Autenticación segura con tokens Bearer (Laravel Sanctum).
* Validación estricta de pertenencia a la Universidad Autónoma de Bucaramanga (UNAB).
* Expiración semestral obligatoria de verificación institucional (6 meses).
* Asignación de roles y permisos con Spatie Laravel Permission sobre UUIDs.
* Suspensión de cuentas: manual (administrador) y automática por cancelaciones tardías, con bitácora en `user_suspension_logs`. Las suspensiones automáticas vencidas se levantan de forma perezosa: `JwtAuthenticate` reactiva la cuenta en la primera petición posterior al vencimiento (sin scheduler).
* Estadísticas de reputación con umbral de 3 viajes completados para exposición pública.

---

## 2. Endpoints Principales

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/institutions` | Listar universidades y sedes oficiales (El Jardín, El Bosque, CSU, La Casona). |
| `POST` | `/api/v1/auth/register` | Registro de estudiantes, docentes o administrativos con código `UXXXXXXXX`. |
| `POST` | `/api/v1/auth/login` | Autenticación institucional y emisión de Bearer Token. |
| `GET` | `/api/v1/auth/me` | Consulta de perfil autenticado con roles. |
| `POST` | `/api/v1/auth/logout` | Revocación inmediata del token de sesión. |
| `POST` | `/api/v1/internal/users/{id}/late-cancellation-suspension` | Interno: suspende al usuario por cancelaciones tardías. Solo accesible con token de servicio (`jwt.service`), lo invoca trip-service. |

---

## 3. Pruebas Automatizadas
```bash
./vendor/bin/pest
```
Cobertura: 9 pruebas unitarias y de integración sobre PostgreSQL `auth_db`.

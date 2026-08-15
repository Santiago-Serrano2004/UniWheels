# Microservicio de Autenticación, Usuarios y Billeteras (auth-service)

Microservicio en Laravel 13 responsable de la gestión de identidad, control de acceso basado en roles (RBAC) y ledger financiero de billeteras prepago.

---

## 1. Responsabilidades
* Autenticación segura con tokens Bearer (Laravel Sanctum).
* Validación estricta de pertenencia a la Universidad Autónoma de Bucaramanga (UNAB).
* Expiración semestral obligatoria de verificación institucional (6 meses).
* Asignación de roles y permisos con Spatie Laravel Permission sobre UUIDs.
* Gestión de Billeteras Virtuales Prepago (`user_wallets`) y transacciones contables inmutables.
* Estadísticas de reputación con umbral de 3 viajes completados para exposición pública.

---

## 2. Endpoints Principales

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/institutions` | Listar universidades y sedes oficiales (El Jardín, El Bosque, CSU, La Casona). |
| `POST` | `/api/v1/auth/register` | Registro de estudiantes, docentes o administrativos con código `UXXXXXXXX`. |
| `POST` | `/api/v1/auth/login` | Autenticación institucional y emisión de Bearer Token. |
| `GET` | `/api/v1/auth/me` | Consulta de perfil autenticado con saldo de billetera y roles. |
| `POST` | `/api/v1/auth/logout` | Revocación inmediata del token de sesión. |

---

## 3. Pruebas Automatizadas
```bash
./vendor/bin/pest
```
Cobertura: 9 pruebas unitarias y de integración sobre PostgreSQL `auth_db`.

# Autenticación y tokens

Estrategia de autenticación de la API REST de Finper.

---

## Flujo general

```
                         ┌─────────────┐
  POST /api/auth/login   │  Passport   │   JWT firmado
  { username, password }─►  local      ├──► { token }
                         │  strategy   │
                         └─────────────┘

  Cualquier endpoint protegido:

  Authorization: Bearer <token>
        │
        ▼
  ┌─────────────┐     ┌──────────────┐
  │  Passport    │     │  refreshToken │  Cabecera de respuesta:
  │  jwt         ├────►│  (sliding)    ├──► Token: <nuevo-jwt>
  │  strategy    │     │              │    Access-Control-Expose-Headers: *, Token
  └─────────────┘     └──────────────┘
```

## Registro

`POST /api/auth/register` — crea un usuario y devuelve un JWT.

> **Nota**: El registro está protegido por la variable de entorno
> `ALLOW_REGISTRATION`. Si no está configurada o es distinta de `"true"`, el
> endpoint devuelve `403 Forbidden`.

## Login

`POST /api/auth/login` — autentica con Passport (estrategia `local`) y devuelve
un JWT firmado con `config.jwt.secret`.

## Token JWT

| Propiedad | Valor |
|---|---|
| Algoritmo | HS256 (por defecto de `jsonwebtoken`) |
| Payload | `{ username }` |
| Expiración | 1 hora (`config.jwt.timeout = '1h'`) |
| Secret | `process.env.JWT_SECRET` (obligatorio en producción) |

## Sliding session (sesión deslizante)

El middleware `auth.middleware.ts` implementa un sliding session implícito:

1. Cada petición autenticada pasa por `checkAuthorization`.
2. Passport verifica el JWT (`jwt` strategy, extrae del header `Authorization: Bearer <token>`).
3. Si el token es válido:
   - Se asigna `req.user = user.username`.
   - Se genera un **nuevo token** con la misma expiración de 1 hora.
   - Se envía en la cabecera de respuesta `Token`.
   - Se expone con `Access-Control-Expose-Headers: *, Token`.
4. El cliente debe leer la cabecera `Token` de cada respuesta y persistirla
   como nuevo bearer token para las siguientes peticiones.

### Efecto práctico

Mientras el usuario haga al menos una petición autenticada cada hora, su sesión
se renueva indefinidamente. Si deja pasar más de 1 hora sin actividad, el token
expira y debe volver a autenticarse con login.

## Verificación de token (`GET /api/auth/me`)

Endpoint ligero que solo aplica `authMiddleware` y devuelve `204 No Content`.
Su función principal es forzar la renovación del token sin realizar ninguna
operación de negocio.

---

## Limitaciones conocidas

> **No hay refresh token explícito.** El mecanismo de renovación depende
> exclusivamente del sliding session descrito arriba. No existe un endpoint
> `/refresh` ni un token de larga duración separado.

> **No hay revocación de tokens.** Los JWT emitidos son válidos hasta su
> expiración natural (1 hora). No existe blacklist ni mecanismo para invalidar
> un token antes de que expire. Si un token se compromete, permanece válido
> hasta su expiración.

> **No hay rotación de secrets.** El `JWT_SECRET` es único y estático. Un
> cambio de secret invalida todos los tokens en vuelo simultáneamente.

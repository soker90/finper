# Login con Passkey (WebAuthn) — Documentación Técnica

## Índice

1. [Visión general](#1-visión-general)
2. [Modelo de datos](#2-modelo-de-datos)
3. [Flujo de registro](#3-flujo-de-registro)
4. [Flujo de autenticación](#4-flujo-de-autenticación)
5. [API](#5-api)
6. [Frontend](#6-frontend)
7. [Configuración](#7-configuración)
8. [Decisiones de seguridad](#8-decisiones-de-seguridad)

---

## 1. Visión general

Además de usuario/contraseña, Finper permite iniciar sesión con una **passkey**
(huella, Face ID, Windows Hello, llave de seguridad física...) usando el
estándar WebAuthn/FIDO2, a través de `@simplewebauthn/server` en la API y
`@simplewebauthn/browser` en el cliente.

El registro de la passkey **no es un flujo independiente**: se ofrece como un
paso opcional justo después de un login con usuario/contraseña exitoso
("Usar huella para próximos accesos"). Si ese registro falla, no bloquea el
login — es un extra, no un requisito.

Una vez registrada, el dispositivo recuerda localmente el último usuario y en
los siguientes accesos la pantalla de login ofrece directamente el botón
"Entrar con huella" en lugar del formulario de contraseña.

### Ficheros principales

```text
packages/
├── db/src/schema/
│   └── passkeys.ts                          ← tabla passkeys
└── api/src/modules/passkeys/
    ├── passkeys.repository.ts
    ├── passkeys.service.ts
    ├── passkeys.controller.ts
    ├── passkeys.validators.ts
    └── passkeys.routes.ts

packages/client/src/
├── utils/webauthn.ts                        ← wrapper sobre @simplewebauthn/browser
├── services/authService.ts                  ← registerPasskey / loginWithPasskey
└── pages/Login/
    ├── AuthLogin.tsx                        ← switch "usar huella" en el login normal
    ├── PasskeyLogin.tsx                     ← pantalla "Entrar con huella"
    └── hooks/
        ├── usePasskeySupport.ts             ← detecta soporte WebAuthn del navegador
        └── usePasskeyLogin.ts               ← orquesta el login con passkey
```

---

## 2. Modelo de datos

### Tabla `passkeys`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `text` (PK) | Identificador generado (`generateId()`) |
| `user` | `text` | Username propietario (FK a `users.username`) |
| `credential_id` | `text` | ID de la credencial WebAuthn, **único** (`passkeys_credential_id_idx`) |
| `public_key` | `text` | Clave pública en base64url |
| `counter` | `integer` | Contador anti-clonado del autenticador |
| `transports` | `text` | JSON con los transportes soportados (`internal`, `usb`, ...) |
| `device_label` | `text` | Etiqueta opcional del dispositivo (ej. "iPhone de Eduardo") |
| `created_at` | `integer` (timestamp ms) | Fecha de alta |

Un usuario puede tener varias passkeys (una por dispositivo). No hay límite
aplicado a nivel de aplicación.

---

## 3. Flujo de registro

1. El usuario activa el switch **"Usar huella para próximos accesos"** en el
   login normal (`AuthLogin.tsx`) y envía usuario/contraseña. El switch solo
   se muestra si `usePasskeySupport()` detecta que el navegador soporta
   WebAuthn con autenticador de plataforma.
2. Tras un login con contraseña correcto, `useLogin` llama en segundo plano a
   `authService.registerPasskey()`. Un fallo aquí se ignora (`.catch(() => {})`)
   y nunca bloquea la navegación a la app.
3. `registerPasskey()` hace `POST /auth/webauthn/registration-options`
   (autenticado con el JWT recién obtenido). El servicio:
   - excluye las credenciales que el usuario ya tenga registradas
     (`excludeCredentials`), para que el sistema operativo no ofrezca
     re-registrar la misma passkey;
   - genera las opciones con `generateRegistrationOptions`;
   - firma un `challengeToken` (JWT propio, TTL 5 min, `purpose: 'registration'`,
     con un `jti` único).
4. El navegador ejecuta `startRegistration` (API WebAuthn nativa): el usuario
   confirma con su huella/PIN/llave física.
5. El cliente envía `POST /auth/webauthn/registration-verify` con
   `{ response, challengeToken, deviceLabel }` (autenticado).
6. El servicio verifica, en este orden:
   - que el `username` del `challengeToken` coincide con el usuario autenticado;
   - la respuesta criptográfica con `verifyRegistrationResponse`;
   - que el `credential_id` resultante no esté ya registrado por nadie (si lo
     está, responde `409 Conflict` en vez de dejar que reviente el índice
     único de SQLite).
7. Si todo es correcto, persiste la credencial y responde `204`.
8. El cliente marca en `localStorage`: `FINPER_HAS_PASSKEY=true` y
   `FINPER_LAST_USERNAME=<username>` (`rememberPasskeyDevice`).

---

## 4. Flujo de autenticación

1. En la pantalla de login, `PasskeyLogin.tsx` comprueba
   `authService.hasPasskey()` y `authService.getLastUsername()`. Si ambos
   existen (y el usuario no ha pulsado "Usar contraseña"), se muestra el
   botón **"Entrar con huella"** en vez del formulario de contraseña.
2. Al pulsarlo, `usePasskeyLogin` llama a `authService.loginWithPasskey(username)`,
   que hace `POST /auth/webauthn/authentication-options { username }`. Esta
   ruta es **pública** (sin JWT: todavía no hay sesión). Si el usuario no
   tiene ninguna credencial registrada, responde `404`.
3. El navegador ejecuta `startAuthentication` con las opciones recibidas.
4. El cliente envía `POST /auth/webauthn/authentication-verify` con
   `{ response, challengeToken }` (también pública).
5. El servicio localiza la credencial por `credential_id`, comprueba que
   pertenece al `username` firmado en el `challengeToken`, verifica la firma
   con `verifyAuthenticationResponse` contra la `public_key` almacenada,
   actualiza el `counter` y firma un JWT de sesión normal (`signToken`).
6. El cliente guarda el token de sesión y refresca `FINPER_LAST_USERNAME`.
7. Manejo de errores en el cliente (`usePasskeyLogin`):
   - `NotAllowedError` (el usuario cancela el diálogo del sistema operativo):
     se muestra "Operación cancelada." sin olvidar el dispositivo.
   - `404`/`401` (la credencial ya no existe en el servidor o no es válida):
     se olvida la passkey local (`forgetPasskeyDevice`) y se cae al
     formulario de contraseña.

---

## 5. API

Base path: `/api/auth/webauthn` (montado en `server.ts`).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/registration-options` | JWT | Genera opciones + `challengeToken` para registrar una passkey |
| `POST` | `/registration-verify` | JWT | Verifica la respuesta del autenticador y persiste la credencial |
| `POST` | `/authentication-options` | Pública | Genera opciones + `challengeToken` para autenticar con `username` |
| `POST` | `/authentication-verify` | Pública | Verifica la respuesta del autenticador y devuelve un JWT de sesión |

Las rutas `authentication-*` son públicas porque en ese punto del flujo de
login todavía no existe un JWT — es justo lo que se está intentando obtener.

---

## 6. Frontend

- `utils/webauthn.ts`: wrapper fino sobre `@simplewebauthn/browser`
  (`isPasskeySupported`, `registerPasskey`, `authenticateWithPasskey`).
- `usePasskeySupport()`: hook que resuelve de forma asíncrona si el
  dispositivo soporta un autenticador de plataforma (huella, Face ID...);
  controla el switch en `AuthLogin.tsx`.
- `usePasskeyLogin()`: orquesta la llamada a `authService.loginWithPasskey`,
  la navegación tras éxito y los mensajes de error descritos arriba.
- Claves usadas en `localStorage` (`config/index.ts`): `FINPER_HAS_PASSKEY` y
  `FINPER_LAST_USERNAME`. No se guarda ningún dato biométrico ni la
  credencial en sí: solo un flag local y el último username, para decidir
  qué pantalla de login mostrar.

---

## 7. Configuración

Variables de entorno (ver `.env.example`):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `WEBAUTHN_RP_ID` | No (default `localhost`) | Dominio (sin esquema ni puerto) desde el que se sirve la app |
| `WEBAUTHN_ORIGIN` | No (default `http://localhost:5173,http://localhost:3008`) | Orígenes completos permitidos, separados por comas |
| `WEBAUTHN_RP_NAME` | No (default `Finper`) | Nombre mostrado en el diálogo del sistema operativo |
| `WEBAUTHN_CHALLENGE_SECRET` | No | Secreto para firmar el `challengeToken`. Si no se define, se reutiliza `JWT_SECRET` |

En producción, `WEBAUTHN_RP_ID` y `WEBAUTHN_ORIGIN` deben coincidir
exactamente con el dominio público real (el navegador rechaza la ceremonia
WebAuthn si no coinciden).

---

## 8. Decisiones de seguridad

### 8.1 `challengeToken` de un solo uso

El reto (`challenge`) que genera cada llamada a `*-options` viaja firmado en
un JWT de corta duración (`challengeTokenTtl`, 5 min) en vez de guardarse en
sesión de servidor. Para que WebAuthn se cumpla estrictamente (cada
`challenge` debe usarse una única vez), cada `challengeToken` incluye un
`jti` aleatorio que se marca como consumido en memoria la primera vez que se
verifica con éxito; un segundo intento con el mismo token se rechaza aunque
siga dentro de su TTL. Esto evita que una respuesta de autenticador
capturada (p. ej. en un proxy o log) pueda reproducirse mientras el token
no haya caducado.

### 8.2 Sin límite de intentos (rate limiting)

Las rutas `authentication-*` no aplican rate limiting a nivel de aplicación.
Es una decisión consciente: Finper se despliega detrás de un **Cloudflare
Tunnel con Access** (Zero Trust) — cualquier petición que llegue al origen ya
ha pasado una comprobación de identidad previa, por lo que un atacante
anónimo de internet no puede alcanzar estos endpoints para intentar
enumeración o fuerza bruta. Si el despliegue cambiase a un modelo sin esa
capa de identidad delante (tunnel sin Access, o exposición directa), esta
decisión debería revisarse.

### 8.3 Registro nunca bloquea el login

El registro de la passkey ocurre "a mejor esfuerzo" tras un login exitoso.
Cualquier error (red, verificación fallida, credencial duplicada) se ignora
en el cliente y el usuario continúa a la aplicación con su sesión normal.

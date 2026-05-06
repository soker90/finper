# Arquitectura

Visión global de Finper para agentes IA y contribuyentes. Una sola pasada para entender cómo encajan los paquetes, el flujo de petición y el toolchain.

> Para detalles por paquete, ver [`packages/api/AGENTS.md`](../packages/api/AGENTS.md), [`packages/client/AGENTS.md`](../packages/client/AGENTS.md), [`packages/models/AGENTS.md`](../packages/models/AGENTS.md).

---

## 1. Monorepo

```
finper/
├── packages/
│   ├── models/   @soker90/finper-models   — Mongoose schemas (publicable a npm)
│   ├── api/      @soker90/finper-api      — Express REST API en :3008
│   └── client/   @soker90/finper-client   — React 19 + Vite SPA en :5173
├── docs/                                  — documentación técnica
├── Makefile                               — entrada para todos los comandos
├── docker-compose.yml                     — MongoDB + API
└── pnpm-workspace.yaml
```

### Dependencias entre paquetes

```
client  ──HTTP──▶  api  ──require──▶  models (dist/)
                                           │
                                           ▼
                                       MongoDB
```

- `api` depende de `models` vía `workspace:*` y consume el **build compilado** (`packages/models/dist/`), no la fuente. Sin `make build-models`, la API no arranca.
- `client` no depende de `models`: tiene tipos propios en `src/types/`. La frontera de tipado entre cliente y API es de facto el JSON HTTP.
- `models` se publica de forma independiente a npm (`finper-bot` u otros consumidores externos pueden usarlo).

---

## 2. Flujo de una petición

```
Browser (React)
    │
    │ axios.get('accounts')
    │  - baseURL = VITE_API_HOST
    │  - header `token` desde localStorage[FINPER_TOKEN]
    ▼
Express :3008
    │
    ▼
preMiddlewareConfig             — express.json, urlencoded, compression, cors
    │
    ▼
routes/account.routes.ts        — match `/api/accounts` → AccountRoutes
    │
    ▼
middlewares/auth.middleware     — passport.authenticate('jwt')
    │                             setea req.user = username (string)
    │                             refresca header `Token` en la respuesta
    ▼
controllers/account.controller  — Promise chain con bluebird:
    │                             tap(log) → then(extractUser)
    │                             → then(validateXxxParams)
    │                             → tap(validateXxxExist)
    │                             → then(service.method)
    │                             → then(res.send) | catch(next)
    ▼
services/account.service        — lógica de negocio
    │                             throw Boom.<x>(...).output en errores
    ▼
@soker90/finper-models          — AccountModel.find(...)
    │
    ▼
MongoDB                         — colección `accounts`
    │
    ▲
    │ (errores → next(error))
    │
middlewares/handle-error        — payload Boom.Output → res.status().json()
                                  errores no-Boom → 500 (badImplementation)
```

Detalle del Promise chain canónico: `packages/api/AGENTS.md` §2.

---

## 3. Build order

| Orden | Comando | Por qué |
|---|---|---|
| 1 | `pnpm install` | Resuelve workspace + lockfile. |
| 2 | `make build-models` | Genera `packages/models/dist/`. La API y los tests de la API lo importan desde `dist/`. |
| 3 | `make start-api` | Arranca Express en `:3008`. Requiere `dist/` del paso 2. |
| 4 | `make start-client` | Arranca Vite en `:5173`. Independiente de los pasos 2 y 3 a nivel de build. |

Para pruebas:

| Comando | Pre-requisito |
|---|---|
| `make test-models` | Ninguno (Jest + jest-mongodb). |
| `make test-api` | `make build-models` previo. Jest + jest-mongodb + supertest. |
| `make test-client` | Ninguno (Vitest + MSW; no necesita la API real). |

Más detalle del toolchain (Jest vs Vitest, jest-mongodb, ESLint flat config, alias en cliente) en el `AGENTS.md` raíz.

---

## 4. Autenticación

Flujo end-to-end del JWT:

| # | Actor | Acción |
|---|---|---|
| 1 | Cliente | `POST /api/auth/login` con `{ username, password }`. |
| 2 | API | Controlador llama manualmente a `passport.authenticate('local', cb)` (no es middleware). Estrategia local: `UserModel.findOne` + `bcrypt.compareSync`. |
| 3 | API | Si OK, `authService.getSignedToken(username)` con `config.jwt.secret`, `expiresIn: 1h`. Responde `{ token }`. |
| 4 | Cliente | Guarda el token en `localStorage[FINPER_TOKEN]`. Interceptor `axios` lo añade en header `token` en cada petición. |
| 5 | API | Endpoint protegido pasa por `authMiddleware` → `passport.authenticate('jwt', cb)`. Si OK: `req.user = user.username` (string) y refresca header `Token` en la respuesta. |
| 6 | Cliente | Interceptor `axios` lee header `Token` de la respuesta y actualiza `localStorage`. Implementa refresco continuo mientras el usuario navega. |

Componentes clave:

- `packages/api/src/auth/local-strategy-passport-handler.ts` — registra estrategia `local`.
- `packages/api/src/auth/jwt-strategy-passport-handler.ts` — registra estrategia `jwt`.
- `packages/api/src/middlewares/auth.middleware.ts:14-48` — wrapper + refresh.
- `packages/api/src/helpers/sign-token.ts` — firma JWT.
- `packages/api/src/services/auth.service.ts` — duplica firma JWT (deuda técnica).
- `packages/client/src/components/Auth/index.tsx` — inicialización del token al montar.
- `packages/client/src/utils/axios.ts` — interceptor.
- `packages/client/src/contexts/AuthContext.tsx` — `hasToken`, `setAccessToken`, `handleLogout`.
- `packages/client/src/guards/AuthGuard.tsx` / `GuestGuard.tsx` — redirección por rutas.

Endpoints:

| Método | Path | Auth | Propósito |
|---|---|---|---|
| `POST` | `/api/auth/register` | público | Crear usuario y devolver token. |
| `POST` | `/api/auth/login` | público | Login y devolver token. |
| `GET` | `/api/auth/me` | jwt | Refresca token (responde `204`). |

---

## 5. Persistencia

- **MongoDB** como única base de datos.
- Conexión gestionada por `@soker90/finper-models` (`packages/models/src/mongoose-connect.ts`).
- La API la inicia desde `packages/api/src/config/db.ts:19` solo si `NODE_ENV !== 'test'`.
- En tests (api y models) se usa **MongoDB en memoria** vía `@shelf/jest-mongodb` (`global.__MONGO_URI__`).
- **Multitenancy**: cada documento (excepto `User`) lleva campo `user: string` con el username. Las queries siempre filtran por `user`.
- Convenciones de modelo, índices y quirks en [`packages/models/AGENTS.md`](../packages/models/AGENTS.md).

---

## 6. Tooling clave

### Backend

| Pieza | Notas |
|---|---|
| Express 5 | Servidor HTTP. |
| Bluebird | Reemplaza `global.Promise` en `server.ts:30`. Habilita `.tap()` en controllers. |
| Passport + JWT | Auth (estrategias `local` y `jwt`). |
| Joi | Validación de params. Validadores en `validators/<dominio>/`. |
| Boom | Errores HTTP. Lanzar **siempre** `Boom.<x>(...).output`. |
| Mongoose | Vía `@soker90/finper-models`. |
| ts-node + ts-jest | Ejecución y test sin build previo de la API. |

### Frontend

| Pieza | Notas |
|---|---|
| React 19 | Para código nuevo: `ref` como prop, `use()`. Heredado: `forwardRef`/`useContext`. |
| Vite 7 | Dev server + build. Plugin PWA con `autoUpdate`. |
| React Router v7 | `'react-router'` (sin `dom`). `useRoutes` + `lazy`. |
| MUI v6 | Theme custom fijo en `light`, locale `esES`, dayjs `es`. |
| SWR | Lectura de datos. Fetcher global axios. Key = constante de `api-paths.ts`. |
| axios | Cliente HTTP con interceptor de token. |
| Vitest + happy-dom | Tests con setup global en `vite.config.ts`. |
| MSW | Mocks de API en tests. Override por test con `server.use`. |
| @testing-library/react | Render envuelto en `src/test/testUtils.tsx`. |

### Toolchain compartido

| Pieza | Notas |
|---|---|
| pnpm 10 (workspaces) | Lockfile obligatorio, `^`/`~` prohibidos. |
| Make | Punto de entrada para todos los comandos. |
| ESLint flat config | `neostandard` + `@typescript-eslint`. Sin `.eslintrc`. |
| `@shelf/jest-mongodb` | MongoDB en memoria para tests. Ubuntu 22+: requiere `libssl1.1`. |
| Husky + commitlint | Hooks de git. |
| TypeScript | `strict: true` en api/client; `strictNullChecks: false` en models. |
| Node 24 | `.nvmrc` y `engines.node ≥24.x`. |

---

## 7. Variables de entorno

`.env` en raíz (consumido por la API):

| Variable | Obligatoria | Notas |
|---|---|---|
| `DATABASE_NAME` | Sí | |
| `DATABASE_HOST` | Sí | |
| `JWT_SECRET` | Sí | Firma JWT. |
| `SALT_ROUNDS` | Sí | bcrypt. |
| `MONGODB` | No | URI completa; tiene prioridad sobre host+name. |
| `MONGODB_USER` / `MONGODB_PASS` | No | |
| `TICKET_BOT_URL` / `TICKET_BOT_API_KEY` | No | Integración con `finper-bot`. |
| `GRAFANA_LOGGER_USER` / `GRAFANA_LOGGER_PASSWORD` | No | Logger externo (no montado actualmente). |

Específicas de Docker Compose (`docker-compose.yml`): `DATABASE_ROOT_USERNAME`, `DATABASE_ROOT_PASSWORD`, `LOKI_USER`, `LOKI_PASSWORD`.

`packages/client/.env` (consumido por Vite):

```dotenv
VITE_API_HOST=http://localhost:3008/api/
```

Sin `VITE_API_HOST`, todas las llamadas del cliente fallan en desarrollo (no hay fallback).

---

## 8. Integraciones externas

- **`finper-bot`** ([repo separado](https://github.com/soker90/finper-bot)): servicio de tickets. La API actúa como cliente HTTP usando `TICKET_BOT_URL` + `TICKET_BOT_API_KEY`. Si no se configura, la pantalla de tickets no funciona pero el resto de la app sí.
- **Proveedor de cotizaciones de stock**: `services/stock-price.provider.ts` consulta una API externa.
- **Tarifas eléctricas**: `services/tariffs.service.ts` para el módulo de suministros.

---

## 9. Decisiones arquitectónicas

| Decisión | Razón / consecuencia |
|---|---|
| Monorepo con `models` separado y publicable | Permite reutilizar los schemas en servicios externos (`finper-bot`). Coste: la API consume `dist/` y requiere build previo. |
| Cliente con tipos propios (sin importar `models`) | Evita acoplar el bundle del cliente al runtime de Mongoose. Coste: tipos duplicados que pueden divergir. |
| DI manual en la API (sin contenedor) | Simplicidad. Services como singletons en `services/index.ts`. Coste: `new XxxService()` ad-hoc en algún controller (ver deuda en `packages/api/AGENTS.md`). |
| Bluebird como `global.Promise` | Habilita `.tap()` para logs y validators de existencia. Coste: dependencia adicional, semántica algo distinta a Promises nativas. |
| Errores Boom con `.output` (no la instancia) | Estandariza la forma del error en el handler central. Trampa típica si se olvida `.output`. |
| Validación dentro del Promise chain del controller | Permite mezclar Joi (transforma payload) y validadores DB (sólo lanzan). Coste: validadores no son middlewares Express; no se pueden reutilizar fácilmente fuera del chain. |
| SWR (lectura) + funciones planas (escritura) en cliente | Cache + revalidación automática para queries; control fino para mutaciones. Patrón consolidado, ver `packages/client/AGENTS.md`. |
| Theme MUI en español + light fijo | Producto monolingüe y mono-modo. Si se introduce dark mode, hay que migrar `themes/index.tsx`. |
| MSW para tests del cliente | Tests de página realistas sin mockear `axios`. Coste: necesita `server.use` por test si la respuesta varía. |

---

## 10. Glosario rápido

- **Cuenta** (`Account`): cuenta bancaria del usuario con saldo.
- **Movimiento** (`Transaction`): ingreso/gasto/transferencia ligado a cuenta y categoría.
- **Categoría** (`Category`): agrupación de transacciones; tiene tipo (`Income`/`Expense`).
- **Presupuesto** (`Budget`): tope mensual por categoría (índice único `category+year+month+user`).
- **Préstamo** (`Loan`) + **LoanPayment** + **LoanEvent**: amortización francesa, pagos y cambios de tipo. Ver [`docs/loan-module.md`](./loan-module.md).
- **Suscripción** (`Subscription`) + **SubscriptionCandidate**: gastos recurrentes y candidatos detectados. Ver [`docs/subscription-module.md`](./subscription-module.md).
- **Deuda** (`Debt`): dinero prestado a/desde un tercero.
- **Meta** (`Goal`): objetivo de ahorro con `targetAmount` y `currentAmount`.
- **Pensión** (`Pension`): aportaciones a planes de pensiones.
- **Stock**: compras/ventas de acciones.
- **Inmueble** (`Property`) + **Suministro** (`Supply`) + **Lectura** (`SupplyReading`): vivienda, contadores y consumo.
- **Tienda** (`Store`): comercios donde se realizan transacciones.
- **Ticket**: integración con `finper-bot` (digitalización de recibos).
- **Usuario** (`User`): credenciales (`username` + `password` con bcrypt).

Ver [`docs/DOMAIN.md`](./DOMAIN.md) para el detalle de campos y relaciones.

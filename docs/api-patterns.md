# API patterns

Detalle operativo de `packages/api`. Cargar bajo demanda. Para reglas críticas y checklist, ver [`packages/api/AGENTS.md`](../packages/api/AGENTS.md).

---

## Estructura de `src/`

| Carpeta | Rol |
|---|---|
| `auth/` | Estrategias Passport (`local`, `jwt`). Se importan **por side effect** para registrarse. |
| `config/` | `index.ts` (config central), `db.ts` (wrapper sobre `models.connect`), `inputs.ts` (límites de username/password). |
| `controllers/` | 18 archivos. Patrón Promise chain con bluebird. |
| `helpers/` | Funciones puras: `extract-user.ts`, `hash-password.ts`, `sign-token.ts`. |
| `i18n/` | `ErrorMessages.ts` con `ERROR_MESSAGE` (solo es-ES). |
| `middlewares/` | `auth.middleware.ts` (jwt + refresh), `handle-error.ts` (handler global). `logger.ts` existe pero **no se monta**. |
| `routes/` | 18 archivos. Una clase `XxxRoutes` con propiedad `router: Router`. |
| `scripts/` | `seed-user.ts`. Excluido de cobertura. |
| `services/` | Una clase por dominio + `dashboard/` modular + `utils/` (helpers de negocio). `index.ts` instancia singletons. |
| `types/` | `RequestUser`, `CustomError`, `HttpError extends Boom.Output`. |
| `utils/` | `logger.ts`, `mongoose.ts` (`leanDoc<T>`), `roundNumber.ts`. |
| `validators/` | Carpeta por dominio con `index.ts` barrel + `validate-<dominio>-<acción>-params.ts` y `validate-<dominio>-exist.ts`. |

---

## Flujo de petición

```
routes/<X>.routes.ts        → authMiddleware + .bind() del controller
middlewares/auth.middleware → Passport JWT → req.user = username (string), refresca header Token
controllers/<X>.controller  → Promise chain bluebird
services/<X>.service        → lógica + Boom.<x>(...).output en errores
@soker90/finper-models      → consumido desde dist/
MongoDB
```

---

## Patrón canónico de controller

`packages/api/src/controllers/loan.controller.ts:51-58`:

```ts
public async create (req, res, next) {
  Promise.resolve(req.body)
    .tap(({ name }) => this.logger.logInfo(`/loans/create - ${name}`))
    .then(extractUser(req))                     // .then si transforma payload
    .then(validateLoanCreateParams)             // Joi: valida y devuelve value
    .then(this.loanService.createLoan.bind(this.loanService))
    .then((response) => res.status(201).send(response))
    .catch(next)
}
```

- `.tap()` → no muta el payload (logs, validadores de existencia).
- `.then()` → muta o consume el payload (validadores Joi, llamadas a service, respuesta).
- Nunca `try/catch`. Siempre `.catch(next)`.

---

## Routes

- Clase `XxxRoutes` con `router: Router` y `xxxController` privado instanciado inline.
- `constructor()`: `this.router = Router(); this.routes()`.
- Cada endpoint: `this.router.<verb>(path, authMiddleware, this.ctrl.method.bind(this.ctrl))`.
- `authMiddleware` por endpoint. Excepciones: `/auth/login`, `/auth/register`, `/monit/health`.
- Sin validators como middleware; viven dentro del controller.

---

## Services

- `interface IXxxService` + `default class XxxService implements IXxxService`.
- Stateless (sin constructor, salvo `auth.service.ts` que recibe `jwtConfig`).
- Errores: `throw Boom.<x>(ERROR_MESSAGE.<DOMINIO>.<CLAVE>).output`.
- Queries lean: usar `leanDoc<T>(query)` de `utils/mongoose.ts:5` en vez de cast inline.
- Lógica compleja → `services/utils/` (`calcLoanProjection.ts`, `calcBudgetByMonths.ts`, `insights.ts`).
- Registrar singleton en `services/index.ts` y consumirlo desde `routes/`.

---

## Validators

`validators/<dominio>/index.ts` barrel. Dos sub-tipos:

**Params (Joi)** — `validate-<dominio>-<accion>-params.ts`:
```ts
export const validateXxxYyyParams = (input) => {
  const schema = Joi.object({ ... })
  const { error, value } = schema.validate(input)
  if (error) throw Boom.badData(error.message).output
  return value
}
```
`Joi.forbidden()` para campos calculados (ver `validate-loan-create-params.ts:14-15`).

**Existencia (DB)** — `validate-<dominio>-exist.ts`:
```ts
if (!Types.ObjectId.isValid(id)) throw Boom.badRequest(...).output
const exist = await XxxModel.exists({ _id: id, user })
if (!exist) throw Boom.notFound(...).output
```

Invocación en el Promise chain:
- Joi-params con `.then(validateXxx)` (devuelve payload validado).
- Existencia con `.tap(() => validateXxxExist({ id, user }))` (no devuelve nada).

---

## Auth flow

1. `POST /auth/register` → `validateRegisterInputParams` → `userService.createUser` (con `hash-password`) → JWT.
2. `POST /auth/login` → `passport.authenticate('local', cb)` invocado **manualmente** dentro del controller (no como middleware) → `authService.getSignedToken(username)` → `{ token }`.
3. Endpoint protegido: `authMiddleware` invoca `passport.authenticate('jwt', cb)`. Si OK:
   - `req.user = user.username` (string).
   - Refresca header `Token` (`auth.middleware.ts:14-18`) — el cliente debe persistirlo.
4. `GET /auth/me`: solo aplica `authMiddleware` y devuelve `204`. Sirve para refrescar token.
5. JWT firmado con `config.jwt.secret`, `expiresIn: '1h'`. Helper `helpers/sign-token.ts`.

---

## Errores e i18n

- Mensajes en `i18n/ErrorMessages.ts`, agrupados por dominio: `ERROR_MESSAGE.LOAN.NOT_FOUND`.
- Handler central `middlewares/handle-error.ts:23-49`, montado en `server.ts:73`.
- Sin payload Boom → 500 (`badImplementation`) sin filtrar mensaje.
- No hay locale real, todo en es-ES. Para añadir dominio: nuevo grupo en `ERROR_MESSAGE`.

---

## Tests

- **Carpeta separada** `packages/api/test/` (NO co-localizados).
- `test/routes/<dominio>.routes.test.ts` — E2E con `supertest` contra `server.app`.
- `test/services/*.service.test.ts` — unitarios cuando la lógica no se cubre por rutas.
- `test/utils/*.test.ts` — funciones puras.

Helpers compartidos:
- `test/test-db.js` — `connect/close/cleanAll` sobre `global.__MONGO_URI__`.
- `test/insert-data-to-model.ts` — factories (`insertAccount`, `insertLoan`) con faker.
- `test/request-login.ts` — credenciales + JWT vía `POST /auth/login`.

`@shelf/jest-mongodb` requiere `libssl1.1` en Ubuntu 22+. `NODE_ENV=test` evita `server.start()` y `db.connect()` reales.

```bash
make test-api
pnpm --filter @soker90/finper-api exec jest test/routes/loan.routes.test.ts
pnpm --filter @soker90/finper-api exec jest --testNamePattern="should return 200"
```

---

## Quirks (no propagar)

- **HTTP en creación**: 200 en account/transaction, 201 en loan. Para nuevo: `201` en POST creación, `204` en DELETE.
- **Mensajes literales** fuera de `ERROR_MESSAGE` (`validate-loan-exist.ts:6,10`, `account.service.ts:52`). Para nuevo: siempre `ERROR_MESSAGE.<DOMINIO>.<CLAVE>`.
- **Duplicación firma JWT** entre `auth.service.ts` y `helpers/sign-token.ts`. Reutilizar el helper.
- **`helmet`** en deps pero **no montado**. Idem `middlewares/logger.ts`.
- **Estrategias Passport con `require()`**: único sitio sin ES imports (`auth/jwt-strategy-passport-handler.ts:6-10`, `auth/local-strategy-passport-handler.ts:5`). Legado.
- **Naming FKs inconsistente** (`account` vs `accountId`, …). Mantener consistencia con el modelo afectado; preferir sin sufijo `Id` para nuevos.
- **`SubscriptionService` con `new` ad-hoc** en `transaction.service.ts` (no usa singleton). Para nuevo: usar singletons de `services/index.ts`.

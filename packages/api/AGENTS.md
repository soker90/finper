# AGENTS — `@soker90/finper-api`

> Patrones detallados (estructura, controllers, services, validators, auth flow, tests, ejemplos): [`docs/api-patterns.md`](../../docs/api-patterns.md).
> Catálogo de endpoints: [`docs/API-CATALOG.md`](../../docs/API-CATALOG.md).

**Antes de tocar la API**, si has modificado `packages/models`, ejecuta `make build-models`. La API consume `packages/models/dist/`, no `src/`.

---

## Reglas críticas (rompen cosas si las ignoras)

1. **Bluebird global**: `server.ts:30` reemplaza `global.Promise`. Por eso `.tap()` está disponible sin importar bluebird.
2. **`req.user` es `string`** (el username), no un objeto. Asignado por `auth.middleware.ts:44`. Patrón `req.user as string` por todo el código.
3. **Errores con `.output`**: `throw Boom.<x>(message).output`, **no** `throw Boom.<x>(message)`. El handler espera `Boom.Output` (`handle-error.ts:31`).
4. **Imports Passport por side effect** (`auth.middleware.ts:7`). Olvidarlo → *Unknown authentication strategy*.
5. **`.bind(controller)` obligatorio en routes**. Sin él, `this` falla en runtime.
6. **Validators NO son middleware Express**. Se invocan en el Promise chain del controller:
   - Joi-params con `.then(validateXxx)` (devuelve payload validado).
   - Existencia con `.tap(() => validateXxxExist({ id, user }))` (no devuelve nada).
7. **DI manual sin contenedor**: singletons en `services/index.ts`. Cada `routes/*.routes.ts` instancia su controller inline. No `new XxxService()` ad-hoc dentro de otros services.
8. **Order matters al montar rutas** (`server.ts:57-59`): `/api/supplies/properties` y `/api/supplies/readings` van **antes** de `/api/supplies` para evitar shadowing.
9. **`models.connect` es no-op si `NODE_ENV=test`** (`config/db.ts:19`); los tests conectan vía `test/test-db.js`.
10. **`/* istanbul ignore next — <razón> */`** con razón explícita. No quitarlas al refactorizar.

---

## Checklist: añadir un recurso CRUD (`Foo`)

1. Modelo en `packages/models/src/models/foos.ts` y registrar en `packages/models/src/index.ts` (ver [`packages/models/AGENTS.md`](../models/AGENTS.md)).
2. `make build-models`.
3. `validators/foo/`: `validate-foo-create-params.ts`, `validate-foo-edit-params.ts`, `validate-foo-exist.ts`, `index.ts` barrel.
4. `services/foo.service.ts` con `interface IFooService` + `default class FooService`.
5. Singleton en `services/index.ts`: `export const fooService = new FooService()`.
6. `controllers/foo.controller.ts` con clase `FooController` y DI por constructor.
7. `routes/foo.routes.ts` con clase `FooRoutes`, controller inline, `.bind()` en cada handler.
8. Registrar en `server.ts`: `this.app.use('/api/foos', new FooRoutes().router)`.
9. Mensajes en `i18n/ErrorMessages.ts`: nuevo grupo `FOO`.
10. Tests en `packages/api/test/routes/foo.routes.test.ts` (mínimo: list, get, create, edit, delete, 401/404/422). Factory `insertFoo` si se reutiliza.
11. Verificar: tests, lint y typecheck del paquete (ver comandos en raíz).

---

## Comandos específicos

> Comandos genéricos (build, test, lint, typecheck) en el [`AGENTS.md` raíz](../../AGENTS.md#commands-use-make-not-raw-pnpm).

```bash
make seed-user USERNAME=miusuario PASSWORD=mipassword
pnpm --filter @soker90/finper-api exec jest test/routes/loan.routes.test.ts
pnpm --filter @soker90/finper-api exec jest --testNamePattern="should return 200"
```

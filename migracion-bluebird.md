Plan de migración: eliminar Bluebird de Finper
Contexto del proyecto
Repositorio: soker90/finper — monorepo pnpm con:

packages/api — Express + TypeScript + Mongoose + Passport-JWT + Joi
packages/models — modelos Mongoose compartidos
packages/client — React + Vite (no afectado por esta migración)

Stack: Node 24+, pnpm 10, TypeScript, Jest para tests de API y models.
Diagnóstico previo (ya confirmado por análisis previo)

bluebird@3.7.2 está como dependencia en packages/api y packages/models.
Punto único de activación: packages/api/src/server.ts:31 con global.Promise = require('bluebird').
Uso real: solo .tap(), 135 invocaciones distribuidas en 18 controllers de packages/api.
packages/models declara la dependencia pero no la usa en ningún archivo (eliminación trivial).
packages/client no usa Bluebird.

Objetivo
Eliminar completamente Bluebird del monorepo en dos fases:

Fase 1 (puente): quitar la dependencia y el global.Promise = bluebird sin romper nada, manteniendo el estilo .then().tap() con un helper propio.
Fase 2 (modernización): refactorizar los 18 controllers a async/await nativo + error handler centralizado, controller a controller, con tests verdes entre cada paso.

No mezclar fases. No mezclar refactor estructural (separación service/controller, validaciones, etc.) con la migración. Comportamiento externo de la API debe ser idéntico en todo momento.

Fase 1 — Eliminar la dependencia (sesión única)
1.1 Crear el helper tap
Archivo nuevo: packages/api/src/utils/promise.ts
ts/**
 * Equivalente funcional al .tap() de Bluebird.
 * Ejecuta un side-effect sobre el valor resuelto y devuelve el valor intacto.
 * El side-effect puede ser síncrono o async; si es async se espera antes de continuar.
 *
 * Uso: promise.then(tap(value => doSomething(value)))
 */
export const tap =
  <T>(fn: (value: T) => unknown | Promise<unknown>) =>
  async (value: T): Promise<T> => {
    await fn(value);
    return value;
  };
Nota importante: el helper espera al side-effect (await fn(value)). Bluebird .tap() también espera si el callback devuelve una promesa. Mantener este comportamiento es clave para no introducir condiciones de carrera en logs, métricas o auditoría que actualmente dependan de ese await implícito.
1.2 Reemplazar usos de .tap(fn)
Localizar todos los usos:
bashgrep -rn "\.tap(" packages/api/src
Resultado esperado: 135 ocurrencias en 18 archivos.
Para cada ocurrencia:
ts// Antes
algo.tap(value => sideEffect(value))

// Después
algo.then(tap(value => sideEffect(value)))
En cada archivo afectado, añadir el import:
tsimport { tap } from '../utils/promise.js'; // ajustar ruta relativa
Reglas durante el reemplazo:

No tocar la lógica del callback, solo envolverlo con tap(...).
Si encuentras .tap(fn).tap(fn2), conviértelo a .then(tap(fn)).then(tap(fn2)) directamente.
Si encuentras .tap() sin argumentos (Bluebird lo permite como no-op): sustituir por nada, eliminar la llamada.
Si encuentras métodos de Bluebird que no sean .tap() durante esta auditoría (.tapCatch, .spread, .delay, .map, Promise.try, Promise.props, etc.), parar y reportar antes de continuar. El diagnóstico previo dice que solo se usa .tap(), pero confirmarlo durante el cambio.

1.3 Eliminar la mutación global
En packages/api/src/server.ts, eliminar la línea:
tsglobal.Promise = require('bluebird');
Y cualquier import o require de bluebird que quede en el archivo.
Verificar también que no haya mongoose.Promise = Bluebird en ningún sitio:
bashgrep -rn "mongoose.Promise" packages/api/src packages/models/src
Si aparece, eliminarlo. Mongoose usa Promises nativas hace años.
1.4 Limpiar packages/models
Como packages/models declara la dependencia pero no la usa:
bashpnpm --filter @soker90/finper-models remove bluebird @types/bluebird
Verificar que no quedan referencias:
bashgrep -rn "bluebird" packages/models
1.5 Eliminar Bluebird de packages/api
bashpnpm --filter @soker90/finper-api remove bluebird @types/bluebird
Verificar:
bashgrep -rn "bluebird" packages/api
Solo debería aparecer (si acaso) en pnpm-lock.yaml como dependencia transitiva de algo más; si aparece en código fuente, no está terminado el trabajo.
1.6 Verificación Fase 1
Ejecutar en orden, todo debe pasar:
bashpnpm install
make build-models
make build-api
make lint-api
make lint-models
make test-api
make test-models
Smoke test manual con make start-api:

GET /api/monit/health → 200
POST /api/auth/login con usuario existente → JWT
Un par de endpoints del módulo de cuentas y movimientos.

1.7 Commit Fase 1
Un único commit (o un PR autocontenido):
refactor: remove bluebird dependency, replace .tap() with native helper

- Add packages/api/src/utils/promise.ts with tap() helper
- Replace 135 occurrences of .tap() across 18 controllers
- Remove global.Promise = bluebird mutation from server.ts
- Remove bluebird dependency from packages/api and packages/models

No behavioral changes. All tests passing.
Punto de checkpoint: en este momento Bluebird está fuera del proyecto, el código sigue funcionando, y el estilo es el mismo. Si se decide parar aquí, el proyecto queda en estado consistente y publicable.

Fase 2 — Migración progresiva a async/await
Esta fase es opcional en el corto plazo pero recomendada. No se hace en la misma sesión que la Fase 1.
2.1 Preparar infraestructura compartida
Antes de migrar el primer controller, crear los utilities que se usarán en todos:
packages/api/src/lib/errors.ts:
tsexport class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: unknown) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}
packages/api/src/middlewares/async-handler.ts:
tsimport type { RequestHandler } from 'express';

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
packages/api/src/middlewares/error-handler.ts:
tsimport type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err instanceof Error && 'details' in err && err.details
        ? { details: err.details }
        : {}),
    });
  }

  // Mantener compatibilidad con el formato de error actual del proyecto.
  // Si el proyecto usa un logger (pino, winston), usarlo aquí.
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
Registrar el error handler en packages/api/src/app.ts (o donde se monten los routers) como último middleware, después de todas las rutas. No tocar nada más todavía: los controllers actuales no lanzan AppError aún, así que el error handler solo entrará en acción cuando se migren.
2.2 Estrategia de migración por módulo
Migrar controllers uno por uno, en este orden de menor a mayor complejidad (ajustar según el repo real):

auth (login, register, refresh) — relativamente aislado, fácil de validar.
accounts — CRUD simple.
categories — CRUD simple.
movements — más volumen pero patrón repetido.
budgets — incluye agregaciones.
subscriptions — recurrencias, lógica temporal.
loans — amortizaciones, lógica más compleja.
debts — similar a loans.
pension, supplies, properties, tickets, resto.

Un PR por módulo. Tests verdes antes de pasar al siguiente.
2.3 Patrón de migración de un controller
Antes (estilo Bluebird con helper tap):
tsexport const getAccount = (req: Request, res: Response) => {
  return Account.findById(req.params.id)
    .then(tap(acc => {
      if (!acc) throw new Error('Not found');
    }))
    .then(tap(acc => logger.info({ id: acc._id }, 'account found')))
    .then(acc => acc.loadMovements())
    .then(data => res.json(data))
    .catch(err => {
      logger.error(err);
      res.status(err.message === 'Not found' ? 404 : 500).json({ error: err.message });
    });
};
Después (async/await + error handler central):
tsexport const getAccount: RequestHandler = async (req, res) => {
  const acc = await Account.findById(req.params.id);
  if (!acc) throw new NotFoundError('Account');

  logger.info({ id: acc._id }, 'account found');

  const data = await acc.loadMovements();
  res.json(data);
};
Y en el router:
tsrouter.get('/:id', asyncHandler(getAccount));
Notar que:

El .catch() desaparece: lo absorbe asyncHandler → next(err) → errorHandler.
El if (!acc) throw new NotFoundError(...) sustituye a la comprobación manual con código de estado.
El try/catch no es necesario en el controller porque asyncHandler lo cubre.
Los logs siguen funcionando exactamente igual.
El formato de respuesta de error debe coincidir con el formato actual del proyecto. Antes de migrar el primer controller, inspeccionar cómo responde la API actual a errores 404, 400 y 500, y ajustar errorHandler para que produzca exactamente la misma forma. Esto es crítico: el cliente React consume estos errores.

2.4 Reglas durante Fase 2

Un módulo por PR. PR pequeño, revisable, reversible.
No cambiar firmas públicas. Si un controller exporta getAccount, sigue siendo getAccount.
No introducir capas nuevas (services, repositories) en esta fase. Eso es otro refactor. Solo cambiar la sintaxis interna del handler.
Tests del módulo antes y después. Si los tests no cubren bien, añadir tests de happy path mínimos antes de migrar (mejor cobertura que regresión silenciosa).
Si un controller tiene lógica compleja en el .then() chain: convertirla a async/await sin reordenar pasos. La equivalencia debe ser literal.
Si un controller usa Promise.all con tap, conservar el Promise.all, solo cambiar el estilo alrededor.

2.5 Cuando todos los controllers estén migrados
Eliminar el helper tap ya no usado:
bashgrep -rn "from.*utils/promise" packages/api/src
Si no hay imports, borrar packages/api/src/utils/promise.ts. Si quedan algunos imports residuales, terminar de migrar esos controllers antes de borrar.
2.6 Verificación Fase 2 (al final)
bashpnpm install
make build-models
make build-api
make lint-api
make test-api
make test-models
Smoke test manual completo: login, listar cuentas, crear movimiento, vista anual de finanzas, crear presupuesto, listar préstamos, ver suscripciones. Comparar respuestas (status code y body) contra una grabación previa a la Fase 2 si es posible.

Reglas globales (aplican a Fase 1 y Fase 2)

Comportamiento externo idéntico: mismos códigos HTTP, misma forma de JSON, mismos headers.
No mezclar este refactor con otros cambios. Si encuentras un bug o un olor a código, abrir issue, no arreglarlo en este PR.
Un commit por unidad lógica de cambio. Mensaje claro indicando qué se migró.
Si algo no encaja en la tabla de reemplazos (porque aparece un método de Bluebird que el diagnóstico no detectó), parar y reportar antes de improvisar.
Si los tests fallan después de un cambio mecánico, no parchear: revisar el cambio. Suele indicar que el .tap() original tenía un comportamiento específico (await implícito, throw, etc.) que se perdió.
Conservar el estilo de logging actual del proyecto. No introducir pino, winston u otro logger en este refactor, aunque sea tentador.

Salida esperada
Al final de Fase 1:

Cero dependencias de Bluebird en el monorepo.
Helper tap propio en utils/promise.ts.
135 invocaciones reemplazadas en 18 controllers.
Tests verdes, lint verde, smoke test OK.

Al final de Fase 2 (cuando se complete):

Cero usos del helper tap. Helper eliminado.
Controllers en estilo async/await consistente.
Error handler centralizado con clases de error tipadas.
Tests verdes, lint verde, smoke test OK.

Casos que requieren juicio (parar y consultar)
Si el agente encuentra alguno de estos, no improvisar: documentar y consultar antes de continuar.

Uso de Promise.map, Promise.props, Promise.try, .spread, .delay, .timeout, .reflect, .tapCatch u otros métodos Bluebird (el diagnóstico dice que no hay, pero verificar).
Controllers donde el .tap() actual modifica el valor (no debería, pero por si acaso): el tap correcto no muta el valor.
Controllers que dependan de que global.Promise === Bluebird para algo más allá de .tap(), como cancelación o configuración (Promise.config(...)).
Tests que mockeen Bluebird directamente.
Cualquier código que use instanceof Bluebird o compruebe tipo de promesa.

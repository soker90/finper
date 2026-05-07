# API CATALOG

Catálogo de endpoints REST de `@soker90/finper-api`. Base URL: `http://localhost:3008/api/`.

> Para convenciones (auth, errores, validación, controller pattern) ver [`packages/api/AGENTS.md`](../packages/api/AGENTS.md). Este doc es solo el listado.

- **Auth**: todas las rutas requieren `Authorization: Bearer <jwt>` excepto `POST /auth/login`, `POST /auth/register` y `GET /monit/health`.
- **Header válido**: el middleware `auth.middleware.ts` carga `req.user = username` (string).
- **Errores**: formato Boom (`{ statusCode, error, message }`) — ver `middlewares/handle-error.ts`.
- **Orden importa**: `/supplies/properties` y `/supplies/readings` se montan **antes** de `/supplies` en `server.ts:57-59`.

---

## Monit — `/api/monit`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Healthcheck. |

Routes: `monit.routes.ts`.

---

## Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/login` | No | Devuelve `{ token, user }`. |
| POST | `/register` | No | Crea usuario + login. |
| GET | `/me` | Sí | Datos del usuario autenticado. |

Routes: `auth.routes.ts`.

---

## Accounts — `/api/accounts`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear cuenta. |
| GET | `/` | Listar cuentas del usuario. |
| GET | `/:id` | Detalle. |
| PATCH | `/:id` | Editar (parcial). |
| POST | `/transfer` | Transferencia entre dos cuentas. |

Routes: `account.routes.ts`. Modelo: `Account`.

---

## Categories — `/api/categories`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear categoría (opcional `parent`). |
| GET | `/` | Listar plano. |
| GET | `/grouped` | Listar agrupado por padre. |
| PATCH | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |

Routes: `category.routes.ts`. Modelo: `Category`.

---

## Transactions — `/api/transactions`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear (auto-crea `Store` si no existe). |
| GET | `/` | Listar con filtros (query params). |
| PUT | `/:id` | Editar (reemplazo). |
| DELETE | `/:id` | Eliminar. |

Routes: `transaction.routes.ts`. Modelo: `Transaction`. Usa `transactionService` + `storeService`.

---

## Stores — `/api/stores`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar. (Sólo lectura; alta implícita vía `Transaction`.) |

Routes: `store.routes.ts`. Modelo: `Store`.

---

## Budgets — `/api/budgets`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar (filtros por año/mes vía query). |
| PATCH | `/:category/:year/:month` | Upsert del importe presupuestado. |
| POST | `/` | Copiar presupuestos entre periodos. |

Routes: `budget.routes.ts`. Modelo: `Budget`.

---

## Debts — `/api/debts`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear deuda. |
| GET | `/` | Listar todas. |
| GET | `/from/:from` | Listar por contraparte (`from`). |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |
| POST | `/:id/pay` | Registrar pago / cobro (ajusta saldo, puede generar transacción). |

Routes: `debt.routes.ts`. Modelo: `Debt`.

---

## Goals — `/api/goals`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear objetivo. |
| GET | `/` | Listar. |
| GET | `/:id` | Detalle. |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |
| POST | `/:id/fund` | Aportar a objetivo. |
| POST | `/:id/withdraw` | Retirar de objetivo. |

Routes: `goal.routes.ts`. Modelo: `Goal`.

---

## Loans — `/api/loans`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar préstamos. |
| POST | `/` | Crear préstamo (calcula `monthlyPayment` y `initialEstimatedCost`). |
| GET | `/:id` | Detalle con pagos y eventos. |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar (cascada en pagos/eventos según servicio). |
| POST | `/:id/pay` | Pago ordinario. |
| POST | `/:id/amortize` | Pago extraordinario (amortización). |
| POST | `/:id/events` | Añadir evento (cambio tipo/cuota). |
| POST | `/:id/simulate-payoff` | Simulador de pago puntual (reduce tiempo / reduce cuota). |
| PUT | `/:id/payments/:paymentId` | Editar pago. |
| DELETE | `/:id/payments/:paymentId` | Eliminar pago. |

Routes: `loan.routes.ts`. Modelos: `Loan`, `LoanPayment`, `LoanEvent`. Detalle algorítmico: [`docs/loan-module.md`](./loan-module.md).

---

## Subscriptions — `/api/subscriptions`

> Orden estricto: rutas estáticas (`/candidates*`) antes que dinámicas (`/:id*`) — `subscription.routes.ts:24`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear suscripción. |
| GET | `/` | Listar. |
| GET | `/candidates` | Listar candidatos (sugerencias tx ↔ sub). |
| POST | `/candidates/:id/assign` | Confirmar candidato → enlaza transacción. |
| POST | `/candidates/:id/dismiss` | Descartar candidato. |
| GET | `/:id/transactions` | Transacciones ya enlazadas a la suscripción. |
| GET | `/:id/matching-transactions` | Transacciones que matchean (sin enlazar aún). |
| POST | `/:id/link-transactions` | Enlazar batch de transacciones. |
| DELETE | `/:id/unlink-transactions/:transactionId` | Desvincular una transacción. |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |

Routes: `subscription.routes.ts`. Modelos: `Subscription`, `SubscriptionCandidate`. Detalle: [`docs/subscription-module.md`](./subscription-module.md).

---

## Supplies — `/api/supplies`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar agrupado por `Property`. |
| POST | `/` | Crear suministro. |
| PUT | `/:id` | Editar. |
| GET | `/:id/tariffs-comparison` | Comparar coste real vs tarifas alternativas. |
| DELETE | `/:id` | Eliminar. |

Routes: `supply.routes.ts`. Modelo: `Supply`. Service extra: `tariffsService`.

### Properties (sub-mount) — `/api/supplies/properties`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear propiedad. |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |

Routes: `property.routes.ts`. Modelo: `Property`. (No expone GET; el listado llega vía `/api/supplies`.)

### Supply Readings (sub-mount) — `/api/supplies/readings`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/supply/:supplyId` | Lecturas de un suministro. |
| POST | `/` | Crear lectura. |
| PUT | `/:id` | Editar. |
| DELETE | `/:id` | Eliminar. |

Routes: `supply-reading.routes.ts`. Modelo: `SupplyReading`.

---

## Stocks — `/api/stocks`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/summary` | Resumen agregado de cartera (calculado en runtime). |
| GET | `/` | Listar movimientos. |
| POST | `/` | Crear movimiento (buy/sell/dividend). |
| DELETE | `/:id` | Eliminar movimiento. |

Routes: `stock.routes.ts`. Modelo: `Stock`. **No** hay PUT.

---

## Pensions — `/api/pensions`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear snapshot mensual. |
| GET | `/` | Listar snapshots. |
| PUT | `/:id` | Editar. |

Routes: `pension.routes.ts`. Modelo: `Pension`. **No** hay DELETE.

---

## Tickets — `/api/tickets`

Integración externa (bot de tickets vía `TICKET_BOT_URL` / `TICKET_BOT_API_KEY`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar tickets pendientes de revisión. |
| PATCH | `/:id` | Marcar como revisado / actualizar. |
| DELETE | `/:id` | Eliminar. |

Routes: `ticket.routes.ts`. Sin modelo Mongoose propio (datos vienen del bot).

---

## Dashboard — `/api/dashboard`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stats` | Agregados para el home (saldos, totales mensuales, etc.). |

Routes: `dashboard.routes.ts`. Sin modelo propio; agrega de `Account`, `Transaction`, `Budget`.

---

## Inconsistencias conocidas

Documentadas para no propagar al añadir endpoints nuevos:

- **Verbo de edición**: PATCH (`accounts`, `categories`, `tickets`, `budgets`) vs PUT (`debts`, `goals`, `loans`, `subscriptions`, `transactions`, `pensions`, `properties`, `supplies`, `supply-readings`). **Para código nuevo**: PATCH si la edición es parcial, PUT si reemplaza el documento.
- **Status creación**: ver `packages/api/AGENTS.md` (algunos POST devuelven 200, otros 201).
- **Naming sub-recursos**: `/loans/:id/pay` vs `/loans/:id/amortize` (verbos) vs `/goals/:id/fund` y `/subscriptions/:id/link-transactions`. No hay un único estilo.
- **Sin DELETE**: `Pension` no se puede borrar vía API actual.
- **Sin PUT**: `Stock` solo permite create/delete (workaround: borrar y recrear).

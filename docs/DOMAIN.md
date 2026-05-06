# DOMAIN

Modelo de dominio de Finper. Mapa de entidades, relaciones y vocabulario.

> Source of truth: `packages/models/src/models/`. Toda referencia `file:line` apunta a la definición canónica.

---

## Entidades principales

| Modelo | Archivo | Refs FK | Multitenant | Notas |
|---|---|---|---|---|
| `User` | `users/index.ts:11` | — | (es el tenant) | `username` único de facto. Hook `pre('save')` encripta password. |
| `Account` | `accounts.ts:13` | — | `user` | Cuenta bancaria. `balance` con redondeo a 2 decimales (setter). `isActive` para soft-archive. |
| `Category` | `categories.ts:13` | `parent → Category` | `user` | Jerárquica (1 nivel típico). `type ∈ {income, expense, not_computable}`. |
| `Transaction` | `transactions.ts:14` | `category`, `account`, `store?`, `subscriptionId?` | `user` | Núcleo del sistema. `date: Number` (timestamp ms). `type` redundante con `category.type`. |
| `Store` | `stores.ts:11` | — | `user` | Comercio. Collation `es` strength 2 (case+accent insensitive). |
| `Budget` | `budgets.ts:13` | `category` | `user` | Presupuesto mensual por categoría. Índice único `(category, year, month, user)` (`budgets.ts:23`). |
| `Debt` | `debts.ts:18` | — | `user` | Deuda informal con tercero. `from` = nombre libre del tercero. `type ∈ {from, to}` (me deben / debo). |
| `Goal` | `goals.ts:39` | — | `user` | Objetivo de ahorro. `currentAmount` se modifica vía `/fund` y `/withdraw`. Color/icono enum cerrado. |
| `Loan` | `loans.ts:13` | `account`, `category` | `user` | Préstamo francés. `pendingAmount` se actualiza en cada pago. Detalle: [`loan-module.md`](./loan-module.md). |
| `LoanPayment` | `loan-payments.ts:18` | `loan` | `user` | Cuota. `type ∈ {ordinary, extraordinary}`. Genera transacción asociada. |
| `LoanEvent` | `loan-events.ts:13` | `loan` | `user` | Cambio de tipo de interés / cuota mensual con efecto desde `date`. |
| `Subscription` | `subscriptions.ts:13` | `categoryId`, `accountId` | `user` | Pago recurrente. `cycle` en meses (1..60). `nextPaymentDate` calculado. Detalle: [`subscription-module.md`](./subscription-module.md). |
| `SubscriptionCandidate` | `subscription-candidates.ts:13` | `transactionId`, `subscriptionIds[]` | `user` | Sugerencia de vinculación tx ↔ subscription. `timestamps.createdAt: true`. |
| `Stock` | `stocks.ts:21` | — | `user` | Movimiento de cartera. `type ∈ {buy, sell, dividend}`. Sin agregación persistida; el resumen se calcula en `/stocks/summary`. |
| `Pension` | `pensions.ts:18` | — | `user` | Snapshot mensual del plan de pensiones (aportaciones + valoración). |
| `Property` | `properties.ts:11` | — | `user` | Inmueble (vivienda). Padre de `Supply`. |
| `Supply` | `supplies.ts:24` | `propertyId` | `user` | Suministro (luz/agua/gas). Tarifas y potencias contratadas opcionales. |
| `SupplyReading` | `supply-readings.ts:14` | `supplyId` | `user` | Lectura/factura entre `startDate` y `endDate` (validador inline obliga `endDate > startDate`). |

---

## Relaciones

```
User (tenant, identificado por username)
 ├── Account ───────────────────┐
 ├── Category (self-ref parent) ┤
 ├── Store ─────────────────────┤
 ├── Transaction ───────────────┘ (refs account, category, store?, subscriptionId?)
 │
 ├── Budget ──→ Category
 ├── Debt
 ├── Goal
 │
 ├── Loan ──→ Account, Category
 │    ├── LoanPayment (1:N)
 │    └── LoanEvent   (1:N)
 │
 ├── Subscription ──→ Account, Category
 │    └── SubscriptionCandidate (1:N por transacción detectada)
 │
 ├── Stock
 ├── Pension
 │
 └── Property
      └── Supply (1:N)
           └── SupplyReading (1:N)
```

---

## Convenciones transversales

- **Multitenancy**: todo modelo (excepto `User`) lleva `user: string` (username, no ObjectId). Los services filtran por `{ user }` en cada query.
- **IDs internos**: `_id` de Mongoose. En la API se serializan como string. El cliente nunca los modifica.
- **Importes**: `Number` (no Decimal). Cuentas y goals redondean a 2 decimales con setter (`accounts.ts:18`, `goals.ts:48-49`). El resto **no** redondea automáticamente.
- **Fechas**: predomina `Number` (timestamp ms desde epoch). Excepciones: `goals.deadline: Date` y `subscriptionCandidate.createdAt: Date` (timestamps Mongoose). Para código nuevo: preferir `Number` por consistencia.
- **Enums**: definidos como `const X = {...} as const` + `type XType = typeof X[keyof typeof X]` (ver `transactions.ts:3-9`). Casing inconsistente entre modelos (UPPERCASE en `STOCK_TYPE`/`SUPPLY_TYPE`/`LOAN_PAYMENT`/`DEBT`, PascalCase en `TRANSACTION`). No bloquea, pero alinear nuevos al patrón UPPERCASE.
- **Naming FKs**: inconsistente. `transactions.account/category/store` (sin sufijo) vs `subscriptions.accountId/categoryId` y `supplies.propertyId` (con sufijo `Id`). Para código nuevo: `<entidad>Id`.
- **Índices explícitos**: solo `Budget` (único compuesto), `Loan` (`{user:1}`), `LoanPayment` (`{loan, user, date}`), `LoanEvent` (`{loan, user}`). El resto confía en `_id` y filtros aplicativos. Si una query nueva usa `{user, X}` con frecuencia, añadir índice.

---

## Tipos / enums clave (para validators y UI)

| Constante | Valores | Archivo |
|---|---|---|
| `TRANSACTION` | `expense`, `income`, `not_computable` | `transactions.ts:3` |
| `DEBT` | `from`, `to` | `debts.ts:3` |
| `LOAN_PAYMENT` | `ordinary`, `extraordinary` | `loan-payments.ts:3` |
| `STOCK_TYPE` | `buy`, `sell`, `dividend` | `stocks.ts:3` |
| `SUPPLY_TYPE` | `electricity`, `water`, `gas`, `other` | `supplies.ts:3` |
| `GOAL_COLORS` | 10 hex literales | `goals.ts:3` |
| `GOAL_ICONS` | 10 nombres Ant Design | `goals.ts:17` |

`Category.type` reutiliza `TransactionType` (`categories.ts:5`) — un cambio en `TRANSACTION` impacta a `Category` y a `Transaction` simultáneamente.

---

## Glosario

- **Cuota ordinaria** (`ordinary`): pago mensual programado del préstamo. Reduce `pendingAmount` en `principal`.
- **Cuota extraordinaria** / **amortización** (`extraordinary`): pago anticipado. Recalcula cuota o plazo según evento subsiguiente.
- **Loan event**: punto en el tiempo a partir del cual cambian `interestRate` y/o `monthlyPayment` (revisión Euribor, refinanciación). Ver `loan-module.md`.
- **Candidate**: transacción que el detector cree que podría corresponder a una o varias suscripciones. El usuario confirma (`assign`) o descarta (`dismiss`). Ver `subscription-module.md`.
- **Tariff comparison** (`/api/supplies/:id/tariffs-comparison`): proyecta lecturas existentes contra tarifas alternativas para estimar ahorro.
- **Pension snapshot**: una entrada `Pension` no es una aportación atómica sino la foto del plan en un momento (`employeeUnits`, `companyUnits`, `value`).
- **`not_computable`**: tipo de transacción que no entra en cálculos de income/expense (ej. traspasos internos, regularizaciones).
- **Transfer**: `POST /api/accounts/transfer` mueve saldo entre dos `Account` del mismo usuario. Implementación en `account.controller`/`account.service`.

---

## Cómo añadir una entidad nueva

1. Crear `packages/models/src/models/<entity>.ts` siguiendo el patrón canónico (ver [`packages/models/AGENTS.md`](../packages/models/AGENTS.md#patrón-canónico)).
2. Registrar en `packages/models/src/index.ts` (3 bloques: imports, document re-exports, `export {}`).
3. `make build-models` antes de tocar la API.
4. Crear modelo aguas arriba (service → controller → routes → registro en `server.ts`) siguiendo [`packages/api/AGENTS.md`](../packages/api/AGENTS.md#checklist-añadir-un-recurso-crud).
5. Si la entidad es navegable desde UI, añadir página/hooks/paths según [`packages/client/AGENTS.md`](../packages/client/AGENTS.md#checklist-añadir-una-página).

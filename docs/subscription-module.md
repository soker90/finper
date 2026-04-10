# Módulo de Suscripciones — Documentación Técnica

## Índice

1. [Visión general](#1-visión-general)
2. [Modelos de datos](#2-modelos-de-datos)
3. [Cálculos y fórmulas](#3-cálculos-y-fórmulas)
4. [Servicio (`subscription.service.ts`)](#4-servicio-subscriptionservicets)
5. [Servicio de candidatos (`subscription-candidate.service.ts`)](#5-servicio-de-candidatos-subscription-candidateservicets)
6. [Controlador (`subscription.controller.ts`)](#6-controlador-subscriptioncontrollerts)
7. [Rutas (`subscription.routes.ts`)](#7-rutas-subscriptionroutests)
8. [Validadores](#8-validadores)
9. [Decisiones arquitectónicas](#9-decisiones-arquitectónicas)

---

## 1. Visión general

El módulo gestiona suscripciones periódicas (Netflix, Spotify, servicios de cloud, etc.). Permite:

- Crear, editar y eliminar suscripciones con un ciclo de cobro configurable.
- Vincular transacciones existentes a una suscripción para calcular automáticamente la próxima fecha de pago.
- Desvincular transacciones y recalcular la fecha de pago resultante.
- Detectar automáticamente transacciones candidatas a ser pagos de una suscripción (mecanismo de sugerencia).
- Confirmar o descartar candidatos encontrados.

El campo `nextPaymentDate` es siempre **calculado**: nunca se persiste al crear la suscripción y se recalcula cada vez que se vincula o desvincula una transacción.

### Ficheros principales

```
packages/
├── models/src/models/
│   ├── subscriptions.ts              ← ISubscription, SubscriptionModel, SubscriptionCycle
│   └── subscription-candidates.ts   ← ISubscriptionCandidate, SubscriptionCandidateModel
└── api/src/
    ├── services/
    │   ├── subscription.service.ts           ← Lógica de negocio (11 métodos)
    │   └── subscription-candidate.service.ts ← Detección y gestión de candidatos (4 métodos)
    ├── controllers/subscription.controller.ts ← Handlers HTTP
    ├── routes/subscription.routes.ts          ← 11 rutas
    └── validators/subscription/               ← Validación de entradas
```

---

## 2. Modelos de datos

### 2.1 `ISubscription` — Suscripción

| Campo | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `name` | `string` | ✅ | — | Nombre descriptivo (ej. "Netflix") |
| `amount` | `number` | ✅ | — | Importe del cobro periódico |
| `currency` | `string` | ❌ | — | Código de moneda (ISO 4217); opcional |
| `cycle` | `SubscriptionCycle` | ✅ | — | Frecuencia de cobro (ver enum) |
| `nextPaymentDate` | `number \| null` | ❌ | `null` | Timestamp Unix (ms) del próximo pago estimado; `null` si no hay pagos registrados |
| `categoryId` | `ObjectId` | ✅ | — | Categoría de gasto (ref `Category`) |
| `accountId` | `ObjectId` | ✅ | — | Cuenta de cargo mensual (ref `Account`) |
| `logoUrl` | `string` | ❌ | — | URL del logotipo del servicio |
| `user` | `string` | ✅ | — | Username del propietario |

#### Enum `SubscriptionCycle`

```typescript
enum SubscriptionCycle {
  DAILY        = 'daily',
  WEEKLY       = 'weekly',
  MONTHLY      = 'monthly',
  QUARTERLY    = 'quarterly',
  SEMI_ANNUALLY = 'semi-annually',
  ANNUALLY     = 'annually',
}
```

### 2.2 `ISubscriptionCandidate` — Candidato

Registro temporal que relaciona una transacción reciente con las suscripciones que podrían corresponderle, pendiente de confirmación por el usuario.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `transactionId` | `ObjectId` | ✅ | Transacción detectada como posible pago (ref `Transaction`) |
| `subscriptionIds` | `ObjectId[]` | ✅ | Suscripciones candidatas coincidentes (ref `Subscription`) |
| `user` | `string` | ✅ | Username del propietario |
| `createdAt` | `Date` | auto | Timestamp de creación (Mongoose `timestamps`) |

---

## 3. Cálculos y fórmulas

Toda la lógica de fechas está en `subscription.service.ts`.

### 3.1 `advanceDate(timestamp, cycle)` — helper exportado

Dado un timestamp y un ciclo, devuelve el timestamp del siguiente período.

```typescript
const advanceDate = (timestamp: number, cycle: SubscriptionCycle): number => {
  const date = new Date(timestamp)
  switch (cycle) {
    case 'daily':         date.setDate(date.getDate() + 1);        break
    case 'weekly':        date.setDate(date.getDate() + 7);        break
    case 'monthly':       date.setMonth(date.getMonth() + 1);      break
    case 'quarterly':     date.setMonth(date.getMonth() + 3);      break
    case 'semi-annually': date.setMonth(date.getMonth() + 6);      break
    case 'annually':      date.setFullYear(date.getFullYear() + 1); break
  }
  return date.getTime()
}
```

**Comportamiento en casos borde:** se utiliza el overflow nativo de `Date` de JavaScript:

| Caso | Resultado |
|---|---|
| 31 enero + `monthly` | 3 de marzo (febrero no tiene día 31) |
| 29 febrero bisiesto + `annually` | 1 de marzo del año siguiente (si no es bisiesto) |

### 3.2 `recalculateNextPaymentDate(subscriptionId)`

```
lastTx = última transacción vinculada a la suscripción, ordenada por date DESC

nextPaymentDate = lastTx
  ? advanceDate(lastTx.date, subscription.cycle)
  : null
```

- Si hay transacciones vinculadas: proyecta un período completo desde la más reciente.
- Si no hay ninguna: `nextPaymentDate = null` (fecha desconocida).

Este recálculo se ejecuta automáticamente tras cada operación de `linkTransactions` y `unlinkTransaction`.

---

## 4. Servicio (`subscription.service.ts`)

Clase `SubscriptionService` instanciada como singleton en `services/index.ts`.

### 4.1 `getSubscriptions(user)`

- **Query:** `SubscriptionModel.find({ user }).populate(...).sort({ nextPaymentDate: 1 })`
- Popula `categoryId` (`name`) y `accountId` (`name`, `bank`).
- Ordena por `nextPaymentDate` ascendente — MongoDB coloca los documentos con `null` primero.

---

### 4.2 `getSubscription(id, user)`

- **Query:** `SubscriptionModel.findOne({ _id: id, user }).populate(...)`
- Mismos campos populados que `getSubscriptions`.
- Devuelve `null` si no existe o no pertenece al usuario.

---

### 4.3 `addSubscription(subscription)`

- Omite el campo `nextPaymentDate` antes de persistir (siempre empieza como `null`).
- El valor `null` proviene del `default` del schema de Mongoose.

---

### 4.4 `editSubscription(id, value)`

- `findByIdAndUpdate(id, value, { new: true })`
- Actualización parcial: solo los campos incluidos en `value`.
- Devuelve el documento actualizado (`new: true`); `null` si no existe.

---

### 4.5 `deleteSubscription(id)`

- `findByIdAndDelete(id)`.
- No lanza error si el id no existe.
- No elimina transacciones vinculadas ni revierte saldos.

---

### 4.6 `getActiveSubscriptions(user)`

- `SubscriptionModel.find({ user })` sin filtros adicionales.
- Devuelve todas las suscripciones del usuario (sin populate).
- Usado internamente por `detectCandidates`.

---

### 4.7 `getTransactionsBySubscription(id, user)`

- `TransactionModel.find({ subscriptionId: id, user }).populate(...).sort({ date: -1 })`
- Popula `category` (`name`) y `account` (`name`, `bank`).
- Solo transacciones del usuario indicado con ese `subscriptionId`.

---

### 4.8 `getMatchingTransactions(id, user)`

Busca transacciones sin vincular que encajen como posibles pagos de una suscripción.

**Criterios de búsqueda:**

```
user = usuario dado
category = subscription.categoryId     ← misma categoría
account  = subscription.accountId      ← misma cuenta
subscriptionId no existe en el documento ($exists: false)  ← aún no vinculada
```

- Ordena por `date DESC`.
- **Limita a 50 resultados** (`limit(50)`).
- Devuelve `[]` si la suscripción no existe para ese usuario.

---

### 4.9 `linkTransactions(id, transactionIds)`

1. `TransactionModel.updateMany({ _id: { $in: transactionIds } }, { $set: { subscriptionId: id } })`
2. Llama a `recalculateNextPaymentDate(id)`.

---

### 4.10 `unlinkTransaction(id, transactionId)`

1. `TransactionModel.updateOne({ _id: transactionId }, { $unset: { subscriptionId: '' } })`
2. Llama a `recalculateNextPaymentDate(id)`.

---

### 4.11 `recalculateNextPaymentDate(subscriptionId)`

Ver [sección 3.2](#32-recalculatenextpaymentdatesubscriptionid).

---

## 5. Servicio de candidatos (`subscription-candidate.service.ts`)

Clase `SubscriptionCandidateService` instanciada como singleton en `services/index.ts`.

### 5.1 `detectCandidates(transaction)`

Llamado en modo fire-and-forget tras crear una transacción (desde `transaction.service.ts`). No propaga errores al caller.

**Algoritmo:**

```
from = transaction.date − 7 días (ONE_WEEK_MS)
to   = transaction.date + 7 días

matchingSubscriptions = SubscriptionModel.find({
  user:           transaction.user,
  accountId:      transaction.account,
  categoryId:     transaction.category,
  nextPaymentDate: { $gte: from, $lte: to }
})

si matchingSubscriptions.length === 0 → salir

SubscriptionCandidateModel.create({
  transactionId:   transaction._id,
  subscriptionIds: ids de las suscripciones coincidentes,
  user:            transaction.user
})
```

**Ventana temporal:** ±7 días respecto a la fecha de la transacción. Solo detecta suscripciones cuyo `nextPaymentDate` calculado cae dentro de esa ventana.

---

### 5.2 `getCandidates(user)`

- `SubscriptionCandidateModel.find({ user }).populate(...).sort({ createdAt: -1 })`
- Popula `transactionId` con: `date`, `amount`, `category.name`, `account.name`, `account.bank`, `note`.
- Popula `subscriptionIds` con: `name`, `logoUrl`, `amount`, `cycle`, `nextPaymentDate`.
- Ordenados por creación más reciente primero.

---

### 5.3 `assignSubscription(candidateId, subscriptionId)`

El usuario confirma que una transacción es el pago de una suscripción concreta.

**Pasos:**
1. Obtener candidato; lanzar **404** si no existe.
2. `TransactionModel.findByIdAndUpdate(candidate.transactionId, { subscriptionId })` — vincula la transacción.
3. `subscriptionService.recalculateNextPaymentDate(subscriptionId)` (fire-and-forget).
4. `SubscriptionCandidateModel.findByIdAndDelete(candidateId)` — elimina el candidato.

---

### 5.4 `dismissCandidate(candidateId)`

El usuario descarta el candidato sin vincular ninguna transacción.

- `SubscriptionCandidateModel.findByIdAndDelete(candidateId)`.
- Lanza **404** si el candidato no existe.
- No modifica la transacción ni ninguna suscripción.

---

## 6. Controlador (`subscription.controller.ts`)

Los handlers usan cadenas `Promise.then().tap()`. Los errores se propagan a `next(err)` y son capturados por el middleware `handleError`.

| Método | Validación previa | Servicio | Código HTTP |
|---|---|---|---|
| `list` | — | `getSubscriptions` | 200 |
| `create` | `validateSubscriptionCreateParams` | `addSubscription` | 200 |
| `edit` | `validateSubscriptionEditParams` (incluye exist) | `editSubscription` | 200 |
| `delete` | `validateSubscriptionExist` | `deleteSubscription` | 204 |
| `getTransactions` | `validateSubscriptionExist` | `getTransactionsBySubscription` | 200 |
| `getMatchingTransactions` | — | `getMatchingTransactions` | 200 |
| `linkTransactions` | `validateSubscriptionExist`, `validateSubscriptionLinkParams` | `linkTransactions` | 204 |
| `unlinkTransaction` | `validateSubscriptionExist` | `unlinkTransaction` | 204 |
| `listCandidates` | — | `getCandidates` | 200 |
| `assignCandidate` | `validateCandidateExist` | `assignSubscription` | 204 |
| `dismissCandidate` | `validateCandidateExist` | `dismissCandidate` | 204 |

---

## 7. Rutas (`subscription.routes.ts`)

Base path: `/api/subscriptions`. Todas las rutas requieren autenticación JWT (`authMiddleware`).

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/` | Listar suscripciones del usuario (ordenadas por `nextPaymentDate` asc) |
| `POST` | `/` | Crear una suscripción |
| `PUT` | `/:id` | Editar datos de una suscripción |
| `DELETE` | `/:id` | Eliminar una suscripción |
| `GET` | `/:id/transactions` | Transacciones vinculadas a la suscripción |
| `GET` | `/:id/matching-transactions` | Transacciones candidatas a vincular (máx. 50) |
| `POST` | `/:id/link-transactions` | Vincular transacciones y recalcular `nextPaymentDate` |
| `DELETE` | `/:id/unlink-transactions/:transactionId` | Desvincular una transacción y recalcular `nextPaymentDate` |
| `GET` | `/candidates` | Listar candidatos del usuario |
| `POST` | `/candidates/:id/assign` | Confirmar candidato (vincula transacción a suscripción) |
| `POST` | `/candidates/:id/dismiss` | Descartar candidato |

**Nota de orden de rutas:** Las rutas estáticas `/candidates` y `/candidates/:id/*` se declaran antes de las dinámicas `/:id` para evitar que Express interprete `candidates` como un `:id`.

---

## 8. Validadores

Todos los validadores usan **Joi**. En caso de error lanzan `Boom.badData` → **HTTP 422**, salvo las comprobaciones de existencia que lanzan `Boom.notFound` → **HTTP 404**.

### 8.1 `validateSubscriptionExist`

Comprueba existencia Y propiedad:

```typescript
SubscriptionModel.exists({ _id: id, user })
```

Lanza **HTTP 404** si no existe o no pertenece al usuario.

---

### 8.2 `validateSubscriptionCreateParams`

Todos los campos obligatorios:

| Campo | Regla |
|---|---|
| `name` | string, requerido |
| `amount` | number, positivo, requerido |
| `cycle` | string, uno de `SubscriptionCycle`, requerido |
| `categoryId` | string, requerido; además valida existencia y propiedad vía `validateCategoryExist` |
| `accountId` | string, requerido; además valida existencia y propiedad vía `validateAccountExist` |
| `logoUrl` | string URI o cadena vacía, opcional |
| `user` | string, inyectado por `extractUser` |

---

### 8.3 `validateSubscriptionEditParams`

1. Llama a `validateSubscriptionExist` internamente.
2. Todos los campos opcionales:

| Campo | Regla |
|---|---|
| `name` | string |
| `amount` | number, positivo |
| `cycle` | string, uno de `SubscriptionCycle` |
| `categoryId` | string; si presente, valida existencia vía `validateCategoryExist` |
| `accountId` | string; si presente, valida existencia vía `validateAccountExist` |
| `logoUrl` | string URI o cadena vacía |

---

### 8.4 `validateSubscriptionLinkParams`

Para `POST /:id/link-transactions`:

```typescript
if (!Array.isArray(transactionIds) || transactionIds.length === 0)
  throw Boom.badData('transactionIds must be a non-empty array')
```

Lanza **HTTP 422** si `transactionIds` no es un array o está vacío.

---

### 8.5 `validateCandidateExist`

En `validators/subscription-candidate/`. Comprueba existencia Y propiedad del candidato:

```typescript
SubscriptionCandidateModel.exists({ _id: id, user })
```

Lanza **HTTP 404** si no existe o no pertenece al usuario.

---

## 9. Decisiones arquitectónicas

### 9.1 `nextPaymentDate` calculado, nunca introducido manualmente

Al crear una suscripción el campo `nextPaymentDate` siempre es `null`. El sistema no confía en la fecha que pudiera indicar el usuario; la calcula automáticamente a partir del último pago real registrado mediante `recalculateNextPaymentDate`. Esto garantiza coherencia entre los pagos vinculados y la fecha proyectada.

### 9.2 Vinculación bidireccional transacción ↔ suscripción

El vínculo se almacena en el documento `Transaction` mediante el campo `subscriptionId`. La suscripción no mantiene una lista de sus transacciones: las queries se hacen siempre por `{ subscriptionId: id }`. Esto evita arrays ilimitados en el documento de suscripción.

### 9.3 Detección de candidatos como proceso fire-and-forget

`detectCandidates` se invoca tras crear una transacción sin `await` y captura cualquier error internamente. El flujo principal de creación de transacciones nunca falla por un error en la detección. Esto desacopla el módulo de suscripciones del módulo de transacciones.

### 9.4 Ventana de detección de ±7 días

La detección de candidatos usa una ventana de una semana en cada dirección respecto a la fecha de la transacción. Si `nextPaymentDate` de la suscripción cae dentro de ese rango, la transacción se considera candidata. Esto tolera pequeñas desviaciones en la fecha real del cargo respecto a la fecha esperada.

### 9.5 Límite de 50 transacciones coincidentes

`getMatchingTransactions` limita la respuesta a 50 documentos para evitar cargas excesivas en usuarios con muchas transacciones sin vincular de la misma categoría y cuenta. Las más recientes tienen prioridad (`sort({ date: -1 })`).

### 9.6 Orden estático vs. dinámico en el router

Express evalúa las rutas del router en el orden en que se registran. Las rutas con segmentos estáticos (`/candidates`, `/candidates/:id/assign`) deben registrarse antes de la ruta genérica `/:id`; de lo contrario Express capturaría `candidates` como valor del parámetro `:id`.

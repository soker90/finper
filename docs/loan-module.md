# Módulo de Préstamos — Documentación Técnica

## Índice

1. [Visión general](#1-visión-general)
2. [Modelos de datos](#2-modelos-de-datos)
3. [Cálculos y fórmulas](#3-cálculos-y-fórmulas)
4. [Servicio (`loan.service.ts`)](#4-servicio-loanservicets)
5. [Controlador (`loan.controller.ts`)](#5-controlador-loancontrollerts)
6. [Rutas (`loan.routes.ts`)](#6-rutas-loanroutests)
7. [Validadores](#7-validadores)
8. [Decisiones arquitectónicas](#8-decisiones-arquitectónicas)

---

## 1. Visión general

El módulo gestiona préstamos personales con amortización francesa (cuota constante). Permite:

- Crear y editar préstamos.
- Registrar pagos **ordinarios** (cuotas mensuales) y **extraordinarios** (amortizaciones anticipadas de capital).
- Registrar **eventos** de cambio de tipo de interés o cuota (préstamos a tipo variable).
- Eliminar y editar pagos ya registrados, recalculando la cadena de amortización.
- Obtener el detalle completo del préstamo: histórico real + proyección futura + estadísticas de ahorro.

Cada pago ordinario o extraordinario genera automáticamente:
- Un movimiento en el saldo de la cuenta asociada.
- Una transacción de gasto en la categoría asociada.

### Ficheros principales

```
packages/
├── models/src/models/
│   ├── loans.ts                          ← ILoan, LoanModel
│   ├── loan-payments.ts                  ← ILoanPayment, LoanPaymentModel, LoanPaymentType
│   └── loan-events.ts                    ← ILoanEvent, LoanEventModel
└── api/src/
    ├── services/
    │   ├── loan.service.ts               ← Lógica de negocio (10 métodos)
    │   └── utils/
    │       └── calcLoanProjection.ts     ← Toda la matemática de amortización
    ├── controllers/loan.controller.ts    ← Handlers HTTP
    ├── routes/loan.routes.ts             ← 10 rutas
    └── validators/loan/                  ← Validación de entradas
```

---

## 2. Modelos de datos

### 2.1 `ILoan` — Préstamo

| Campo | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `name` | `string` | ✅ | — | Nombre descriptivo (ej. "Hipoteca") |
| `initialAmount` | `number` | ✅ | — | Capital inicial; nunca cambia |
| `pendingAmount` | `number` | ✅ | — | Capital pendiente actual; se decrementa en cada pago |
| `interestRate` | `number` | ✅ | — | TIN anual en porcentaje (ej. `3.5` = 3,5%) |
| `startDate` | `number` | ✅ | — | Timestamp Unix (ms) de la fecha de inicio |
| `monthlyPayment` | `number` | ✅ | — | Cuota mensual vigente |
| `initialEstimatedCost` | `number` | ✅ | — | Coste total proyectado en el momento de creación |
| `account` | `ObjectId` | ✅ | — | Cuenta de la que se descuentan los pagos |
| `category` | `ObjectId` | ✅ | — | Categoría de gasto para las transacciones generadas |
| `user` | `string` | ✅ | — | Username del propietario |

### 2.2 `ILoanPayment` — Pago

| Campo | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `loan` | `ObjectId` | ✅ | — | Referencia al préstamo |
| `date` | `number` | ✅ | — | Timestamp Unix (ms) del pago |
| `amount` | `number` | ✅ | — | Importe total pagado |
| `interest` | `number` | ✅ | `0` | Parte de intereses |
| `principal` | `number` | ✅ | — | Capital amortizado en este pago |
| `accumulatedPrincipal` | `number` | ✅ | — | Capital total amortizado hasta este pago (acumulado) |
| `pendingCapital` | `number` | ✅ | — | Capital pendiente tras este pago |
| `type` | `LoanPaymentType` | ✅ | `'ordinary'` | `'ordinary'` \| `'extraordinary'` |
| `user` | `string` | ✅ | — | Username del propietario |

#### Enum `LoanPaymentType`

```typescript
enum LoanPaymentType {
  ORDINARY      = 'ordinary',       // Cuota mensual ordinaria
  EXTRAORDINARY = 'extraordinary',  // Amortización anticipada de capital
}
```

### 2.3 `ILoanEvent` — Evento de cambio de condiciones

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `loan` | `ObjectId` | ✅ | Referencia al préstamo |
| `date` | `number` | ✅ | Timestamp Unix (ms) desde el que aplica el cambio |
| `newRate` | `number` | ✅ | Nuevo TIN anual (%) desde esta fecha |
| `newPayment` | `number` | ✅ | Nueva cuota mensual desde esta fecha |
| `user` | `string` | ✅ | Username del propietario |

Los eventos modelan renegociaciones de tipo variable (ej. Euribor + diferencial). Al añadir un evento, el préstamo actualiza inmediatamente `interestRate` y `monthlyPayment`.

---

## 3. Cálculos y fórmulas

Todos los cálculos están en `packages/api/src/services/utils/calcLoanProjection.ts`.

El redondeo estándar es a **2 decimales**:
```typescript
const round2 = (n: number) => Math.round(n * 100) / 100
```

### 3.1 Tasa mensual

```typescript
const monthlyRate = (annualRate: number): number => annualRate / 100 / 12
```

**Fórmula:**
```
r = TIN% / 100 / 12
```

Ejemplo: TIN 3,6% → r = 0,003

---

### 3.2 Cuota mensual — `calcMonthlyPayment(principal, annualRate, months)`

Implementa la **amortización francesa** (cuota constante):

```
C = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]
```

Donde:
- `C` = cuota mensual
- `P` = capital pendiente
- `r` = tasa mensual = TIN% / 100 / 12
- `n` = número de meses restantes

Caso especial (tasa cero): `C = P / n`

**Uso:** En `payExtraordinary` con modo `reduceQuota` para recalcular la nueva cuota reducida tras amortizar capital.

---

### 3.3 Meses restantes — `calcRemainingMonths(principal, annualRate, payment)`

Fórmula inversa de la amortización francesa:

```
n = ceil( -log(1 - P·r / C) / log(1 + r) )
```

Donde:
- `n` = meses restantes (redondeado hacia arriba)
- `P` = capital pendiente
- `r` = tasa mensual
- `C` = cuota mensual actual

**Caso especial:** Si `C ≤ P·r`, la cuota solo cubre intereses y nunca amortiza capital → devuelve `Infinity`.

**Uso:** En `payExtraordinary` modo `reduceQuota` — se calcula el plazo restante con la cuota actual y ese mismo plazo se usa para recalcular la nueva cuota sobre el capital reducido.

---

### 3.4 Proyección de pagos futuros — `projectLoanPayments(input)`

Genera todos los pagos futuros proyectados desde el estado actual del préstamo.

**Entrada:**
```typescript
{
  pendingAmount: number           // Capital pendiente actual
  interestRate: number            // TIN% actual
  monthlyPayment: number          // Cuota mensual actual
  lastOrdinaryPaymentDate: number // Fecha del último pago ordinario (o startDate - 1 mes)
  events: LoanEventInput[]        // Eventos futuros de cambio de condiciones
  startPeriod: number             // Número de período del primer registro proyectado
}
```

**Algoritmo:**

1. Inicializar: `pending = pendingAmount`, `rate = interestRate`, `payment = monthlyPayment`.
2. Filtrar y ordenar eventos por fecha.
3. Bucle mientras `pending > 0.009` y `period ≤ startPeriod + 600` (tope 50 años):
   - `nextDate = addOneMonth(lastDate)` — avanzar un mes.
   - Aplicar eventos cuya `date ≤ nextDate` (actualizar `rate` y `payment`).
   - `r = rate / 100 / 12`
   - `interestPart = round2(pending × r)` ← **intereses de este período**
   - `principalPart = round2(min(payment − interestPart, pending))` ← **capital; limitado al saldo**
   - `totalAmount = round2(interestPart + principalPart)`
   - `pending = round2(pending − principalPart)`
   - Añadir fila a la tabla.

**Observación clave:** Las amortizaciones extraordinarias no desplazan el calendario. La proyección siempre se ancla a fechas de pagos ordinarios.

---

### 3.5 Tabla de amortización completa — `buildAmortizationTable(...)`

Función principal exportada. Fusiona el histórico real con la proyección futura.

**Estructura de cada fila `AmortizationRow`:**

| Campo | Descripción |
|---|---|
| `_id` | Solo en filas reales (MongoDB ObjectId) |
| `period` | Posición secuencial (1-based) |
| `date` | Timestamp Unix (ms) |
| `amount` | Importe total del pago |
| `interest` | Parte de intereses |
| `principal` | Capital amortizado |
| `accumulatedPrincipal` | Capital total amortizado hasta esta fila |
| `pendingCapital` | Capital restante tras esta fila |
| `type` | `'ordinary'` \| `'extraordinary'` |
| `isProjected` | `false` = pago real, `true` = proyección |

**Algoritmo:**

1. Ordenar pagos reales por fecha ascendente.
2. Mapear a `AmortizationRow[]` con `isProjected: false`.
3. Encontrar el último pago ORDINARIO real.
4. **Ancla de proyección:**
   - Si existe un pago ordinario real: `lastOrdinaryDate = payment.date`
   - Si no hay pagos: `lastOrdinaryDate = subtractOneMonth(startDate)` → el primer pago proyectado caerá exactamente en `startDate`.
5. Determinar tasa/cuota vigente consultando el último evento anterior a la siguiente fecha proyectada.
6. Llamar a `projectLoanPayments` con `startPeriod = real.length + 1`.
7. Calcular `accumulatedPrincipal` de los proyectados: partiendo del acumulado del último pago real, sumar el `principal` de cada proyectado.
8. Devolver `[...filas reales, ...filas proyectadas]`.

---

## 4. Servicio (`loan.service.ts`)

Clase `LoanService` instanciada como singleton en `services/index.ts`.

### 4.1 `getLoans(user)`

- **Query:** `LoanModel.find({ user }).lean()`
- **Devuelve:** Array con todos los préstamos del usuario. Sin estadísticas ni tabla.

---

### 4.2 `getLoanDetail(id, user)`

Devuelve el préstamo completo con estadísticas y tabla de amortización.

**Pasos:**
1. Obtener préstamo, pagos (ordenados por fecha ASC) y eventos (ordenados por fecha ASC).
2. Determinar tasa/cuota actual: último evento o valores del préstamo.
3. Construir tabla de amortización con `buildAmortizationTable`.
4. Separar filas reales y proyectadas.
5. Calcular `LoanStats`:

| Estadística | Cálculo |
|---|---|
| `paidPrincipal` | `Σ real.principal` |
| `paidInterest` | `Σ real.interest` |
| `pendingPrincipal` | `loan.pendingAmount` (valor vivo en BD) |
| `estimatedPendingInterest` | `Σ proyectados.interest` |
| `totalCostToDate` | `Σ real.amount` |
| `estimatedTotalCost` | `totalCostToDate + Σ proyectados.amount` |
| `ordinaryPaymentsCount` | Número de filas reales con `type === 'ordinary'` |
| `extraordinaryPaymentsCount` | Número de filas reales con `type === 'extraordinary'` |
| `totalOrdinaryAmount` | `Σ ordinarios.amount` |
| `totalExtraordinaryAmount` | `Σ extraordinarios.amount` |
| `savedByExtraordinary` | `loan.initialEstimatedCost − estimatedTotalCost` |
| `estimatedEndDate` | Fecha de la última fila proyectada (o `null` si totalmente pagado) |
| `currentPayment` | Cuota del último evento o `loan.monthlyPayment` |
| `currentRate` | TIN del último evento o `loan.interestRate` |

**`savedByExtraordinary`:** Diferencia entre el coste total que se habría pagado sin amortizaciones anticipadas (calculado en el momento de crear el préstamo) y el coste total estimado actualmente. Positivo = ahorro real.

---

### 4.3 `createLoan(data)`

1. Fija `pendingAmount = initialAmount`.
2. Proyecta el préstamo sin pagos para calcular `initialEstimatedCost`:
   ```
   initialEstimatedCost = Σ(todos los pagos proyectados).amount
   ```
3. Persiste en MongoDB.

---

### 4.4 `editLoan(id, data)`

`findByIdAndUpdate` directo. No recalcula proyección ni estadísticas. Acepta cualquier subconjunto de campos del préstamo.

---

### 4.5 `deleteLoan(id)`

Elimina en paralelo (`Promise.all`):
- El préstamo.
- Todos sus pagos (`deleteMany`).
- Todos sus eventos (`deleteMany`).

No restaura saldos de cuenta ni elimina transacciones asociadas.

---

### 4.6 `payOrdinary(id, user, params?)`

Registra una cuota mensual ordinaria.

**Parámetros opcionales:** `date`, `amount` (importe override), `addMovement` (default `true`).

**Cálculo paso a paso:**

```
r = interestRate / 100 / 12

baseInterest  = round2(pendingAmount × r)
principalPart = round2(min(currentPayment − baseInterest, pendingAmount))

amount        = params.amount ?? round2(baseInterest + principalPart)
interestPart  = round2(amount − principalPart)

accumulatedPrincipal = lastPayment.accumulatedPrincipal + principalPart
pendingCapital       = pendingAmount − principalPart
```

**Efectos secundarios:**
- Actualiza `loan.pendingAmount = pendingCapital`.
- Si `addMovement: true`:
  - Descuenta `amount` del saldo de la cuenta.
  - Crea una transacción de gasto en la categoría del préstamo.

---

### 4.7 `payExtraordinary(id, amount, mode, user, addMovement?, date?)`

Registra una amortización anticipada de capital.

**`mode`:** `'reduceQuota'` | `'reduceTerm'`

**Cálculo paso a paso:**

```
1. Crear pago con interest = 0, principal = amount

2. pendingCapital = loan.pendingAmount − amount

3a. Modo reduceTerm:
    newPayment = currentPayment   (igual, plazo se acorta)

3b. Modo reduceQuota:
    n          = calcRemainingMonths(pendingCapital, currentRate, currentPayment)
    newPayment = calcMonthlyPayment(pendingCapital, currentRate, n)
    (mismos meses restantes, cuota menor)

4. Actualizar loan.pendingAmount = pendingCapital
             loan.monthlyPayment = newPayment
```

**Efectos secundarios** (igual que `payOrdinary` si `addMovement: true`).

#### Comparativa de modos

| Modo | Cuota mensual | Meses restantes |
|---|---|---|
| `reduceTerm` | Sin cambio | Disminuye |
| `reduceQuota` | Disminuye | Sin cambio |

---

### 4.8 `addEvent(loanId, data)`

1. Crea el registro `LoanEvent` con `{ ...data, loan: loanId }`.
2. Actualiza el préstamo: `interestRate = newRate`, `monthlyPayment = newPayment`.

El préstamo siempre refleja las condiciones vigentes. Los eventos son el historial inmutable.

---

### 4.9 `deletePayment(loanId, paymentId, user)`

Revierte un pago registrado.

**Pasos:**
1. Obtener pago y préstamo.
2. **Revertir descuento en cuenta:** `_deductFromAccount(accountId, -payment.amount)` (negativo = suma al saldo).
3. **Borrar transacción de gasto** solo para pagos ORDINARIOS: busca por `{ user, account, amount, date }`.
4. **Restaurar `pendingAmount`:** `$inc: { pendingAmount: payment.principal }` (solo el capital, no el interés).
5. Eliminar el registro del pago.

**Limitación:** No recalcula `accumulatedPrincipal`/`pendingCapital` en los pagos posteriores. Para recalcular la cadena completa, usar `editPayment`.

---

### 4.10 `editPayment(loanId, paymentId, data, user)`

Edita un pago existente y recalcula toda la cadena de amortización.

**`data`:** cualquier subconjunto de `{ date, amount, interest, principal, type }`.

**Pasos:**
1. Obtener pago y préstamo; capturar `originalAmount`, `originalDate`, `originalType`.
2. Aplicar los campos modificados al pago destino.
3. Obtener **todos** los pagos del préstamo ordenados por fecha.
4. **Recalcular cadena completa** (forward pass desde `loan.initialAmount`):
   ```
   accumulated = 0
   pending     = loan.initialAmount

   para cada pago en orden cronológico:
     accumulated = round2(accumulated + pago.principal)
     pending     = round2(pending − pago.principal)
     → actualizar accumulatedPrincipal y pendingCapital de este pago
   ```
5. Ejecutar `bulkWrite` para actualizar todos los pagos atómicamente.
6. Actualizar `loan.pendingAmount` al valor `pending` final.
7. Si el importe cambió: `_deductFromAccount(accountId, nuevoAmount − originalAmount)`.
8. Si el pago es/era ORDINARIO: actualizar la transacción asociada (importe y/o fecha).

---

### 4.11 `_deductFromAccount(accountId, amount)` (privado)

```
account.balance = roundNumber(account.balance − amount)
```

Pasar `amount` negativo suma dinero (usado al revertir pagos). `roundNumber` aplica `Math.round(n * 100) / 100`.

---

## 5. Controlador (`loan.controller.ts`)

Los handlers usan cadenas `Promise.then().tap()`. Los errores se propagan a `next(err)` y son capturados por el middleware `handleError`.

| Método | Validación previa | Servicio | Código HTTP |
|---|---|---|---|
| `list` | — | `getLoans` | 200 |
| `detail` | `validateLoanExist` | `getLoanDetail` | 200 |
| `create` | `validateLoanCreateParams` | `createLoan` | 201 |
| `edit` | `validateLoanEditParams` (incluye exist) | `editLoan` | 200 |
| `remove` | `validateLoanExist` | `deleteLoan` | 204 |
| `payOrdinary` | `validateLoanExist`, `validateLoanOrdinaryPaymentParams` | `payOrdinary` | 201 |
| `payExtraordinary` | `validateLoanExist`, `validateLoanPaymentParams` | `payExtraordinary` | 201 |
| `addEvent` | `validateLoanExist`, `validateLoanEventParams` | `addEvent` | 201 |
| `deletePayment` | `validateLoanExist` | `deletePayment` | 204 |
| `editPayment` | `validateLoanExist`, `validateLoanEditPaymentParams` | `editPayment` | 200 |

---

## 6. Rutas (`loan.routes.ts`)

Base path: `/api/loans`. Todas las rutas requieren autenticación JWT (`authMiddleware`).

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/` | Listar todos los préstamos del usuario |
| `POST` | `/` | Crear un préstamo |
| `GET` | `/:id` | Detalle completo (stats + tabla de amortización) |
| `PUT` | `/:id` | Editar datos del préstamo |
| `DELETE` | `/:id` | Eliminar préstamo (y todos sus pagos y eventos) |
| `POST` | `/:id/pay` | Registrar cuota ordinaria |
| `POST` | `/:id/amortize` | Registrar amortización anticipada |
| `POST` | `/:id/events` | Añadir evento de cambio de condiciones |
| `DELETE` | `/:id/payments/:paymentId` | Eliminar un pago |
| `PUT` | `/:id/payments/:paymentId` | Editar un pago |

---

## 7. Validadores

Todos los validadores usan **Joi**. En caso de error lanzan `Boom.badData` → **HTTP 422**.

### 7.1 `validateLoanExist`

Comprueba existencia Y propiedad:
```typescript
LoanModel.exists({ _id: id, user })
```
Lanza **HTTP 404** si no existe o no pertenece al usuario.

---

### 7.2 `validateLoanCreateParams`

Todos los campos obligatorios:

| Campo | Regla |
|---|---|
| `name` | string, requerido |
| `initialAmount` | number, positivo, requerido |
| `interestRate` | number, min 0, requerido |
| `startDate` | number, requerido |
| `monthlyPayment` | number, positivo, requerido |
| `account` | string, requerido |
| `category` | string, requerido |
| `user` | string, requerido (inyectado por `extractUser`) |

---

### 7.3 `validateLoanEditParams`

1. Llama a `validateLoanExist` internamente.
2. Todos los campos opcionales: `name`, `interestRate`, `startDate`, `monthlyPayment`, `account`, `category`.

---

### 7.4 `validateLoanOrdinaryPaymentParams`

Para `POST /:id/pay`. Ambos campos opcionales:
- `date`: number
- `amount`: number, positivo

---

### 7.5 `validateLoanPaymentParams`

Para `POST /:id/amortize`:

| Campo | Regla |
|---|---|
| `amount` | number, positivo, **requerido** |
| `mode` | string, `'reduceQuota'` \| `'reduceTerm'`, **requerido** |
| `date` | number, opcional |
| `addMovement` | boolean, opcional |

---

### 7.6 `validateLoanEventParams`

Para `POST /:id/events`:

| Campo | Regla |
|---|---|
| `date` | number, **requerido** |
| `newRate` | number, min 0, **requerido** |
| `newPayment` | number, positivo, **requerido** |
| `user` | string, **requerido** (inyectado por controller) |

---

### 7.7 `validateLoanEditPaymentParams`

Para `PUT /:id/payments/:paymentId`. Requiere al menos un campo editable:

```typescript
Joi.object({ date, amount, interest, principal, type, user, loan, paymentId })
  .or('date', 'amount', 'interest', 'principal', 'type')
```

Rechaza con 422 si solo vienen `user`/`paymentId` sin ningún campo editable.

---

## 8. Decisiones arquitectónicas

### 8.1 Sistema de amortización francesa

El sistema implementa la amortización francesa (cuota constante) en todos los préstamos:
- La cuota `C` permanece fija hasta que un evento de condiciones o una amortización extraordinaria con modo `reduceQuota` la cambia.
- Con cada pago, la proporción interés/capital cambia: al principio los intereses dominan; al final domina el capital.

### 8.2 Proyección anclada a pagos ordinarios

Las amortizaciones extraordinarias no desplazan el calendario de cuotas. La proyección futura siempre se ancla a la fecha del último pago ordinario. Un pago extraordinario el día 15 no mueve la siguiente cuota mensual.

### 8.3 `reduceQuota` vs `reduceTerm`

Al amortizar anticipadamente, el usuario elige:

| Modo | Cuota mensual | Plazo restante | Caso de uso |
|---|---|---|---|
| `reduceTerm` | Sin cambio | Disminuye | Quiero terminar antes |
| `reduceQuota` | Disminuye | Sin cambio | Quiero pagar menos cada mes |

En `reduceQuota`, la nueva cuota se calcula con: `n = calcRemainingMonths(...)`, `newPayment = calcMonthlyPayment(pendingCapital, rate, n)`. El plazo queda fijo; la cuota se reduce proporcionalmente.

### 8.4 Recalculo completo de cadena en `editPayment`

A diferencia de `deletePayment` (que solo ajusta `loan.pendingAmount`), `editPayment` hace un **forward pass completo**: recorre todos los pagos ordenados cronológicamente desde `initialAmount` y recalcula `accumulatedPrincipal` y `pendingCapital` para cada uno, usando `bulkWrite` para atomicidad.

### 8.5 `savedByExtraordinary`

```
savedByExtraordinary = initialEstimatedCost − estimatedTotalCost
```

- `initialEstimatedCost`: calculado al crear el préstamo, proyectando la amortización completa sin pagos extraordinarios.
- `estimatedTotalCost`: coste real hasta hoy + coste proyectado restante.

Un valor positivo indica el ahorro real en intereses conseguido gracias a las amortizaciones anticipadas.

### 8.6 Integración con transacciones

Los pagos (`payOrdinary`, `payExtraordinary`) con `addMovement: true` (comportamiento por defecto) generan automáticamente:
1. Un decremento en `account.balance`.
2. Una transacción de gasto vinculada a `loan.category`.

Al eliminar o editar un pago, estas operaciones se revierten/actualizan automáticamente.

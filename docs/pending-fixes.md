# Pendientes de corrección — branch `fix/api-hydrated-documents`

---

## Bugs críticos 🔴

### 1. `transaction.service.ts` L21-22, 83-106
**`accountId`/`categoryId` no mapean a campos reales de MongoDB**

La interfaz `ITransactionService.getTransactions` y la implementación usan `accountId` y `categoryId` como parámetros, pero el schema de MongoDB usa `account` y `category` (sin sufijo `Id`). El spread `...params` en el query de `TransactionModel.find(query)` envía los nombres incorrectos, y Mongoose los ignora silenciosamente → los filtros nunca funcionan.

```ts
// interfaz (L21-22) — nombres incorrectos:
accountId?: string,
categoryId?: string,

// implementación (L98) — spread directo al query:
...params  // envía { accountId, categoryId } → MongoDB los ignora
```

**Fix:** renombrar `accountId` → `account` y `categoryId` → `category` en la interfaz, la implementación y el controller que los lee del query string.

---

### 2. `transaction.service.ts` L33-35
**`findById` puede devolver `null` → crash en `.balance`**

```ts
const accountModel = await AccountModel.findById(account) as IAccount
await AccountModel.updateOne({ _id: account }, {
  balance: roundNumber(accountModel.balance + amount)  // crash si accountModel es null
})
```

El cast `as IAccount` elimina `null` en compilación pero no en runtime. Si la cuenta no existe, `accountModel.balance` lanza `TypeError` sin pasar por el manejador de errores de Boom → 500 genérico.

**Fix:** comprobar null antes de acceder a `.balance` y lanzar `Boom.notFound`.

---

### 3. `loan.service.ts` L294
**`await` faltante → retorna Promise en lugar del documento**

```ts
return leanDoc<ILoanPayment>(LoanPaymentModel.findById(paymentId).lean())
```

`leanDoc<T>` es solo un cast `as unknown as T` (no hace await). `LoanPaymentModel.findById(...).lean()` devuelve una Promise. El método `editPayment` retorna una Promise sin resolver casteada a `ILoanPayment` → el caller recibe un objeto Promise y cualquier acceso a sus campos devuelve `undefined`.

**Fix:** añadir `await` antes de `LoanPaymentModel.findById(paymentId).lean()`.

---

## Bugs altos 🟠

### 4. `stores.service.ts` L6, 34
**Tipo de retorno `IAccount[]` incorrecto**

```ts
// interfaz (L6):
getStores(user: string): Promise<IAccount[]>

// implementación (L34):
public async getStores (user: string): Promise<IAccount[]> {
  return StoreModel.find({ user }, '_id name')  // devuelve StoreDocument[]
}
```

`IAccount` es la interfaz del modelo de cuentas bancarias (tiene `name, bank, balance, isActive, user`). `IStore` solo tiene `name, user`. Son modelos completamente distintos.

**Fix:** cambiar el tipo de retorno a `Promise<StoreDocument[]>` en la interfaz y la implementación.

---

### 5. `loan.service.ts` L311
**`_getLoanWithRates` no chequea null**

```ts
leanDoc<ILoan & { _id: string }>(LoanModel.findOne({ _id: id, user }).lean()),
```

Si el préstamo no existe (ID incorrecto o usuario equivocado), `loan` será `null` y los accesos posteriores a `loan.pendingAmount`, `loan.interestRate`, `loan.account`, etc. en `getLoanDetail`, `payOrdinary` y `payExtraordinary` lanzarán `TypeError` no controlado.

**Fix:** tipar el resultado como `ILoan & { _id: string } | null`, chequear null y lanzar `Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output`.

---

### 6. `user.service.ts` L11
**`UserService` no declara `implements IUserService`**

```ts
export default class UserService {   // falta: implements IUserService
```

TypeScript no verifica que la clase cumple el contrato. Si se añade un método a `IUserService` y se olvida implementarlo, el compilador no lo detectará.

**Fix:** añadir `implements IUserService` a la declaración de la clase.

---

## Fixes de calidad 🟠

### 7. `stores.service.ts` L1
**`IAccount` importado innecesariamente**

Consecuencia directa del bug #4. Una vez corregido el tipo de retorno de `getStores`, `IAccount` deja de usarse y debe eliminarse del import.

```ts
import { IAccount, ITransaction, StoreModel, StoreDocument } from '@soker90/finper-models'
//       ^^^^^^^^ eliminar
```

---

### 8. `debt.service.ts` L19-77
**Métodos sin modificador `public`**

Todos los métodos de `DebtService` carecen de `public` explícito, siendo inconsistente con `AccountService` y `CategoryService` (también modificados en este branch) que sí lo usan en todos sus métodos.

```ts
// debt.service.ts (sin public):
async addDebt (debt: IDebt): Promise<DebtDocument> {

// account.service.ts (con public — patrón correcto):
public async addAccount (account: IAccount): Promise<AccountDocument> {
```

**Fix:** añadir `public` a `addDebt`, `editDebt`, `getDebts`, `getDebtsFrom`, `deleteDebt`.

---

### 9. `models/accounts.ts` L11 + `models/debts.ts` L18 + `models/stores.ts` L8 + `models/index.ts` L21, L24, L29
**`XxxDocument` definido dos veces: en el modelo individual Y redefinido en el barrel**

Los archivos de modelo individuales exportan el tipo:
```ts
// accounts.ts L11:
export type AccountDocument = HydratedDocument<IAccount>
```

Pero `index.ts` no importa ese tipo desde el modelo — lo **redefine** independientemente:
```ts
// index.ts L21 (no re-exporta, redefine):
export type AccountDocument = HydratedDocument<IAccount>
```

Dos fuentes de verdad paralelas para el mismo tipo. Si una cambia y la otra no, se desincronizarían sin error de compilación visible.

**Fix:** en `index.ts`, sustituir las redefiniciones por re-exports desde cada modelo:
```ts
export { AccountDocument } from './models/accounts'
export { DebtDocument } from './models/debts'
export { StoreDocument } from './models/stores'
// etc.
```
Y eliminar las definiciones duplicadas de los archivos de modelo individuales (o viceversa).

---

## Fixes menores 🟡

### 10. `account.controller.ts` L3-5
**Blank line extra dentro del bloque de imports**

```ts
import { IAccountService } from '../services/account.service'
                                    // ← línea en blanco no intencionada
import { AccountDocument } from '@soker90/finper-models'
```

El resto de controllers no tienen esta separación intermedia dentro del bloque de imports del mismo paquete.

**Fix:** eliminar la línea en blanco entre los dos imports.

---

### 11. `transaction.service.ts` L75
**Comentario en español en un archivo con el resto en inglés**

```ts
// Si era un pago de suscripción, recalcular la próxima fecha (fire-and-forget)
```

El archivo usa inglés para todos los demás comentarios (L46, etc.). El proyecto usa inglés como idioma de comentarios.

**Fix:** traducir a inglés.

---

## Resumen

| # | Archivo | Línea(s) | Severidad | Descripción |
|---|---------|----------|-----------|-------------|
| 1 | `transaction.service.ts` | L21-22, 83-106 | 🔴 Crítico | `accountId`/`categoryId` no coinciden con campos del schema |
| 2 | `transaction.service.ts` | L33-35 | 🔴 Crítico | `findById` sin chequeo de null → crash en `.balance` |
| 3 | `loan.service.ts` | L294 | 🔴 Crítico | `await` faltante en `leanDoc(findById(...).lean())` |
| 4 | `stores.service.ts` | L6, 34 | 🟠 Alto | Tipo de retorno `IAccount[]` incorrecto, debería ser `StoreDocument[]` |
| 5 | `loan.service.ts` | L311 | 🟠 Alto | `_getLoanWithRates` no chequea null del loan |
| 6 | `user.service.ts` | L11 | 🟠 Alto | `UserService` no declara `implements IUserService` |
| 7 | `stores.service.ts` | L1 | 🟠 Medio | `IAccount` importado sin uso real |
| 8 | `debt.service.ts` | L19-77 | 🟠 Medio | Métodos sin modificador `public` |
| 9 | `models/index.ts` + 3 modelos | varios | 🟠 Medio | `XxxDocument` definido dos veces |
| 10 | `account.controller.ts` | L3-5 | 🟡 Menor | Blank line extra en bloque de imports |
| 11 | `transaction.service.ts` | L75 | 🟡 Menor | Comentario en español en archivo en inglés |

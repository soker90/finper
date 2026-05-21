# Models patterns

Detalle operativo de `packages/models`. Cargar bajo demanda. Para reglas críticas y checklist, ver [`packages/models/AGENTS.md`](../packages/models/AGENTS.md).

---

## Estructura de `src/`

| Fichero / carpeta | Rol |
|---|---|
| `index.ts` | Barrel principal: imports → re-exports tipados → `connect` → default export. |
| `index.d.ts` | Solo `declare module '@soker90/finper-models';`. En `dist/` se sobrescribe por la `.d.ts` real. |
| `mongoose-connect.ts` | Wrapper sobre `mongoose.connect` con listeners (`connected`, `error`, `disconnected`, `SIGINT`). |
| `models/<entity>.ts` | Un fichero por modelo (kebab-plural). |
| `models/users/` | Único modelo con subdirectorio (incluye `hooks/encrypt-password-pre-save.ts`). |

---

## Contrato con la API

- API declara `"@soker90/finper-models": "workspace:*"` y consume `dist/index.js` + `dist/index.d.ts`.
- `files: ["/dist"]` — solo `dist/` se publica.
- `index.ts` re-exporta `mongoose` y `Types` para que la API **no importe `mongoose` directo**.
- Tras cambios: `make build-models`. Si lo olvidas, la API arrancará con el `dist/` viejo o fallará.

---

## Patrón canónico

`accounts.ts` referencia mínima y completa:

```ts
import { Schema, model, HydratedDocument } from 'mongoose'

export interface IAccount {
  name: string
  bank: string
  balance: number
  isActive: boolean
  user: string                                          // multitenancy
}

export type AccountDocument = HydratedDocument<IAccount>

const accountSchema = new Schema<IAccount>({
  name: { type: String, required: true },
  bank: { type: String, required: true },
  balance: { type: Number, default: 0, set: (n: number) => Math.round(n * 100) / 100 },
  isActive: { type: Boolean, default: true },
  user: { type: String, required: true }
}, { versionKey: false })

export const AccountModel = model<IAccount>('Account', accountSchema)
```

### Pasos al crear un modelo

| # | Paso | Notas |
|---|---|---|
| 1 | `import { Schema, model, HydratedDocument, Types } from 'mongoose'` | `Types` solo si hay refs. |
| 2 | Constantes enum `as const` + tipo derivado | Solo si hay enums. Ej. `transactions.ts:3-9`. |
| 3 | `interface I<Entity>` exportada | camelCase, `Types.ObjectId` para refs, `?` para opcionales. |
| 4 | `type <Entity>Document = HydratedDocument<I<Entity>>` | Exportada. |
| 5 | `new Schema<I<Entity>>({...}, { versionKey: false })` | `versionKey:false` siempre. |
| 6 | Refs `{ type: Schema.Types.ObjectId, ref: 'Entity', required: true }` | `'Entity'` singular PascalCase. |
| 7 | Campo `user: { type: String, required: true }` | Multitenancy obligatoria salvo en `users/`. |
| 8 | Setter de redondeo a 2 decimales en montos | Solo donde aplica (`accounts.balance`, `goals.targetAmount`). |
| 9 | `export const <Entity>Model = model<I<Entity>>('Entity', schema)` | Mongoose pluraliza la colección. |

---

## Convenciones

- **Naming de ficheros**: kebab-plural (`accounts.ts`, `loan-payments.ts`). Excepción `users/`.
- **Naming de exports**:
  - Interfaces: `I<Entity>` singular PascalCase.
  - Modelos: `<Entity>Model`.
  - Documents: `<Entity>Document`.
  - Nombre Mongoose (1er arg `model()`): singular PascalCase (`'Account'`).
  - Constantes enum: `SCREAMING_SNAKE_CASE` con `as const`.
  - Tipo derivado: PascalCase (`TransactionType`).
- **Multitenancy**: todo modelo (excepto `User`) lleva `user: string`.
- **Sin virtuals, methods ni statics**. Único hook: `users/hooks/encrypt-password-pre-save.ts:4-7` (bcrypt salt 10).
- **`versionKey: false`** en todos los schemas.
- **Re-export desde `index.ts`** en **3 sitios**:
  1. `import { I<E>, <E>Model } from './models/<entity>'` (líneas 7-24).
  2. `export type { <E>Document } from './models/<entity>'` (líneas 26-43).
  3. Bloque final `export { ... }` (líneas 63-121) con `I<E>`, `<E>Model` y enums.

---

## Tests

- Ubicación: `packages/models/test/`.
- `test/test-db.js` — `connect/close/clear` sobre `global.__MONGO_URI__`.
- `test/helpers/create-<entity>.ts` — factories con faker que devuelven el documento ya guardado.
- `test/models/<entity>.test.ts` — un test por modelo cuando existe.
- **Modelos sin test** (oportunidad, no bloqueante): `loans`, `loan-payments`, `loan-events`, `goals`, `subscriptions`, `subscription-candidates`, `stocks`.

```bash
make test-models
pnpm --filter @soker90/finper-models exec jest test/models/account.test.ts
make lint-models
pnpm --filter @soker90/finper-models exec tsc --noEmit
```

---

## Quirks (no propagar)

- **Fechas mezcladas**: la mayoría usa `Number` (timestamp). Solo `goals.deadline` y `subscription-candidates.createdAt` usan `Date`. Para nuevo: preferir `Number`.
- **Casing de claves enum inconsistente**: `TRANSACTION.Expense`, `STOCK_TYPE.Buy` (PascalCase) vs `LOAN_PAYMENT.ORDINARY`, `SUPPLY_TYPE.ELECTRICITY`, `DEBT.FROM` (SCREAMING). Para nuevo: SCREAMING.
- **Naming de FKs inconsistente**: `account` vs `accountId`. Para nuevo: preferir sin sufijo `Id`.
- **`strictNullChecks: false`** (`tsconfig.json:16`). Tests asumen `findOne()` no null sin chequear. No habilitar sin migración global.
- **`bluebird` en deps** pero no se importa. Posible eliminación.
- **Solo 4 modelos con índices explícitos** pese a que todos filtran por `user`:
  - `budgets.ts:21` — `{ category, year, month, user }` `unique: true`.
  - `loans.ts:31` — `{ user: 1 }`.
  - `loan-payments.ts:36` — `{ loan, user, date }`.
  - `loan-events.ts:21` — `{ loan, user }`.
  Para nuevo modelo con queries frecuentes por `user`: añadir índice.
- **Versiones con `^`** en `package.json` (mongoose, bcrypt, …). Contradice regla raíz; no añadir nuevas con `^` o `~`.
- **`tsconfig-build.json`** existe pero `build` invoca `tsc` plano (usa `tsconfig.json`). Probablemente obsoleto.

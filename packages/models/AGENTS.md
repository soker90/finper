# AGENTS — `@soker90/finper-models`

> Patrones detallados (estructura, plantilla canónica, convenciones, tests, ejemplos): [`docs/models-patterns.md`](../../docs/models-patterns.md).

**Crítico**: la API consume este paquete desde `dist/`, no desde `src/`. Cualquier cambio aquí requiere `make build-models` antes de arrancar o testear la API.

---

## Reglas críticas (rompen cosas si las ignoras)

1. **API consume `dist/`**. Olvidar `make build-models` → la API usa el `dist/` viejo o falla al importar.
2. **Multitenancy**: todo modelo (excepto `User`) lleva `user: string`. Los services filtran siempre por `{ user }`.
3. **`versionKey: false`** en todos los schemas. Nunca persistir `__v`.
4. **Sin virtuals, methods ni statics**. Único hook: `users/hooks/encrypt-password-pre-save.ts:4-7`.
5. **No importar `mongoose` directo desde la API**. `index.ts` re-exporta `mongoose` y `Types`; usar esos.
6. **Re-export en `index.ts` requiere actualizar 3 sitios** al añadir un modelo: imports (líneas 7-24), document re-exports (26-43), bloque final `export { ... }` (63-121).
7. **`strictNullChecks: false`** (`tsconfig.json:16`). No habilitar sin migración global; los tests asumen que `findOne()` no es null.

---

## Convenciones rápidas

- **Naming de ficheros**: kebab-plural (`accounts.ts`, `loan-payments.ts`). Excepción `users/`.
- **Exports**: `I<Entity>`, `<Entity>Model`, `<Entity>Document`. Nombre Mongoose: singular PascalCase.
- **Enums**: `SCREAMING_SNAKE_CASE` `as const` + `<Entity>Type` PascalCase derivado.
- **Refs**: `{ type: Schema.Types.ObjectId, ref: 'Entity', required: true }`.
- **Para código nuevo**: fechas como `Number` (timestamp), enums en SCREAMING, FKs sin sufijo `Id`. Ver quirks en [`docs/models-patterns.md`](../../docs/models-patterns.md#quirks-no-propagar).

---

## Checklist: añadir un modelo (`Foo`)

1. Crear `packages/models/src/models/foos.ts` siguiendo el patrón canónico ([`docs/models-patterns.md`](../../docs/models-patterns.md#patrón-canónico)).
2. Si tiene enum: `FOO_TYPE` `as const` + `FooType` derivado.
3. Actualizar `packages/models/src/index.ts` en **3 sitios**: import, `export type { FooDocument }`, bloque final `export { ... }`.
4. Considerar índice `{ user: 1, ... }` si las queries van a ser frecuentes (solo 4 modelos lo tienen hoy).
5. Factory `packages/models/test/helpers/create-foo.ts`.
6. Test `packages/models/test/models/foo.test.ts` (persistir + recuperar).
7. Verificar: build, tests, lint y typecheck del paquete (ver comandos en raíz). **`make build-models` antes de seguir.**
8. Solo después: importar `FooModel` desde `@soker90/finper-models` en la API.

---

## Comandos específicos

> Comandos genéricos (build, test, lint, typecheck) en el [`AGENTS.md` raíz](../../AGENTS.md#commands-use-make-not-raw-pnpm). Recordatorio: **`make build-models` es obligatorio antes de arrancar o testear la API**.

```bash
pnpm --filter @soker90/finper-models exec jest test/models/account.test.ts
```

# Auditoría de Mongoose

Este documento detalla todas las lógicas específicas de Mongoose (hooks, setters, getters, virtuals, methods, statics) encontradas en los modelos actuales de Finper. Es un **input obligatorio** para la Fase 3 de la migración a Drizzle/SQLite.

---

## Modelo: `users` (`packages/models/src/models/users/index.ts`)

### Hooks (pre/post)
- **[users/index.ts:16]** hook tipo `pre('save')`: Ejecuta la función `encryptPasswordPreSave`.
  - **Lógica:** Hashea la contraseña en texto plano antes de persistirla en la base de datos.

### Notas sobre migración a Drizzle
- **Acción (Fase 3):** Drizzle ORM no tiene hooks nativos en el esquema. La llamada a la función de encriptación debe moverse a la capa de servicio de la API (`packages/api/src/services/user.service.ts` o equivalente) **antes** de ejecutar `db.insert(users).values(...)`.

---

## Modelo: `goals` (`packages/models/src/models/goals.ts`)

### Setters / Getters
- **[goals.ts:44]** setter en campo `targetAmount`: `set: (num: number) => Math.round(num * 100) / 100`
- **[goals.ts:45]** setter en campo `currentAmount`: `set: (num: number) => Math.round(num * 100) / 100`
  - **Lógica:** Redondea automáticamente cualquier decimal entrante a dos decimales de precisión antes de guardarlo.

### Notas sobre migración a Drizzle
- **Acción (Fase 3):** Desaparece naturalmente. Al migrar los campos a `integer` (céntimos) en SQLite y pasar el valor por la función adaptadora `toCents(num)`, esta hará `Math.round(decimal * 100)`. El resultado matemático es idéntico al setter original, por lo que el redondeo está garantizado por diseño en la nueva arquitectura.

---

## Observaciones Generales (Aplicables a todos los modelos)

### Timestamps
- Varios modelos usan `createdAt` explícito, pero `subscription-candidates.ts` usa la opción automática de Mongoose `{ timestamps: { createdAt: true, updatedAt: false } }`.
- **Acción (Fase 1):** En Drizzle, todos los campos de fecha de creación deben declararse con el formato:
  `createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date())`

### Virtuals, Methods y Statics
- **Resultado de la auditoría:** No se han encontrado `virtuals`, `methods` de instancia, ni `statics` personalizados en ninguno de los 19 modelos Mongoose. La lógica de negocio parece estar concentrada correctamente en la capa de servicios de la API, lo que facilitará enormemente la migración (Fase 3).

### Indices
- Los índices compuestos y opciones `unique` detectados en Mongoose están documentados correctamente en el plan general de migración para replicarse usando las directivas `index()` y `uniqueIndex()` de `drizzle-orm/sqlite-core`.

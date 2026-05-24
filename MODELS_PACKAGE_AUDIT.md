# Auditoría del Paquete `@soker90/finper-models`

Documento generado en la Fase 0.5 para decidir el futuro del paquete `models` tras la migración a SQLite + Drizzle.

### 1. ¿Qué exporta `packages/models` exactamente?
Exporta cuatro tipos de elementos principales a través de su `index.ts`:
*   **Modelos de Mongoose:** `AccountModel`, `TransactionModel`, `UserModel`, etc.
*   **Interfaces de Documentos Mongoose:** `AccountDocument`, `TransactionDocument`, etc.
*   **Interfaces de Negocio (Tipos):** `IAccount`, `ITransaction`, `IUser`, etc.
*   **Enums/Constantes:** `TRANSACTION` (Income/Expense), `DEBT` (Pay/Receive), `FOO_TYPE`, etc.
*   **Exportaciones de utilidad:** Instancia de `mongoose` y `Types` (para ObjectIds).

### 2. ¿Quién consume cada export?
Tras analizar los paquetes del monorepo mediante `grep`:
*   **`packages/api`:** Consume MASIVAMENTE el paquete. Importa los modelos para las queries, las interfaces de negocio para el tipado estático, las constantes (Enums) para la validación (Joi) y `Types` para validar ObjectIds.
*   **`packages/client`:** **NO CONSUME NADA.** La búsqueda de `@soker90/finper-models` en el código del frontend ha devuelto cero resultados. Según `docs/ARCHITECTURE.md`, el cliente tiene sus propios tipos en `src/types/` y la frontera es estrictamente el JSON HTTP.

### 3. ¿Qué tests tiene y qué cubren?
Tiene tests ubicados en `test/models/*.test.ts`. Estos tests instancian los modelos Mongoose y comprueban persistencia, lecturas y constraints usando `@shelf/jest-mongodb` (Mongo en memoria). Son tests acoplados estrictamente al ORM actual.

### 4. Destino Final Propuesto: ELIMINACIÓN COMPLETA
Dado que el frontend (React) no depende de este paquete en absoluto, no estamos obligados a mantenerlo vivo como "paquete de tipos compartidos". La propuesta de migración es:
1. Durante la Fase 3, los módulos irán abandonando progresivamente `@soker90/finper-models` a favor de `@soker90/finper-db`.
2. Las interfaces base (`IAccount`, etc.) y las constantes (`TRANSACTION`) se definirán nativamente en `@soker90/finper-db` (inferidas desde los schemas Drizzle o extraídas explícitamente).
3. A medida que los módulos se migren en la API, se borrarán los archivos correspondientes en `packages/models/src/models/` y sus tests asociados en `packages/models/test/models/`.
4. Cuando el último módulo (Transactions/Dashboards) migre a Drizzle, el paquete `@soker90/finper-models` quedará vacío y **será borrado físicamente del monorepo** (incluyendo su desvinculación en `pnpm-workspace.yaml`).

Esto limpia la arquitectura, eliminando la duplicidad y dependencia pesada que había hasta ahora.

### 5. Notas Adicionales de la Fase 1
*   **`loan_histories`:** La colección `loan_histories` que aparecía en diseños antiguos de MongoDB ha sido deliberadamente purgada y no se ha migrado a SQLite, dado que representaba código muerto y no era consumida por ningún endpoint activo de la API.

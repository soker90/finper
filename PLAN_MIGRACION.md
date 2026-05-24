# Migración MongoDB → SQLite + Drizzle en Finper (Plan Definitivo v7)

## 📌 Contexto del proyecto
Repositorio: `soker90/finper` — monorepo pnpm con `api`, `models` y `client`.
Stack: Node 24+, pnpm 10, TypeScript, Jest. Tests actuales usan `@shelf/jest-mongodb`.

**Objetivo general**: Sustituir MongoDB por SQLite con `better-sqlite3` y Mongoose por `drizzle-orm`, superando la restricción de hardware (AVX en Mongo 5+). No se toca el cliente React ni se rompen los contratos HTTP.

---

## 🛠️ Decisiones técnicas finales
| Decisión | Valor |
|---|---|
| **Driver** | `better-sqlite3` con pragmas: `WAL`, `foreign_keys = ON`, `busy_timeout = 5000` |
| **ORM** | `drizzle-orm` + `drizzle-kit` |
| **IDs** | `TEXT PRIMARY KEY`, ObjectId hex de 24 caracteres preservado |
| **Generación de IDs** | `bson` library → `new ObjectId().toHexString()` en Node.js |
| **Validación de IDs API**| helper `isValidId` con regex `/^[0-9a-f]{24}$/i` |
| **Importes (Dinero/Tasas)** | `REAL` (IEEE 754). Helper `roundMoney` gestiona la precisión post-aritmética |
| **Enteros/Períodos** | `INTEGER` (ej: `year`, `month`, `cycle`) |
| **Tags** | Tabla N:M (`tags` + `transaction_tags`) |
| **Collation española** | `Intl.Collator('es')` en código de la API |
| **Cutover** | Big-bang, ventana < 1 minuto |

---

## 🚀 Fases de Ejecución

### Fase 0 — Parchear Mongo y Backups
1. Verificar parche CVE-2025-14847 (MongoBleed) en Mongo 4.4.30.
2. Subir Mongo a `4.4.30` en `docker-compose.yml`.
3. Backup binario y JSON (ejecutado manualmente).

### Fase 0.5 — Auditorías Previas (Completada)
- `MODELS_PACKAGE_AUDIT.md`: Destino de `packages/models` es la eliminación tras la migración completa.
- `NUMERIC_FIELDS_CLASSIFICATION.md`: Clasificación unificada de todos los campos con decimales a `REAL`.
- `MONGOOSE_AUDIT.md`: Control de hooks (`encryptPasswordPreSave`) y setters.

### Fase 1 — Crear paquete `packages/db`
1. Modificar `pnpm-workspace.yaml` para añadir `packages/db`.
2. Modificar el `Makefile` (build order: `models` → `db` → `api`, más comandos `build-db`).
3. Crear el paquete `@soker90/finper-db` y añadir la convención de monetarios en `README.md`.
4. Exportar los adaptadores (`generateId`, `isValidId`, `roundMoney`, `spanishCompare`).
5. Escribir los esquemas Drizzle basándose en `NUMERIC_FIELDS_CLASSIFICATION.md` (campos monetarios como `REAL`).
6. Generar las migraciones `.sql`.

### Fase 2 — Adaptación del Entorno de Tests
Reemplazar `@shelf/jest-mongodb` por SQLite `:memory:` en la config de Jest. Crear helper `createTestDb()` en `packages/api/test/helpers/db.ts`.

### Fase 3 — Migración Incremental y Repositorios
Se usará el **Patrón Repositorio** para abstraer Drizzle de los servicios.
1. **Captura de Snapshots HTTP:** Antes de migrar el primer módulo, capturar respuestas reales con `curl` (GET listado, GET detalle, POST creación, errores 404/400) de cada entidad. Guardar en `packages/api/test/snapshots/pre-migration/`. Cada módulo validará su output contra estos JSONs idénticos.
2. **Validación de IDs explícita:** En el **primer módulo (auth/users)**, se sustituirán *todas* las llamadas a `Types.ObjectId.isValid(id)` por `isValidId(id)` en todos los archivos `validate-*-exist.ts` de forma mecánica para toda la API. Esto evita bugs silenciosos.
3. **Mapeo explícito de Populate:** Cada query que anidaba objetos debe construirse manualmente con JOINs.
4. **Uso de `roundMoney`:** Aplicar helper `roundMoney` a resultados de agregaciones SQL y operaciones aritméticas.
5. **Orden de migración por acoplamiento:**
   - *Aislados:* debts, stocks, pensions, properties, supplies, supply_readings, goals.
   - *Base:* auth/users, stores, categories.
   - *Acoplados:* accounts, subscriptions, loans, loan_payments, loan_events.
   - *Críticos finales:* transactions + tags, budgets, dashboards.

### Fase 4 — Script de Migración de Datos y Validación
Script que lee de Mongo y escribe en SQLite. **SIN TRANSFORMACIÓN NUMÉRICA:** `doc.amount` se copia a `row.amount`. Validación con tolerancia `Math.abs(mongoSum - sqliteSum) < 0.01`. Si un ensayo falla, se borra la BD SQLite y se detiene la ejecución.

### Fase 5 — Infraestructura y Cutover
1. Eliminar servicio mongo/finperdb de `docker-compose.yml` (mantenerlo arrancado 7 días en servidor como rollback).
2. Añadir volumen local para `finper.db` en el contenedor de API y configurar `DATABASE_FILE`.
3. Parar API → Hacer `mongodump` fresco.
4. Ejecutar script Fase 4 → Validar conteos y sumas de importes.
5. Levantar API y hacer smoke test. Configurar cron con `cp` rotado para backups del `.db`.

---

## 🛑 Checkpoints Obligatorios
El agente se detendrá y esperará **aprobación humana** después de:
- **Fase 0.5**: (Ya superado). Revisar los tres documentos de auditoría.
- **Fase 1**: Revisar schemas, SQL generado, diff de workspace/Makefile.
- **Fase 2**: Verificar que el helper `createTestDb` funciona.
- **Cada módulo individual de Fase 3**: Un PR por módulo, sin agrupar. Validación contra snapshots.
- **Fase 4**: Revisar resultados de los ensayos del script antes del cutover.
- **Fase 5**: Validación post-cutover y confirmación de rollback de seguridad de 7 días.

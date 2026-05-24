Lectura del mapa
Volumen real (3.486 docs):

transactions: 2.960 docs (85% del total). El módulo crítico, todo lo demás es ruido en comparación.
loanpayments: 129 docs.
stores: 99 docs.
supplyreadings: 70 docs.
categories: 68 docs.
pensions: 47 docs.
stocks: 32 docs.
budgets: 25 docs.
subscriptions: 19 docs.
accounts: 17 docs.
loanevents: 9 docs.
supplies: 5 docs.
users: 2 docs.
loans: 2 docs.
properties: 2 docs.
debts, goals, loanhistories, subscriptioncandidates: 0 docs (colecciones declaradas pero vacías).

Observaciones que cambian el plan:

Eran 19 colecciones, hay 4 vacías. No las ignoramos (porque su schema existe y se usa en código), pero la migración de datos para ellas es trivial.
Aparecen 3 módulos que yo no había contemplado: goals, stocks, pensions. Bien, los añadimos al plan.
No existen las colecciones que yo asumí: ni tags como colección separada, ni transaction_tags, ni tickets. Los tags están como array embebido dentro de transactions (lo confirma el índice user_1_tags_1_type_1_date_1). Los tickets viven en el bot externo, no en esta BD.
Sí existe stores, que también te había mencionado y que tendrá su collation española como apuntó Sonnet.
Solo 5 colecciones tienen índices secundarios:

budgets: category_1_year_1_month_1_user_1
loanevents: loan_1_user_1
loanpayments: loan_1_user_1_date_1
loans: user_1
transactions: user_1_tags_1_type_1_date_1



Esto me da el mapa exacto de queries críticas que hay que mantener rápidas.
Decisión sobre los tags
Esto es importante y cambia lo que te puse en el plan anterior.
Los tags están como array embebido en transactions, y el índice compuesto user_1_tags_1_type_1_date_1 indica que se hacen queries del estilo "transacciones del usuario X que contienen el tag Y, de tipo Z, en rango de fechas". Eso es lo que probablemente alimenta getAvailableTags y getTagsSummary que mencionó Sonnet.
Tienes dos opciones en SQLite:
Opción A — Tags como array JSON en la columna tags de transactions.

Pro: traducción más fiel al modelo actual, menos cambios, queries de "transacciones con tag X" usan LIKE '%"X"%' o JSON1 (json_each).
Contra: no se puede indexar bien, las queries de tags son lentas si crecen.

Opción B — Tabla N:M transaction_tags (lo que propuso Sonnet y yo recogí).

Pro: modelo limpio, queries con JOIN, indexable.
Contra: más trabajo de migración, hay que partir el array en filas.

Mi recomendación: Opción B, pero con un matiz importante dado el volumen. Tienes 2.960 transactions con un número desconocido de tags por transaction. Aunque fueran 3 tags de media (probablemente menos), serían unas 9.000 filas en transaction_tags. Sigue siendo nada. El modelo relacional se paga en clarísima legibilidad de las queries.
Lista definitiva de tablas
Con el mapa real, las tablas que va a tener packages/db:
Tabla SQLiteOrigen MongoFilas hoyNotasusersusers2accountsaccounts17categoriescategories68transactionstransactions2.960El módulo gordotags(extraído de transactions.tags)~??Tabla nueva, derivadatransaction_tags(extraído de transactions.tags)~9.000 est.Tabla nueva N:Mbudgetsbudgets25subscriptionssubscriptions19subscription_candidatessubscriptioncandidates0Vacía hoyloansloans2loan_paymentsloanpayments129loan_eventsloanevents9loan_historiesloanhistories0Vacía hoydebtsdebts0Vacía hoygoalsgoals0Vacía hoystocksstocks32pensionspensions47storesstores99Ordenación con Intl.Collator('es')propertiesproperties2suppliessupplies5supply_readingssupplyreadings70
21 tablas SQLite a partir de 19 colecciones Mongo (las dos nuevas son tags + transaction_tags).
Índices a crear en Drizzle
Replicando lo que ya tienes en Mongo:
ts// transactions: el más importante
index('idx_transactions_user_type_date').on(
  transactions.userId,
  transactions.type,
  transactions.date,
)
// El tag va por la tabla N:M, no por aquí; mantener este índice cubre
// las queries de "transacciones del usuario X de tipo Y en rango Z"

// budgets
uniqueIndex('idx_budgets_user_category_year_month').on(
  budgets.userId,
  budgets.categoryId,
  budgets.year,
  budgets.month,
)
// Si el índice en Mongo era unique (mirar el código actual lo confirma),
// esto refleja "un solo presupuesto por categoría+mes+año por usuario"

// loan_payments
index('idx_loan_payments_loan_user_date').on(
  loanPayments.loanId,
  loanPayments.userId,
  loanPayments.date,
)

// loan_events
index('idx_loan_events_loan_user').on(
  loanEvents.loanId,
  loanEvents.userId,
)

// loans
index('idx_loans_user').on(loans.userId)
Y un par de índices que no están en Mongo pero conviene añadir por cómo funciona SQLite:
ts// Foreign keys: en SQLite, FK no implica índice. Conviene añadirlos
// manualmente en las columnas FK más consultadas:
index('idx_accounts_user').on(accounts.userId)
index('idx_categories_user').on(categories.userId)
index('idx_subscriptions_user').on(subscriptions.userId)
index('idx_pensions_user').on(pensions.userId)
index('idx_stocks_user').on(stocks.userId)
index('idx_supply_readings_supply').on(supplyReadings.supplyId)

// Para tags
uniqueIndex('idx_tags_user_name').on(tags.userId, tags.name)
index('idx_transaction_tags_tag').on(transactionTags.tagId)
// La PK compuesta (transaction_id, tag_id) ya cubre el otro sentido
Orden de migración por módulo (revisado)
Reorganizo el orden de la Fase 3 según el mapa real, de lo más simple a lo más complejo:

auth + users — base.
accounts — CRUD básico, 17 filas, sin agregaciones.
categories — CRUD, 68 filas, posible jerarquía padre-hijo.
stores — CRUD con ordenación española.
properties + supplies + supply_readings — bloque inmobiliario.
subscriptions + subscription_candidates — recurrencias.
stocks — inversiones.
pensions — datos planos.
goals — vacía, schema fácil.
debts — vacía, schema fácil.
budgets — primer caso con agregación (consumido por mes).
loans + loan_payments + loan_events + loan_histories — bloque de préstamos, amortizaciones.
transactions + tags + transaction_tags — el módulo gordo, último porque consume todas las FKs anteriores (accounts, categories, stores).

Justificación del orden: el último módulo en migrar es el que más dependencias tiene (transactions referencia accounts, categories, stores, y posiblemente más). Al dejarlo para el final, los módulos referenciados ya están en Drizzle y los IDs ya están establecidos.
Tiempo realista revisado
Con 3.486 documentos, 21 tablas, 5 índices secundarios reales:

Fase 0 (parchear + backups): 30 minutos.
Fase 1 (packages/db con schema + migraciones): 1 sesión de 4-6 horas.
Fase 2 (script migración + ensayos): 4-6 horas. Los ensayos duran segundos cada uno.
Fase 3 (13 módulos): 2-3 fines de semana en total. Los módulos pequeños (stores, properties, supplies, stocks, pensions) son 1-2 horas cada uno. Los grandes (budgets, loans, transactions) son una sesión cada uno.
Fase 4 (cutover + limpieza): 1 sesión de un domingo por la mañana. Downtime real: minutos.

Total: entre 3 y 4 fines de semana de trabajo concentrado. Si lo haces a ratos, 4-6 semanas calendario.
Lo que añadiría al prompt para el agente
Cuando le pases el plan al agente, mete este bloque al principio para que tenga los datos reales:
ESTADO ACTUAL DE LA BD:
- 19 colecciones Mongo, 3.486 documentos totales, ~1.7 MB.
- transactions es el 85% del volumen (2.960 docs).
- 4 colecciones vacías: debts, goals, loanhistories, subscriptioncandidates.
  Migrar igual (schema + tabla) aunque sin datos.
- 5 índices secundarios existentes en Mongo, replicar equivalentes en Drizzle.
- Los tags se modelan como tabla N:M (tags + transaction_tags),
  extraídos del array embebido transactions.tags.
- stores requiere ordenación española vía Intl.Collator('es') en código,
  no en SQL.
- IDs de Mongo se mapean a INTEGER autoincrement nuevos durante la
  migración; el cliente HTTP sigue viendo IDs como string.
- Importes en INTEGER de céntimos en BD; el cliente HTTP sigue viendo
  decimales.
Pregunta antes de pasar al prompt definitivo
Dos cosas que conviene confirmar para que el agente no improvise:Con esas dos confirmaciones te paso el prompt definitivo de la Fase 0 + Fase 1 listo para Gemini 2.5 Pro o el agente que prefieras.Has dicho: P: ¿Confirmas tags como tabla N:M, o prefieres mantenerlos como array JSON?P: ¿Confirmas tags como tabla N:M, o prefieres mantenerlos como array JSON?
R: Sí, segura, vamos con tabla N:M (tags + transaction_tags)P: El script de migración: ¿todo dentro de UNA transacción SQLite o sin transacción?
R: Una sola transacción envélvelo todo (más seguro, all-or-nothing)0:02Claude ha respondido: Perfecto, decisiones cerradas.Perfecto, decisiones cerradas. Aquí va el prompt definitivo para Fase 0 + Fase 1, listo para pegar al agente con acceso al repo.

Migración MongoDB → SQLite + Drizzle en Finper (Fase 0 + Fase 1)
Contexto del proyecto
Repositorio: soker90/finper — monorepo pnpm con:

packages/api — Express + TypeScript + Mongoose + Passport-JWT + Joi
packages/models — modelos Mongoose compartidos
packages/client — React + Vite (NO se toca en esta migración)

Stack: Node 24+, pnpm 10, TypeScript, Jest. Tests actuales usan @shelf/jest-mongodb.
Objetivo general (todas las fases)
Sustituir MongoDB por SQLite con better-sqlite3 y Mongoose por Drizzle ORM, sin tocar el cliente React ni romper los contratos HTTP existentes. Esta sesión cubre solo Fase 0 y Fase 1. Fases posteriores se ejecutarán en sesiones separadas.
Estado actual de la BD (datos reales, no inventados)

19 colecciones Mongo, 3.486 documentos totales, ~1.7 MB.
transactions es el 85% del volumen (2.960 docs).
4 colecciones vacías: debts, goals, loanhistories, subscriptioncandidates. Migrar igual (schema + tabla) aunque sin datos.
5 índices secundarios existentes en Mongo, replicar equivalentes en Drizzle:

transactions: user_1_tags_1_type_1_date_1
budgets: category_1_year_1_month_1_user_1
loanpayments: loan_1_user_1_date_1
loanevents: loan_1_user_1
loans: user_1


Los tags están como array embebido en transactions.tags en Mongo. Se modelan como tabla N:M en SQLite (tablas tags + transaction_tags), extrayendo el array.
stores requiere ordenación española vía Intl.Collator('es') en código de la API, no en SQL.

Decisiones técnicas cerradas (no debatir, no proponer alternativas)

Driver: better-sqlite3 (síncrono).
ORM: drizzle-orm + drizzle-kit.
Importes monetarios: INTEGER en céntimos en BD. La API debe convertir a decimales antes de devolver JSON al cliente, y de decimales a céntimos al recibir. El contrato HTTP no cambia: el cliente sigue viendo decimales como hasta ahora.
IDs: INTEGER PRIMARY KEY AUTOINCREMENT en SQLite. El contrato HTTP sigue exponiendo IDs como string: la API serializa String(id) antes de devolver JSON, y parsea Number(id) al recibir. El cliente no se entera.
Tags: tablas N:M tags + transaction_tags. NO usar array JSON ni columna serializada.
Collation española: en código de la API con Intl.Collator('es'), no en SQL. SQLite ordena binariamente o sin orden; el orden español se aplica en serialización.
Foreign keys: SQLite las desactiva por defecto; activar siempre con PRAGMA foreign_keys = ON en el cliente.
WAL mode: activar PRAGMA journal_mode = WAL para mejor concurrencia de lecturas.
Script de migración (Fase 2): todo envuelto en una sola transacción SQLite, all-or-nothing.

Mapa de tablas (definitivo)
21 tablas SQLite a partir de las 19 colecciones Mongo:
Tabla SQLiteOrigen MongoFilas hoyusersusers2accountsaccounts17categoriescategories68transactionstransactions2.960tags(extraído de transactions.tags)derivadatransaction_tags(extraído de transactions.tags)derivadabudgetsbudgets25subscriptionssubscriptions19subscription_candidatessubscriptioncandidates0loansloans2loan_paymentsloanpayments129loan_eventsloanevents9loan_historiesloanhistories0debtsdebts0goalsgoals0stocksstocks32pensionspensions47storesstores99propertiesproperties2suppliessupplies5supply_readingssupplyreadings70
Convenciones de naming

Tablas: snake_case plural en SQL (loan_payments).
Columnas: snake_case en SQL (user_id, amount_cents, created_at).
Drizzle schema TypeScript: camelCase en propiedades (userId, amountCents, createdAt), pero el primer argumento de cada columna sigue el nombre SQL snake_case.
Cualquier campo monetario en Mongo (amount, balance, principal, quantity, price, value, etc.) pasa a <nombre>Cents como integer.
Cualquier Date pasa a integer con mode: 'timestamp_ms'.
Cualquier campo opcional en Mongo (sin required: true) pasa a columna sin .notNull().
Cualquier campo required: true en Mongo pasa a .notNull() en Drizzle.


Fase 0 — Parchear Mongo y crear backups
0.1 Subir Mongo a 4.4.30
En docker-compose.yml, cambiar image: mongo:4.4 (o lo que sea) por image: mongo:4.4.30 para parchear MongoBleed (CVE-2025-14847).
bashdocker compose down
docker compose up -d
Verificar que la API arranca y GET /api/monit/health responde 200.
0.2 Backup binario completo
bash# Identificar nombre del contenedor Mongo desde docker-compose.yml (servicio "database")
CONTAINER=$(docker compose ps -q database)
DB_NAME=$(grep DATABASE_NAME .env | cut -d= -f2)

docker exec $CONTAINER mongodump --out /backup --db $DB_NAME
docker cp $CONTAINER:/backup ./mongo-backup-$(date +%Y%m%d)
0.3 Backup JSON por colección (auxiliar para depurar)
bashCOLS=$(docker exec $CONTAINER mongo $DB_NAME --quiet --eval 'db.getCollectionNames().forEach(c => print(c))')
mkdir -p ./mongo-export-$(date +%Y%m%d)
for col in $COLS; do
  docker exec $CONTAINER mongoexport --db $DB_NAME --collection $col --out /tmp/$col.json
  docker cp $CONTAINER:/tmp/$col.json ./mongo-export-$(date +%Y%m%d)/
done
0.4 Verificación Fase 0

API arranca contra Mongo 4.4.30 sin errores.
Las carpetas mongo-backup-* y mongo-export-* existen y contienen archivos.
Hacer commit del cambio en docker-compose.yml:

  chore: bump mongodb to 4.4.30 to patch MongoBleed CVE-2025-14847
Detener aquí y reportar antes de continuar con Fase 1.

Fase 1 — Crear paquete packages/db
1.1 Estructura de carpetas
Crear:
packages/db/
├── src/
│   ├── schema/
│   │   ├── users.ts
│   │   ├── accounts.ts
│   │   ├── categories.ts
│   │   ├── transactions.ts
│   │   ├── tags.ts
│   │   ├── transaction-tags.ts
│   │   ├── budgets.ts
│   │   ├── subscriptions.ts
│   │   ├── subscription-candidates.ts
│   │   ├── loans.ts
│   │   ├── loan-payments.ts
│   │   ├── loan-events.ts
│   │   ├── loan-histories.ts
│   │   ├── debts.ts
│   │   ├── goals.ts
│   │   ├── stocks.ts
│   │   ├── pensions.ts
│   │   ├── stores.ts
│   │   ├── properties.ts
│   │   ├── supplies.ts
│   │   ├── supply-readings.ts
│   │   └── index.ts
│   ├── client.ts
│   ├── adapters.ts
│   └── index.ts
├── drizzle/
├── drizzle.config.ts
├── package.json
└── tsconfig.json
1.2 package.json
json{
  "name": "@soker90/finper-db",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./adapters": "./dist/adapters.js"
  },
  "scripts": {
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "latest",
    "better-sqlite3": "latest"
  },
  "devDependencies": {
    "@types/better-sqlite3": "latest",
    "drizzle-kit": "latest",
    "typescript": "latest"
  }
}
Verificar las versiones más recientes estables en el momento de ejecución antes de instalar. Reemplazar latest por la versión concreta una vez instalado.
1.3 tsconfig.json
Heredar del tsconfig del workspace si existe. Si no:
json{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
1.4 drizzle.config.ts
tsimport { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_FILE ?? './finper.db',
  },
});
1.5 src/client.ts
tsimport Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

export function createDb(filePath: string) {
  const sqlite = new Database(filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type DB = ReturnType<typeof createDb>;
1.6 src/adapters.ts
ts/**
 * Convierte un importe decimal (12.34) a céntimos enteros (1234).
 */
export const toCents = (decimal: number): number => Math.round(decimal * 100);

/**
 * Convierte céntimos enteros (1234) a importe decimal (12.34).
 */
export const toDecimal = (cents: number): number => cents / 100;

/**
 * Convierte un id numérico interno a string para serialización HTTP.
 */
export const idToString = (id: number): string => String(id);

/**
 * Parsea un id de string a número interno. Lanza si no es válido.
 */
export const idFromString = (id: string): number => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid id: ${id}`);
  }
  return n;
};

/**
 * Ordenador para strings en español (eñes, acentos).
 * Uso: array.sort(spanishCompare) o array.sort((a,b) => spanishCompare(a.name, b.name))
 */
const collator = new Intl.Collator('es', { sensitivity: 'base' });
export const spanishCompare = (a: string, b: string): number => collator.compare(a, b);
1.7 src/schema/index.ts
Re-exporta todos los schemas:
tsexport * from './users.js';
export * from './accounts.js';
export * from './categories.js';
export * from './transactions.js';
export * from './tags.js';
export * from './transaction-tags.js';
export * from './budgets.js';
export * from './subscriptions.js';
export * from './subscription-candidates.js';
export * from './loans.js';
export * from './loan-payments.js';
export * from './loan-events.js';
export * from './loan-histories.js';
export * from './debts.js';
export * from './goals.js';
export * from './stocks.js';
export * from './pensions.js';
export * from './stores.js';
export * from './properties.js';
export * from './supplies.js';
export * from './supply-readings.js';
1.8 src/index.ts
tsexport * from './client.js';
export * as schema from './schema/index.js';
1.9 Schemas individuales
Paso obligatorio antes de escribir cualquier schema: leer packages/models/src íntegro para entender cada modelo Mongoose. Cada .ts de Mongoose se traduce a un .ts de Drizzle siguiendo las convenciones de naming definidas arriba.
Reglas para traducir Mongoose → Drizzle:
MongooseDrizzle SQLiteString, required: truetext('col').notNull()Stringtext('col')Number (importe)integer('col_cents').notNull() con conversión x100 al migrarNumber (entero)integer('col').notNull()Number (float no monetario, ej. ratios)real('col') — pero verificar caso por casoBooleaninteger('col', { mode: 'boolean' }).notNull()Dateinteger('col', { mode: 'timestamp_ms' })ObjectId, ref: 'X'integer('x_id').references(() => x.id)enum: [...]text('col', { enum: [...] }).notNull()Array de subdocumentostabla separada con FK al padreArray de primitivasdepende del caso, consultar
Ejemplos canónicos a usar como referencia. El agente debe escribir todos los demás siguiendo este patrón, no copiarlos a ciegas: cada schema necesita lectura del Mongoose origen.
schema/users.ts:
tsimport { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
schema/accounts.ts (revisar campos reales en Mongoose antes):
tsimport { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    // Resto de campos según Mongoose real
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: index('idx_accounts_user').on(t.userId),
  }),
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
schema/transactions.ts (módulo crítico, atención al índice):
tsimport { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';
import { accounts } from './accounts.js';
import { categories } from './categories.js';

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    accountId: integer('account_id').notNull().references(() => accounts.id),
    categoryId: integer('category_id').references(() => categories.id),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    amountCents: integer('amount_cents').notNull(),
    date: integer('date', { mode: 'timestamp_ms' }).notNull(),
    // Resto de campos según Mongoose real (note, storeId si existe, etc.)
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    // Reemplaza el índice de Mongo user_1_tags_1_type_1_date_1
    // El componente tags va en la tabla N:M; este índice cubre user+type+date
    userTypeDateIdx: index('idx_transactions_user_type_date').on(
      t.userId,
      t.type,
      t.date,
    ),
  }),
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
schema/tags.ts:
tsimport { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
  },
  (t) => ({
    userNameUnq: uniqueIndex('idx_tags_user_name').on(t.userId, t.name),
  }),
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
schema/transaction-tags.ts:
tsimport { sqliteTable, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { transactions } from './transactions.js';
import { tags } from './tags.js';

export const transactionTags = sqliteTable(
  'transaction_tags',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transactionId, t.tagId] }),
    tagIdx: index('idx_transaction_tags_tag').on(t.tagId),
  }),
);

export type TransactionTag = typeof transactionTags.$inferSelect;
schema/budgets.ts (atención al índice unique de Mongo):
tsimport { sqliteTable, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';
import { categories } from './categories.js';

export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    categoryId: integer('category_id').notNull().references(() => categories.id),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    amountCents: integer('amount_cents').notNull(),
  },
  (t) => ({
    // Mongo: category_1_year_1_month_1_user_1 (verificar en código si es unique)
    userCategoryYearMonthUnq: uniqueIndex(
      'idx_budgets_user_category_year_month',
    ).on(t.userId, t.categoryId, t.year, t.month),
  }),
);

export type Budget = typeof budgets.$inferSelect;
schema/loans.ts, schema/loan-payments.ts, schema/loan-events.ts: incluir los índices idx_loans_user, idx_loan_payments_loan_user_date, idx_loan_events_loan_user. Verificar campos reales contra Mongoose.
Resto de schemas: el agente los escribe inspeccionando uno a uno los modelos Mongoose en packages/models/src. Para cada uno, añadir índice en columnas FK si la columna aparece como filtro habitual (user_id casi siempre).
1.10 Generar migración inicial
bashpnpm --filter @soker90/finper-db install
pnpm --filter @soker90/finper-db build
pnpm --filter @soker90/finper-db db:generate
Esto debe generar packages/db/drizzle/0000_*.sql con el SQL CREATE TABLE de las 21 tablas.
Revisar el SQL generado manualmente antes de continuar:

21 CREATE TABLE presentes.
Foreign keys presentes en todas las columnas con .references(...).
Índices presentes y con los nombres esperados (idx_transactions_user_type_date, idx_budgets_user_category_year_month, etc.).
Columnas NOT NULL donde corresponde.
PRIMARY KEY AUTOINCREMENT en todas las tablas con id.
PRIMARY KEY compuesta en transaction_tags.

Si algo falta o sobra, ajustar el schema TypeScript y regenerar. No editar el SQL generado a mano.
Commitear el SQL generado en packages/db/drizzle/.
1.11 Verificación Fase 1
bashpnpm install
pnpm --filter @soker90/finper-db build
# Crear una BD local de prueba
DATABASE_FILE=./test-empty.db pnpm --filter @soker90/finper-db db:migrate
# Inspeccionar
sqlite3 ./test-empty.db ".schema"
sqlite3 ./test-empty.db ".tables"
Comprobar visualmente:

21 tablas listadas.
Cada CREATE TABLE tiene la forma esperada.
Foreign keys aparecen al final de cada tabla.

Borrar ./test-empty.db después de la inspección.
1.12 Añadir packages/db al workspace
Verificar que pnpm-workspace.yaml incluye packages/db (si usa packages/* ya está cubierto, si no añadirlo).
Verificar que pnpm install desde la raíz instala correctamente el nuevo paquete.
1.13 Commit final Fase 1
Un único commit (o PR autocontenido):
feat(db): add @soker90/finper-db package with Drizzle SQLite schema

- New packages/db with 21 tables mapping the current Mongo collections
- Indexes replicated from Mongo (5 secondary indexes + new FK indexes)
- Tags modeled as N:M (tags + transaction_tags) instead of embedded array
- Monetary fields stored as INTEGER cents
- IDs as INTEGER autoincrement
- Adapters for cents↔decimals, id string↔number, Spanish collation
- Initial migration generated and committed

No changes to packages/api or packages/models yet.

Reglas globales para esta sesión

Cliente React no se toca. Cero PRs en packages/client.
packages/api y packages/models no se tocan en Fase 1. Solo se crea packages/db.
Mongo sigue funcionando como hasta ahora durante todas las fases hasta el cutover (Fase 4).
Si aparece un modelo Mongoose con un patrón no contemplado (campos calculados, virtuals, hooks complejos, refs polimórficos, índices que no entiendes), parar y reportar antes de improvisar.
No instalar más dependencias que las listadas (drizzle-orm, drizzle-kit, better-sqlite3, @types/better-sqlite3). Si crees que necesitas algo más, preguntar.
No tocar tsconfig.json ni package.json raíz salvo lo estrictamente necesario.
Las versiones de las dependencias se eligen estables y recientes en el momento de la instalación. Documentar las versiones finales en el commit.

Salida esperada al final de la sesión

docker-compose.yml actualizado a mongo:4.4.30, app verificada arrancando contra esa versión.
Backups de Mongo en disco (mongo-backup-* y mongo-export-*), fuera del repo.
packages/db creado con:

21 schemas Drizzle en src/schema/.
client.ts con createDb() y pragmas correctos.
adapters.ts con conversiones céntimos↔decimales, ids, collation española.
drizzle.config.ts configurado.
Migración inicial generada en packages/db/drizzle/ y commiteada.


pnpm install limpio, pnpm --filter @soker90/finper-db build sin errores.
La BD SQLite vacía se puede crear con db:migrate y tiene la forma esperada (verificación de sqlite3 .schema).
Dos commits limpios (o un PR con dos commits): uno para Fase 0 (bump Mongo), otro para Fase 1 (packages/db).

Casos que requieren consulta antes de improvisar

Modelo Mongoose con discriminator o herencia.
Modelo Mongoose con virtuals que se usan desde controllers.
Modelo Mongoose con pre('save') o post('find') hooks que mutan datos.
Campos Mixed, Schema.Types.Any, o sin tipo explícito.
Refs polimórficos (refPath).
Cualquier colección con datos cuyo significado no es obvio al leer el código.
Índices en Mongo con opciones especiales (partialFilterExpression, sparse, expireAfterSeconds).

En cualquiera de estos casos, parar, documentar el caso, y preguntar antes de tomar decisión.

Empieza por la Fase 0 completa. Cuando esté verificada, continúa con la Fase 1. Reporta al final de cada fase con un resumen de qué se hizo, qué versiones se instalaron, y cualquier decisión que hayas tomado sobre casos ambiguos.

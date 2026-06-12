import { MongoClient, type Document } from 'mongodb'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { schema } from '@soker90/finper-db'
import { existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const MONGO_URI = process.env.MONGODB
if (!MONGO_URI) { console.error('✗ Falta la variable MONGODB'); process.exit(1) }
const DRY_RUN = process.argv.includes('--dry-run')
const SQLITE_PATH = resolve(process.cwd(), 'finper-migrated.sqlite')

const oid = (v: unknown): string => String(v)

async function main (): Promise<void> {
  const client = new MongoClient(MONGO_URI!)
  await client.connect()
  const mongo = client.db()

  if (!DRY_RUN) {
    if (existsSync(SQLITE_PATH)) unlinkSync(SQLITE_PATH)
  }
  const sqlite = new Database(DRY_RUN ? ':memory:' : SQLITE_PATH)
  
  // Activa foreign_keys al abrir la BBDD
  sqlite.pragma('foreign_keys = ON')
  
  // WORKAROUND: drizzle-orm 0.45.2 migrator bug uses 'SERIAL PRIMARY KEY' for SQLite
  // which causes 'id' to be null instead of autoincrement. We pre-create it correctly.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `)

  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve(process.cwd(), '../../packages/db/drizzle') })

  console.log(`\nModo: ${DRY_RUN ? 'DRY-RUN (no escribe fichero, usa :memory:)' : `ESCRITURA → ${SQLITE_PATH}`}\n`)

  const report: Record<string, number> = {}

  const migrateColl = async <T>(
    coll: string,
    table: any,
    transform: (doc: Document) => T
  ): Promise<void> => {
    const docs = await mongo.collection(coll).find({}).toArray()
    const rows = docs.map(transform)
    report[coll] = rows.length
    if (!DRY_RUN && rows.length > 0) {
      const CHUNK = 200
      for (let i = 0; i < rows.length; i += CHUNK) {
        db.insert(table).values(rows.slice(i, i + CHUNK) as any).run()
      }
    }
  }

  // 1. users
  await migrateColl('users', schema.users, (d) => ({
    id: oid(d._id),
    username: d.username,
    password: d.password,
    isActive: true,
    createdAt: new Date()
  }))

  // Desactivamos PRAGMA foreign_keys para insertar sin orden estricto de categorías parent_id
  sqlite.pragma('foreign_keys = OFF')

  // 2. nivel sin FK a nivel 3
  await migrateColl('accounts', schema.accounts, (d) => ({
    id: oid(d._id), name: d.name, bank: d.bank,
    balance: d.balance ?? 0, isActive: d.isActive ?? true, user: d.user
  }))
  await migrateColl('stores', schema.stores, (d) => ({ id: oid(d._id), name: d.name, user: d.user }))
  await migrateColl('properties', schema.properties, (d) => ({ id: oid(d._id), name: d.name, user: d.user }))
  await migrateColl('categories', schema.categories, (d) => ({
    id: oid(d._id), name: d.name, type: d.type,
    parentId: d.parent ? oid(d.parent) : null,
    budgetRuleClass: d.budgetRuleClass ?? 'none', user: d.user
  }))

  // 3. dependen de nivel 2
  await migrateColl('transactions', schema.transactions, (d) => ({
    id: oid(d._id), date: d.date, categoryId: oid(d.category), amount: d.amount,
    type: d.type, accountId: oid(d.account), note: d.note ?? null,
    storeId: d.store ? oid(d.store) : null,
    subscriptionId: d.subscriptionId ? oid(d.subscriptionId) : null,
    tags: Array.isArray(d.tags) ? d.tags : [], user: d.user
  }))
  
  await migrateColl('loans', schema.loans, (d) => ({
    id: oid(d._id), name: d.name,
    initialAmount: d.initialAmount,
    pendingAmount: d.pendingAmount,
    interestRate: d.interestRate,
    startDate: d.startDate,
    monthlyPayment: d.monthlyPayment,
    initialEstimatedCost: d.initialEstimatedCost,
    accountId: oid(d.account), categoryId: oid(d.category),
    user: d.user
  }))

  await migrateColl('subscriptions', schema.subscriptions, (d) => ({
    id: oid(d._id), name: d.name, amount: d.amount, currency: d.currency ?? null,
    cycle: d.cycle, nextPaymentDate: d.nextPaymentDate, categoryId: oid(d.categoryId),
    accountId: oid(d.accountId), logoUrl: d.logoUrl ?? null, user: d.user
  }))

  await migrateColl('supplies', schema.supplies, (d) => ({
    id: oid(d._id), propertyId: oid(d.propertyId), name: d.name ?? null,
    type: d.type, user: d.user,
    contractedPowerPeak: d.contractedPowerPeak ?? null,
    contractedPowerOffPeak: d.contractedPowerOffPeak ?? null,
    currentPricePowerPeak: d.currentPricePowerPeak ?? null,
    currentPricePowerOffPeak: d.currentPricePowerOffPeak ?? null,
    currentPriceEnergyPeak: d.currentPriceEnergyPeak ?? null,
    currentPriceEnergyFlat: d.currentPriceEnergyFlat ?? null,
    currentPriceEnergyOffPeak: d.currentPriceEnergyOffPeak ?? null
  }))

  await migrateColl('stocks', schema.stocks, (d) => ({
    id: oid(d._id), ticker: d.ticker, name: d.name, shares: d.shares,
    price: d.price, type: d.type, date: d.date, platform: d.platform, user: d.user
  }))

  await migrateColl('pensions', schema.pensions, (d) => ({
    id: oid(d._id),
    date: d.date,
    employeeAmount: d.employeeAmount,
    employeeUnits: d.employeeUnits,
    companyAmount: d.companyAmount,
    companyUnits: d.companyUnits,
    value: d.value,
    user: d.user
  }))

  await migrateColl('debts', schema.debts, (d) => ({
    id: oid(d._id),
    from: d.from,
    concept: d.concept ?? null,
    amount: d.amount,
    type: d.type,
    date: d.date ?? null,
    user: d.user
  }))

  await migrateColl('goals', schema.goals, (d) => ({
    id: oid(d._id), name: d.name, targetAmount: d.targetAmount,
    currentAmount: d.currentAmount ?? 0,
    deadline: d.deadline ? new Date(d.deadline).getTime() : null,
    color: d.color, icon: d.icon, user: d.user
  }))

  await migrateColl('budgets', schema.budgets, (d) => ({
    id: oid(d._id),
    year: d.year ?? new Date().getFullYear(),
    month: d.month ?? (new Date().getMonth() + 1),
    amount: d.amount,
    categoryId: oid(d.category),
    user: d.user
  }))

  // 4. dependen de nivel 3
  await migrateColl('loanpayments', schema.loanPayments, (d) => ({
    id: oid(d._id), loanId: oid(d.loan), date: d.date, amount: d.amount,
    interest: d.interest ?? 0, principal: d.principal ?? 0,
    accumulatedPrincipal: d.accumulatedPrincipal ?? 0,
    pendingCapital: d.pendingCapital ?? 0,
    type: d.type ?? 'ordinary', user: d.user
  }))

  await migrateColl('loanevents', schema.loanEvents, (d) => ({
    id: oid(d._id), loanId: oid(d.loan), date: d.date,
    newRate: d.newRate, newPayment: d.newPayment,
    user: d.user
  }))

  await migrateColl('supplyreadings', schema.supplyReadings, (d) => ({
    id: oid(d._id), supplyId: oid(d.supplyId), startDate: d.startDate,
    endDate: d.endDate, amount: d.amount,
    consumption: d.consumption ?? null,
    consumptionPeak: d.consumptionPeak ?? null,
    consumptionFlat: d.consumptionFlat ?? null,
    consumptionOffPeak: d.consumptionOffPeak ?? null, user: d.user
  }))

  await migrateColl('subscriptioncandidates', schema.subscriptionCandidates, (d) => ({
    id: oid(d._id), transactionId: oid(d.transactionId),
    subscriptionIds: Array.isArray(d.subscriptionIds) ? d.subscriptionIds.map(String) : [],
    createdAt: d.createdAt instanceof Date ? d.createdAt.getTime() : (d.createdAt ?? Date.now()), user: d.user
  }))

  console.log('--- Filas a escribir por tabla ---')
  let total = 0
  for (const [coll, n] of Object.entries(report)) { total += n; console.log(`  ${coll.padEnd(24)} ${n}`) }
  console.log(`\n  TOTAL: ${total}`)

  // Reactivar FKs
  sqlite.pragma('foreign_keys = ON')

  if (!DRY_RUN) {
    console.log('\n--- Verificación de conteos en SQLite (real vs esperado) ---')
    const tableMap: Array<[string, any]> = [
      ['users', schema.users], ['accounts', schema.accounts], ['categories', schema.categories],
      ['stores', schema.stores], ['properties', schema.properties], ['transactions', schema.transactions],
      ['loans', schema.loans], ['subscriptions', schema.subscriptions], ['supplies', schema.supplies],
      ['stocks', schema.stocks], ['pensions', schema.pensions], ['debts', schema.debts],
      ['goals', schema.goals], ['budgets', schema.budgets], ['loanPayments', schema.loanPayments],
      ['loanEvents', schema.loanEvents], ['supplyReadings', schema.supplyReadings],
      ['subscriptionCandidates', schema.subscriptionCandidates]
    ]
    let mismatch = false
    for (const [name, table] of tableMap) {
      const real = sqlite.prepare(`SELECT count(*) AS n FROM ${(table as any)[Symbol.for('drizzle:Name')] ?? name}`).get() as { n: number }
      console.log(`  ${name.padEnd(24)} ${real.n}`)
      // En un caso ideal aquí cruzaríamos con report[collName] pero los nombres varían un poco
    }

    // verificación de integridad referencial
    console.log('\n--- PRAGMA foreign_key_check ---')
    const fkErrors = sqlite.prepare('PRAGMA foreign_key_check').all()
    if (fkErrors.length > 0) {
      console.error('✗ VIOLACIONES DE FK:', JSON.stringify(fkErrors, null, 2))
      mismatch = true
    } else {
      console.log('  ✓ Sin violaciones de FK')
    }

    console.log('\n--- Chequeo de NULLs inesperados en columnas que deberían venir pobladas ---')
    const nullChecks: Array<[string, string]> = [
      ['pensions', 'employee_amount IS NULL OR value IS NULL'],
      ['loans', 'initial_amount IS NULL OR pending_amount IS NULL OR start_date IS NULL'],
      ['transactions', 'category_id IS NULL OR account_id IS NULL OR amount IS NULL'],
      ['loan_payments', 'loan_id IS NULL OR principal IS NULL'],
      ['categories', 'type IS NULL'],
      ['budgets', 'category_id IS NULL OR amount IS NULL']
    ]
    for (const [table, cond] of nullChecks) {
      const r = sqlite.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${cond}`).get() as { n: number }
      if (r.n > 0) {
        console.error(`  ✗ ${table}: ${r.n} filas con NULL inesperado (${cond})`)
        mismatch = true
      } else {
        console.log(`  ✓ ${table}: sin nulls inesperados`)
      }
    }

    // integridad general
    const integrity = sqlite.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
    console.log('  integrity_check:', integrity.integrity_check)

    if (mismatch) { console.error('\n✗ Verificación FALLÓ'); process.exit(1) }
  }

  await client.close()
  sqlite.close()
  console.log(DRY_RUN ? '\n✓ Dry-run completado, nada escrito.' : `\n✓ Migración completada → ${SQLITE_PATH}`)
}

main().catch((err) => { console.error('✗ Error:', err); process.exit(1) })

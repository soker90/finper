/**
 * seed.mjs — puebla la base de datos con datos de prueba realistas
 *
 * Uso: pnpm --filter @soker90/finper-api exec node ../../scripts/seed.mjs <username>
 *
 * Crea para el usuario indicado:
 *   - 4 cuentas bancarias
 *   - Categorías padre e hijas (gastos + ingresos)
 *   - Tiendas
 *   - Transacciones de los últimos 6 meses (ingresos + gastos variados)
 *   - Presupuestos del mes actual
 *   - 1 préstamo hipotecario activo
 *   - Plan de pensiones con 12 aportaciones
 *   - 2 deudas (1 que debes, 1 que te deben)
 *   - 2 acciones en cartera
 */

// Uso: pnpm --filter @soker90/finper-api exec node ../../scripts/seed.mjs <username>
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Mongoose vive en packages/models/node_modules — usamos su package.json como anchor
const require = createRequire(join(__dirname, '../packages/models/package.json'))
const mongoose = require('mongoose')

// ── Parámetro username ────────────────────────────────────────────────────────
const username = process.argv[2]
if (!username) {
  console.error('Error: debes indicar el username como argumento.')
  console.error('  Uso: node scripts/seed.mjs <username>')
  process.exit(1)
}

const MONGO_URI = 'mongodb://fi34r4t:uQ018HJHGJSDKMK7876@localhost:27017/finper?authSource=admin'

// ── Helpers ───────────────────────────────────────────────────────────────────
const d = (year, month, day) => new Date(year, month - 1, day).getTime()
const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Schemas inline (mirrors of @soker90/finper-models) ───────────────────────
const UserSchema = new mongoose.Schema({
  username: String, password: String
}, { versionKey: false })

const AccountSchema = new mongoose.Schema({
  name: String, bank: String,
  balance: { type: Number, set: n => Math.round(n * 100) / 100 },
  isActive: { type: Boolean, default: true }, user: String
}, { versionKey: false })

const CategorySchema = new mongoose.Schema({
  name: String, type: String, parent: mongoose.Schema.Types.ObjectId,
  user: String, isSystem: { type: Boolean, default: false }
}, { versionKey: false })

const StoreSchema = new mongoose.Schema({
  name: String, user: String
}, { versionKey: false })

const TransactionSchema = new mongoose.Schema({
  date: Number, amount: Number, type: String,
  category: mongoose.Schema.Types.ObjectId,
  account: mongoose.Schema.Types.ObjectId,
  store: mongoose.Schema.Types.ObjectId,
  note: String, user: String
}, { versionKey: false })

const BudgetSchema = new mongoose.Schema({
  category: mongoose.Schema.Types.ObjectId,
  year: Number, month: Number, amount: Number, user: String
}, { versionKey: false })

const LoanSchema = new mongoose.Schema({
  name: String, initialAmount: Number, pendingAmount: Number,
  interestRate: Number, startDate: Number,
  monthlyPayment: Number, initialEstimatedCost: Number,
  account: mongoose.Schema.Types.ObjectId,
  category: mongoose.Schema.Types.ObjectId,
  user: String
}, { versionKey: false })

const PensionSchema = new mongoose.Schema({
  date: Number, employeeAmount: Number, employeeUnits: Number,
  companyAmount: Number, companyUnits: Number, value: Number, user: String
}, { versionKey: false })

const DebtSchema = new mongoose.Schema({
  from: String, concept: String, amount: Number,
  type: String, date: Number, user: String
}, { versionKey: false })

const StockSchema = new mongoose.Schema({
  ticker: String, name: String, shares: Number,
  price: Number, type: String, date: Number,
  platform: String, user: String
}, { versionKey: false })

const User = mongoose.model('User', UserSchema)
const Account = mongoose.model('Account', AccountSchema)
const Category = mongoose.model('Category', CategorySchema)
const Store = mongoose.model('Store', StoreSchema)
const Transaction = mongoose.model('Transaction', TransactionSchema)
const Budget = mongoose.model('Budget', BudgetSchema)
const Loan = mongoose.model('Loan', LoanSchema)
const Pension = mongoose.model('Pension', PensionSchema)
const Debt = mongoose.model('Debt', DebtSchema)
const Stock = mongoose.model('Stock', StockSchema)

// ── Main ──────────────────────────────────────────────────────────────────────
await mongoose.connect(MONGO_URI)
console.log('✓ MongoDB conectado')

// Buscar usuario por username
const user = await User.findOne({ username })
if (!user) {
  console.error(`Error: no existe ningún usuario con username "${username}".`)
  await mongoose.disconnect()
  process.exit(1)
}
const USER_ID = user._id.toString()
console.log(`✓ Usuario encontrado: ${username} (${USER_ID})`)

// Limpiar datos anteriores del usuario
await Promise.all([
  Account.deleteMany({ user: USER_ID }),
  Category.deleteMany({ user: USER_ID }),
  Store.deleteMany({ user: USER_ID }),
  Transaction.deleteMany({ user: USER_ID }),
  Budget.deleteMany({ user: USER_ID }),
  Loan.deleteMany({ user: USER_ID }),
  Pension.deleteMany({ user: USER_ID }),
  Debt.deleteMany({ user: USER_ID }),
  Stock.deleteMany({ user: USER_ID }),
])
console.log('✓ Datos anteriores eliminados')

// ── 1. CUENTAS ────────────────────────────────────────────────────────────────
const accounts = await Account.insertMany([
  { name: 'Cuenta Corriente', bank: 'Santander', balance: 3240.50, user: USER_ID },
  { name: 'Cuenta Ahorro',    bank: 'ING',       balance: 8750.00, user: USER_ID },
  { name: 'Cuenta Inversión', bank: 'Degiro',    balance: 5120.30, user: USER_ID },
  { name: 'Efectivo',         bank: 'Efectivo',  balance: 180.00,  user: USER_ID },
])
console.log('✓ 4 cuentas creadas')

const [cuentaCorriente, , , efectivo] = accounts

// ── 2. CATEGORÍAS ─────────────────────────────────────────────────────────────
// Ingresos
const catIngresosPadre = await Category.create({ name: 'Ingresos', type: 'income', user: USER_ID })
const [catSalario, catFreelance] = await Category.insertMany([
  { name: 'Salario',          type: 'income', parent: catIngresosPadre._id, user: USER_ID },
  { name: 'Freelance',        type: 'income', parent: catIngresosPadre._id, user: USER_ID },
  { name: 'Alquiler cobrado', type: 'income', parent: catIngresosPadre._id, user: USER_ID },
])

// Gastos — padres
const catViviendaPadre     = await Category.create({ name: 'Vivienda',      type: 'expense', user: USER_ID })
const catAlimentacionPadre = await Category.create({ name: 'Alimentación',  type: 'expense', user: USER_ID })
const catTransportePadre   = await Category.create({ name: 'Transporte',    type: 'expense', user: USER_ID })
const catOcioPadre         = await Category.create({ name: 'Ocio',          type: 'expense', user: USER_ID })
const catSaludPadre        = await Category.create({ name: 'Salud',         type: 'expense', user: USER_ID })
const catRopaPadre         = await Category.create({ name: 'Ropa',          type: 'expense', user: USER_ID })

// Vivienda
const [catAlquiler, catLuz, catAgua, catInternet, catHipoteca] = await Category.insertMany([
  { name: 'Alquiler',         type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
  { name: 'Luz y Gas',        type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
  { name: 'Agua',             type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
  { name: 'Internet y móvil', type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
  { name: 'Hipoteca',         type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
])

// Alimentación
const [catSuper, catRestaurantes, catCafe] = await Category.insertMany([
  { name: 'Supermercado',     type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
  { name: 'Restaurantes',     type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
  { name: 'Café y bares',     type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
])

// Transporte
const [catGasolinera, catTransportePublico] = await Category.insertMany([
  { name: 'Gasolinera',         type: 'expense', parent: catTransportePadre._id, user: USER_ID },
  { name: 'Transporte público', type: 'expense', parent: catTransportePadre._id, user: USER_ID },
  { name: 'Taxi / Uber',        type: 'expense', parent: catTransportePadre._id, user: USER_ID },
])

// Ocio
const [catStreaming, catGimnasio, catViajes, catEntradas] = await Category.insertMany([
  { name: 'Streaming',          type: 'expense', parent: catOcioPadre._id, user: USER_ID },
  { name: 'Gimnasio',           type: 'expense', parent: catOcioPadre._id, user: USER_ID },
  { name: 'Viajes',             type: 'expense', parent: catOcioPadre._id, user: USER_ID },
  { name: 'Entradas y eventos', type: 'expense', parent: catOcioPadre._id, user: USER_ID },
])

// Salud
const [catFarmacia] = await Category.insertMany([
  { name: 'Farmacia', type: 'expense', parent: catSaludPadre._id, user: USER_ID },
  { name: 'Médico',   type: 'expense', parent: catSaludPadre._id, user: USER_ID },
])

// Ropa
const [catRopaCalzado, catAccesorios] = await Category.insertMany([
  { name: 'Ropa y calzado', type: 'expense', parent: catRopaPadre._id, user: USER_ID },
  { name: 'Accesorios',     type: 'expense', parent: catRopaPadre._id, user: USER_ID },
])

console.log('✓ Categorías padre e hijas creadas')

// ── 3. TIENDAS ────────────────────────────────────────────────────────────────
const stores = await Store.insertMany([
  { name: 'Mercadona',       user: USER_ID },
  { name: 'Carrefour',       user: USER_ID },
  { name: 'Lidl',            user: USER_ID },
  { name: 'Zara',            user: USER_ID },
  { name: 'Amazon',          user: USER_ID },
  { name: 'El Corte Inglés', user: USER_ID },
  { name: 'Repsol',          user: USER_ID },
  { name: 'Netflix',         user: USER_ID },
  { name: 'Spotify',         user: USER_ID },
  { name: 'Decathlon',       user: USER_ID },
  { name: 'Burger King',     user: USER_ID },
  { name: 'McDonalds',       user: USER_ID },
  { name: 'Starbucks',       user: USER_ID },
  { name: 'Apple',           user: USER_ID },
])
const storeMap = Object.fromEntries(stores.map(s => [s.name, s._id]))
console.log('✓ 14 tiendas creadas')

// ── 4. TRANSACCIONES (últimos 6 meses) ────────────────────────────────────────
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1 // 1-indexed

const txs = []

for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
  let m = currentMonth - monthsBack
  let y = currentYear
  if (m <= 0) { m += 12; y -= 1 }

  const isCurrentMonth = monthsBack === 0

  // Ingresos
  txs.push({ date: d(y, m, 28), amount: 2800, type: 'income', category: catSalario._id, account: cuentaCorriente._id, note: 'Salario mensual', user: USER_ID })
  if ([0, 2, 4].includes(monthsBack)) {
    txs.push({ date: d(y, m, 15), amount: rand(300, 800), type: 'income', category: catFreelance._id, account: cuentaCorriente._id, note: 'Proyecto freelance', user: USER_ID })
  }

  // Gastos fijos
  txs.push({ date: d(y, m, 1),  amount: 750,          type: 'expense', category: catAlquiler._id,  account: cuentaCorriente._id, user: USER_ID })
  txs.push({ date: d(y, m, 5),  amount: rand(60, 95), type: 'expense', category: catLuz._id,        account: cuentaCorriente._id, store: storeMap['Repsol'], user: USER_ID })
  txs.push({ date: d(y, m, 5),  amount: 22.50,        type: 'expense', category: catAgua._id,       account: cuentaCorriente._id, user: USER_ID })
  txs.push({ date: d(y, m, 3),  amount: 55,           type: 'expense', category: catInternet._id,   account: cuentaCorriente._id, user: USER_ID })
  txs.push({ date: d(y, m, 2),  amount: 45,           type: 'expense', category: catGimnasio._id,   account: cuentaCorriente._id, user: USER_ID })
  txs.push({ date: d(y, m, 1),  amount: 15.99,        type: 'expense', category: catStreaming._id,  account: cuentaCorriente._id, store: storeMap['Netflix'], user: USER_ID })
  txs.push({ date: d(y, m, 1),  amount: 9.99,         type: 'expense', category: catStreaming._id,  account: cuentaCorriente._id, store: storeMap['Spotify'], user: USER_ID })

  // Supermercado
  const superDias = [3, 8, 13, 18, 24].slice(0, isCurrentMonth ? 3 : 5)
  for (const dia of superDias) {
    txs.push({ date: d(y, m, dia), amount: rand(45, 120), type: 'expense', category: catSuper._id, account: cuentaCorriente._id, store: pick([storeMap['Mercadona'], storeMap['Carrefour'], storeMap['Lidl']]), user: USER_ID })
  }

  // Restaurantes y café
  for (const dia of (isCurrentMonth ? [7, 14] : [7, 12, 19, 26])) {
    txs.push({ date: d(y, m, dia), amount: rand(15, 45), type: 'expense', category: catRestaurantes._id, account: cuentaCorriente._id, store: pick([storeMap['Burger King'], storeMap['McDonalds']]), user: USER_ID })
  }
  txs.push({ date: d(y, m, 10), amount: rand(4, 8), type: 'expense', category: catCafe._id, account: cuentaCorriente._id, store: storeMap['Starbucks'], user: USER_ID })

  // Transporte
  txs.push({ date: d(y, m, 8),  amount: rand(40, 65), type: 'expense', category: catGasolinera._id,        account: cuentaCorriente._id, store: storeMap['Repsol'], user: USER_ID })
  txs.push({ date: d(y, m, 15), amount: 40,           type: 'expense', category: catTransportePublico._id, account: efectivo._id, user: USER_ID })

  // Ocio variable
  if (!isCurrentMonth || Math.random() > 0.4) {
    txs.push({ date: d(y, m, 20), amount: rand(20, 60), type: 'expense', category: catEntradas._id, account: cuentaCorriente._id, user: USER_ID })
  }

  // Salud
  if (monthsBack % 2 === 0) {
    txs.push({ date: d(y, m, 11), amount: rand(8, 30), type: 'expense', category: catFarmacia._id, account: efectivo._id, user: USER_ID })
  }

  // Ropa
  if ([1, 3, 5].includes(monthsBack)) {
    txs.push({ date: d(y, m, 17), amount: rand(30, 120), type: 'expense', category: catRopaCalzado._id, account: cuentaCorriente._id, store: pick([storeMap['Zara'], storeMap['El Corte Inglés']]), user: USER_ID })
  }

  // Compras online
  if (monthsBack % 3 === 0) {
    txs.push({ date: d(y, m, 22), amount: rand(15, 80), type: 'expense', category: catAccesorios._id, account: cuentaCorriente._id, store: storeMap['Amazon'], user: USER_ID })
  }

  // Viaje (un mes)
  if (monthsBack === 2) {
    txs.push({ date: d(y, m, 5), amount: 340, type: 'expense', category: catViajes._id, account: cuentaCorriente._id, note: 'Vuelos fin de semana', user: USER_ID })
    txs.push({ date: d(y, m, 6), amount: 180, type: 'expense', category: catViajes._id, account: cuentaCorriente._id, note: 'Hotel', user: USER_ID })
  }
}

await Transaction.insertMany(txs)
console.log(`✓ ${txs.length} transacciones creadas`)

// ── 5. PRESUPUESTOS (mes actual) ──────────────────────────────────────────────
const budgetYear = currentYear
const budgetMonth = currentMonth - 1 // 0-indexed

const budgets = [
  { category: catAlquiler._id,          amount: 750 },
  { category: catLuz._id,               amount: 90 },
  { category: catAgua._id,              amount: 25 },
  { category: catInternet._id,          amount: 60 },
  { category: catSuper._id,             amount: 300 },
  { category: catRestaurantes._id,      amount: 120 },
  { category: catCafe._id,              amount: 30 },
  { category: catGasolinera._id,        amount: 70 },
  { category: catTransportePublico._id, amount: 40 },
  { category: catGimnasio._id,          amount: 45 },
  { category: catStreaming._id,         amount: 30 },
  { category: catFarmacia._id,          amount: 20 },
  { category: catRopaCalzado._id,       amount: 80 },
  { category: catSalario._id,           amount: 2800 },
  { category: catFreelance._id,         amount: 400 },
]
await Budget.insertMany(budgets.map(b => ({ ...b, year: budgetYear, month: budgetMonth, user: USER_ID })))
console.log(`✓ ${budgets.length} presupuestos creados para ${budgetYear}/${budgetMonth}`)

// ── 6. PRÉSTAMO HIPOTECARIO ───────────────────────────────────────────────────
await Loan.create({
  name: 'Hipoteca piso',
  initialAmount: 120000,
  pendingAmount: 98450.75,
  interestRate: 2.5,
  startDate: d(2020, 3, 1),
  monthlyPayment: 487.30,
  initialEstimatedCost: 54000,
  account: cuentaCorriente._id,
  category: catHipoteca._id,
  user: USER_ID,
})
console.log('✓ Préstamo hipotecario creado')

// ── 7. PENSIÓN (12 aportaciones) ──────────────────────────────────────────────
const pensionEntries = []
for (let i = 11; i >= 0; i--) {
  let m = currentMonth - i
  let y = currentYear
  if (m <= 0) { m += 12; y -= 1 }
  const baseValue = 1.0 + (11 - i) * 0.012 + Math.random() * 0.005
  pensionEntries.push({
    date: d(y, m, 28),
    employeeAmount: 100,
    employeeUnits: parseFloat((100 / baseValue).toFixed(4)),
    companyAmount: 50,
    companyUnits: parseFloat((50 / baseValue).toFixed(4)),
    value: parseFloat(baseValue.toFixed(4)),
    user: USER_ID,
  })
}
await Pension.insertMany(pensionEntries)
console.log('✓ 12 aportaciones de pensión creadas')

// ── 8. DEUDAS ─────────────────────────────────────────────────────────────────
await Debt.insertMany([
  { from: 'Amigo Carlos', concept: 'Préstamo coche',  amount: 1200, type: 'to',   date: d(currentYear, 1, 15), user: USER_ID },
  { from: 'Pedro García', concept: 'Cena cumpleaños', amount: 350,  type: 'from', date: d(currentYear, 3, 10), user: USER_ID },
])
console.log('✓ 2 deudas creadas')

// ── 9. ACCIONES ───────────────────────────────────────────────────────────────
await Stock.insertMany([
  { ticker: 'MSFT', name: 'Microsoft', shares: 10, price: 310, type: 'buy', date: d(2023, 6, 1), platform: 'Degiro', user: USER_ID },
  { ticker: 'AAPL', name: 'Apple',     shares: 15, price: 175, type: 'buy', date: d(2023, 9, 1), platform: 'Degiro', user: USER_ID },
])
console.log('✓ 2 posiciones de acciones creadas')

await mongoose.disconnect()
console.log(`\n🎉 Seed completado para "${username}" (${USER_ID})`)
console.log('   Cuentas:       4 (Santander, ING, Degiro, Efectivo)')
console.log('   Categorías:    jerarquía padre→hijo (Ingresos, Vivienda, Alimentación, Transporte, Ocio, Salud, Ropa)')
console.log('   Tiendas:       14')
console.log(`   Transacciones: ${txs.length} (últimos 6 meses)`)
console.log(`   Presupuestos:  ${budgets.length} categorías para ${budgetYear}/${budgetMonth}`)
console.log('   Préstamo:      Hipoteca 98.450€ pendiente')
console.log('   Pensión:       12 aportaciones mensuales')
console.log('   Deudas:        1 que debes | 1 que te deben')
console.log('   Acciones:      MSFT (10 acc) | AAPL (15 acc)')

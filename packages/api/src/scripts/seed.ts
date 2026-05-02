/**
 * seed.ts — puebla la base de datos con datos de prueba
 *
 * Ejecutar desde packages/api:
 *   npx ts-node --esm src/scripts/seed.ts
 * O desde raíz:
 *   pnpm --filter @soker90/finper-api exec ts-node src/scripts/seed.ts
 */

import {
  mongoose,
  AccountModel, CategoryModel, TransactionModel,
  LoanModel, PensionModel, DebtModel, StoreModel, BudgetModel, StockModel
} from '@soker90/finper-models'

// ── Conexión ─────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb://fi34r4t:uQ018HJHGJSDKMK7876@127.0.0.1:27017/finper?authSource=admin'
const USER_ID = '62e040fcf1f3221a34bbd1fa'

const d = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day).getTime()

const rand = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

async function main () {
  await mongoose.connect(MONGO_URI)
  console.log('✓ MongoDB conectado')

  // Limpiar datos anteriores del usuario
  await Promise.all([
    AccountModel.deleteMany({ user: USER_ID }),
    CategoryModel.deleteMany({ user: USER_ID }),
    StoreModel.deleteMany({ user: USER_ID }),
    TransactionModel.deleteMany({ user: USER_ID }),
    BudgetModel.deleteMany({ user: USER_ID }),
    LoanModel.deleteMany({ user: USER_ID }),
    PensionModel.deleteMany({ user: USER_ID }),
    DebtModel.deleteMany({ user: USER_ID }),
    StockModel.deleteMany({ user: USER_ID }),
  ])
  console.log('✓ Datos anteriores eliminados')

  // ── 1. CUENTAS ──────────────────────────────────────────────────────────────
  const accounts = await AccountModel.insertMany([
    { name: 'Cuenta Corriente', bank: 'Santander', balance: 3240.50, user: USER_ID },
    { name: 'Cuenta Ahorro',    bank: 'ING',       balance: 8750.00, user: USER_ID },
    { name: 'Cuenta Inversión', bank: 'Degiro',    balance: 5120.30, user: USER_ID },
    { name: 'Efectivo',         bank: 'Efectivo',  balance: 180.00,  user: USER_ID },
  ])
  console.log('✓ 4 cuentas creadas')
  const [corriente, , , efectivo] = accounts

  // ── 2. CATEGORÍAS ───────────────────────────────────────────────────────────
  const catIngresosPadre     = await CategoryModel.create({ name: 'Ingresos',       type: 'income',  user: USER_ID })
  const catViviendaPadre     = await CategoryModel.create({ name: 'Vivienda',       type: 'expense', user: USER_ID })
  const catAlimentacionPadre = await CategoryModel.create({ name: 'Alimentación',   type: 'expense', user: USER_ID })
  const catTransportePadre   = await CategoryModel.create({ name: 'Transporte',     type: 'expense', user: USER_ID })
  const catOcioPadre         = await CategoryModel.create({ name: 'Ocio',           type: 'expense', user: USER_ID })
  const catSaludPadre        = await CategoryModel.create({ name: 'Salud',          type: 'expense', user: USER_ID })
  const catRopaPadre         = await CategoryModel.create({ name: 'Ropa',           type: 'expense', user: USER_ID })

  // Hijos de ingresos
  const [catSalario, catFreelance] = await CategoryModel.insertMany([
    { name: 'Salario',   type: 'income', parent: catIngresosPadre._id, user: USER_ID },
    { name: 'Freelance', type: 'income', parent: catIngresosPadre._id, user: USER_ID },
  ])
  // Hijos de Vivienda
  const [catAlquiler, catLuz, catAgua, catInternet] = await CategoryModel.insertMany([
    { name: 'Alquiler',         type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
    { name: 'Luz y Gas',        type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
    { name: 'Agua',             type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
    { name: 'Internet y móvil', type: 'expense', parent: catViviendaPadre._id, user: USER_ID },
  ])
  // Hijos de Alimentación
  const [catSuper, catRestaurantes, catCafe] = await CategoryModel.insertMany([
    { name: 'Supermercado',  type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
    { name: 'Restaurantes',  type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
    { name: 'Café y bares',  type: 'expense', parent: catAlimentacionPadre._id, user: USER_ID },
  ])
  // Hijos de Transporte
  const [catGasolinera, catTranspPublico] = await CategoryModel.insertMany([
    { name: 'Gasolinera',        type: 'expense', parent: catTransportePadre._id, user: USER_ID },
    { name: 'Transporte público',type: 'expense', parent: catTransportePadre._id, user: USER_ID },
  ])
  // Hijos de Ocio
  const [catStreaming, catGimnasio, catViajes, catEntradas] = await CategoryModel.insertMany([
    { name: 'Streaming',          type: 'expense', parent: catOcioPadre._id, user: USER_ID },
    { name: 'Gimnasio',           type: 'expense', parent: catOcioPadre._id, user: USER_ID },
    { name: 'Viajes',             type: 'expense', parent: catOcioPadre._id, user: USER_ID },
    { name: 'Entradas y eventos', type: 'expense', parent: catOcioPadre._id, user: USER_ID },
  ])
  // Hijos de Salud
  const [catFarmacia] = await CategoryModel.insertMany([
    { name: 'Farmacia', type: 'expense', parent: catSaludPadre._id, user: USER_ID },
  ])
  // Hijos de Ropa
  const [catRopaCalzado] = await CategoryModel.insertMany([
    { name: 'Ropa y calzado', type: 'expense', parent: catRopaPadre._id, user: USER_ID },
  ])
  console.log('✓ Categorías con jerarquía padre→hijo creadas')

  // ── 3. TIENDAS ──────────────────────────────────────────────────────────────
  const storeNames = ['Mercadona', 'Carrefour', 'Lidl', 'Zara', 'Amazon',
    'El Corte Inglés', 'Repsol', 'Netflix', 'Spotify', 'Decathlon',
    'Burger King', 'McDonalds', 'Starbucks']
  const storesDocs = await StoreModel.insertMany(storeNames.map(name => ({ name, user: USER_ID })))
  const s = Object.fromEntries(storesDocs.map((st: any) => [st.name, st._id]))
  console.log(`✓ ${storesDocs.length} tiendas creadas`)

  // ── 4. TRANSACCIONES (últimos 6 meses) ──────────────────────────────────────
  const now = new Date()
  const currentYear  = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  const txs: any[] = []

  for (let back = 5; back >= 0; back--) {
    let m = currentMonth - back
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }

    const isCurrent = back === 0

    // Ingresos
    txs.push({ date: d(y, m, 28), amount: 2800, type: 'income', category: catSalario._id, account: corriente._id, note: 'Salario mensual', user: USER_ID })
    if ([0, 2, 4].includes(back)) {
      txs.push({ date: d(y, m, 15), amount: rand(300, 800), type: 'income', category: catFreelance._id, account: corriente._id, note: 'Proyecto freelance', user: USER_ID })
    }

    // Gastos fijos
    txs.push({ date: d(y, m, 1),  amount: 750,         type: 'expense', category: catAlquiler._id,   account: corriente._id, user: USER_ID })
    txs.push({ date: d(y, m, 5),  amount: rand(60, 95), type: 'expense', category: catLuz._id,        account: corriente._id, store: s['Repsol'], user: USER_ID })
    txs.push({ date: d(y, m, 5),  amount: 22.50,        type: 'expense', category: catAgua._id,       account: corriente._id, user: USER_ID })
    txs.push({ date: d(y, m, 3),  amount: 55,           type: 'expense', category: catInternet._id,   account: corriente._id, user: USER_ID })
    txs.push({ date: d(y, m, 2),  amount: 45,           type: 'expense', category: catGimnasio._id,   account: corriente._id, user: USER_ID })
    txs.push({ date: d(y, m, 1),  amount: 15.99,        type: 'expense', category: catStreaming._id,  account: corriente._id, store: s['Netflix'], user: USER_ID })
    txs.push({ date: d(y, m, 1),  amount: 9.99,         type: 'expense', category: catStreaming._id,  account: corriente._id, store: s['Spotify'], user: USER_ID })

    // Supermercado
    const superDias = (isCurrent ? [3, 8, 13] : [3, 8, 13, 18, 24])
    for (const dia of superDias) {
      txs.push({ date: d(y, m, dia), amount: rand(50, 120), type: 'expense', category: catSuper._id, account: corriente._id, store: pick([s['Mercadona'], s['Carrefour'], s['Lidl']]), user: USER_ID })
    }

    // Restaurantes y café
    const resDias = isCurrent ? [7, 14] : [7, 12, 19, 26]
    for (const dia of resDias) {
      txs.push({ date: d(y, m, dia), amount: rand(15, 45), type: 'expense', category: catRestaurantes._id, account: corriente._id, store: pick([s['Burger King'], s['McDonalds']]), user: USER_ID })
    }
    txs.push({ date: d(y, m, 10), amount: rand(4, 8), type: 'expense', category: catCafe._id, account: corriente._id, store: s['Starbucks'], user: USER_ID })

    // Transporte
    txs.push({ date: d(y, m, 8),  amount: rand(40, 65), type: 'expense', category: catGasolinera._id,   account: corriente._id, store: s['Repsol'], user: USER_ID })
    txs.push({ date: d(y, m, 15), amount: 40,           type: 'expense', category: catTranspPublico._id, account: efectivo._id,  user: USER_ID })

    // Ocio
    if (!isCurrent || Math.random() > 0.4) {
      txs.push({ date: d(y, m, 20), amount: rand(20, 55), type: 'expense', category: catEntradas._id, account: corriente._id, user: USER_ID })
    }

    // Salud
    if (back % 2 === 0) {
      txs.push({ date: d(y, m, 11), amount: rand(8, 30), type: 'expense', category: catFarmacia._id, account: efectivo._id, user: USER_ID })
    }

    // Ropa
    if ([1, 3, 5].includes(back)) {
      txs.push({ date: d(y, m, 17), amount: rand(35, 120), type: 'expense', category: catRopaCalzado._id, account: corriente._id, store: pick([s['Zara'], s['El Corte Inglés']]), user: USER_ID })
    }

    // Viaje (hace 2 meses)
    if (back === 2) {
      txs.push({ date: d(y, m, 5), amount: 340, type: 'expense', category: catViajes._id, account: corriente._id, note: 'Vuelos fin de semana', user: USER_ID })
      txs.push({ date: d(y, m, 6), amount: 180, type: 'expense', category: catViajes._id, account: corriente._id, note: 'Hotel', user: USER_ID })
    }
  }

  await TransactionModel.insertMany(txs)
  console.log(`✓ ${txs.length} transacciones creadas (últimos 6 meses)`)

  // ── 5. PRESUPUESTOS ─────────────────────────────────────────────────────────
  const budgetMonth = currentMonth - 1 // 0-indexed como espera la API
  const budgets = [
    { category: catAlquiler._id, amount: 750 }, { category: catLuz._id, amount: 90 },
    { category: catAgua._id, amount: 25 },       { category: catInternet._id, amount: 60 },
    { category: catSuper._id, amount: 300 },     { category: catRestaurantes._id, amount: 120 },
    { category: catCafe._id, amount: 30 },       { category: catGasolinera._id, amount: 70 },
    { category: catTranspPublico._id, amount: 40 }, { category: catGimnasio._id, amount: 45 },
    { category: catStreaming._id, amount: 30 },  { category: catFarmacia._id, amount: 20 },
    { category: catRopaCalzado._id, amount: 80 }, { category: catViajes._id, amount: 0 },
    { category: catSalario._id, amount: 2800 },  { category: catFreelance._id, amount: 400 },
  ]
  await BudgetModel.insertMany(budgets.map(b => ({ ...b, year: currentYear, month: budgetMonth, user: USER_ID })))
  console.log(`✓ ${budgets.length} presupuestos creados`)

  // ── 6. PRÉSTAMO ─────────────────────────────────────────────────────────────
  // Necesita account y category (obligatorios en el schema)
  const catHipoteca = await CategoryModel.create({ name: 'Hipoteca', type: 'expense', user: USER_ID })
  await LoanModel.create({
    name: 'Hipoteca piso', initialAmount: 120000, pendingAmount: 98450.75,
    interestRate: 2.5, startDate: d(2020, 3, 1),
    monthlyPayment: 487.30, initialEstimatedCost: 54000,
    account: corriente._id, category: catHipoteca._id,
    user: USER_ID,
  })
  console.log('✓ Préstamo hipotecario creado')

  // ── 7. PENSIÓN ──────────────────────────────────────────────────────────────
  const pensionEntries = []
  for (let i = 11; i >= 0; i--) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    const baseValue = parseFloat((1.0 + (11 - i) * 0.012 + Math.random() * 0.005).toFixed(4))
    pensionEntries.push({
      date: d(y, m, 28),
      employeeAmount: 100, employeeUnits: parseFloat((100 / baseValue).toFixed(4)),
      companyAmount: 50,  companyUnits: parseFloat((50 / baseValue).toFixed(4)),
      value: baseValue, user: USER_ID
    })
  }
  await PensionModel.insertMany(pensionEntries)
  console.log('✓ 12 aportaciones de pensión creadas')

  // ── 8. DEUDAS ───────────────────────────────────────────────────────────────
  await DebtModel.insertMany([
    { from: 'Amigo Carlos', concept: 'Préstamo coche', amount: 1200, type: 'to',   date: d(currentYear, 1, 15), user: USER_ID },
    { from: 'Pedro García', concept: 'Cena cumpleaños', amount: 350, type: 'from', date: d(currentYear, 3, 10), user: USER_ID },
  ])
  console.log('✓ 2 deudas creadas')

  // ── 9. ACCIONES ─────────────────────────────────────────────────────────────
  await StockModel.insertMany([
    { ticker: 'MSFT', name: 'Microsoft', shares: 10, price: 310, type: 'buy', date: d(2023, 6, 1), platform: 'Degiro', user: USER_ID },
    { ticker: 'AAPL', name: 'Apple',     shares: 15, price: 175, type: 'buy', date: d(2023, 9, 1), platform: 'Degiro', user: USER_ID },
  ])
  console.log('✓ 2 posiciones de acciones creadas')

  await mongoose.disconnect()

  console.log('\n🎉 Seed completado. Resumen:')
  console.log('   Usuario:       edu (62e040fcf1f3221a34bbd1fa)')
  console.log('   Cuentas:       4 — Santander 3240€ | ING 8750€ | Degiro 5120€ | Efectivo 180€')
  console.log('   Categorías:    jerarquía padre→hijo (Vivienda, Alimentación, Transporte, Ocio, Salud, Ropa)')
  console.log('   Tiendas:       13 (Mercadona, Carrefour, Zara, Netflix, Repsol...)')
  console.log(`   Transacciones: ${txs.length} (últimos 6 meses)`)
  console.log(`   Presupuestos:  ${budgets.length} categorías para ${currentYear}/${budgetMonth}`)
  console.log('   Préstamo:      Hipoteca 98.450€ pendiente')
  console.log('   Pensión:       12 aportaciones mensuales (100€ emp + 50€ empresa)')
  console.log('   Deudas:        1 que debes | 1 que te deben')
  console.log('   Acciones:      MSFT (10 acc a 310€) | AAPL (15 acc a 175€)')
}

main().catch(err => { console.error(err); process.exit(1) })

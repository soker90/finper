// packages/api/scripts/seed-snapshots-db.ts
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {
  UserModel,
  AccountModel,
  CategoryModel,
  StoreModel,
  TagModel,
  TransactionModel,
  BudgetModel,
  SubscriptionModel,
  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  PropertyModel,
  SupplyModel,
  SupplyReadingModel,
  StockModel,
  PensionModel,
  GoalModel,
  Types
} from '@soker90/finper-models'

const MONGO_URI = 'mongodb://localhost:27018/finper-snapshots'

async function main() {
  await mongoose.connect(MONGO_URI)
  console.log('✓ Connected to snapshot Mongo')

  // 1. Limpieza
  console.log('Cleaning collections...')
  await mongoose.connection.dropDatabase()

  // 2. Crear testuser
  console.log('Creating testuser...')
  const passwordHash = await bcrypt.hash('testpass1234', 10)
  const user = await UserModel.create({
    username: 'testuser',
    password: passwordHash,
    role: 'user',
    settings: {
      currency: 'EUR',
      language: 'es'
    }
  })
  console.log('✓ Created User')

  const username = user.username

  // Accounts
  const a1 = await AccountModel.create({ user: username, name: 'Test Checking', bank: 'TestBank', balance: 1000 })
  const a2 = await AccountModel.create({ user: username, name: 'Test Savings', bank: 'TestBank', balance: 5000 })
  const a3 = await AccountModel.create({ user: username, name: 'Test Credit Card', bank: 'TestBank', balance: -200 })
  console.log('✓ Created Accounts (3)')

  // Categories
  const cFood = await CategoryModel.create({ user: username, name: 'Food', type: 'expense', color: '#ff5733', icon: 'food' })
  const cTransport = await CategoryModel.create({ user: username, name: 'Transport', type: 'expense', color: '#3498db', icon: 'car' })
  const cSalary = await CategoryModel.create({ user: username, name: 'Salary', type: 'income', color: '#2ecc71', icon: 'work' })
  const cInvestments = await CategoryModel.create({ user: username, name: 'Investments', type: 'expense', color: '#9b59b6', icon: 'trending' })
  const cRestaurants = await CategoryModel.create({ user: username, name: 'Restaurants', type: 'expense', color: '#e74c3c', icon: 'restaurant', parent: cFood._id })
  console.log('✓ Created Categories (5)')

  // Stores
  const sA = await StoreModel.create({ user: username, name: 'Test Store A' })
  const sB = await StoreModel.create({ user: username, name: 'Test Store B' })
  const sC = await StoreModel.create({ user: username, name: 'Test Restaurante Ñandú' })
  console.log('✓ Created Stores (3)')

  // Tags
  const tTrabajo = await TagModel.create({ user: username, name: 'trabajo', color: '#111' })
  const tOcio = await TagModel.create({ user: username, name: 'ocio', color: '#222' })
  const tImp = await TagModel.create({ user: username, name: 'imprescindible', color: '#333' })
  console.log('✓ Created Tags (3)')

  // Transactions
  await TransactionModel.create([
    { user: username, date: new Date('2024-11-10T10:00:00Z'), amount: 1000, type: 'income', category: cSalary._id, account: a1._id, tags: [tTrabajo._id] },
    { user: username, date: new Date('2024-12-05T12:00:00Z'), amount: -25.50, type: 'expense', category: cRestaurants._id, account: a1._id, store: sC._id, tags: [tOcio._id] },
    { user: username, date: new Date('2025-01-15T09:00:00Z'), amount: -100, type: 'expense', category: cTransport._id, account: a1._id, store: sA._id, tags: [tImp._id] },
    { user: username, date: new Date('2025-01-20T14:00:00Z'), amount: -250, type: 'expense', category: cFood._id, account: a1._id, store: sB._id },
    { user: username, date: new Date('2025-02-01T08:00:00Z'), amount: -10, type: 'expense', category: cTransport._id, account: a1._id },
    { user: username, date: new Date('2025-02-10T19:00:00Z'), amount: -99.99, type: 'expense', category: cRestaurants._id, account: a3._id, store: sC._id, tags: [tOcio._id] },
    { user: username, date: new Date('2025-02-28T10:00:00Z'), amount: 1000, type: 'income', category: cSalary._id, account: a1._id, tags: [tTrabajo._id] },
    { user: username, date: new Date('2025-03-01T11:00:00Z'), amount: -12.34, type: 'expense', category: cFood._id, account: a1._id, tags: [tImp._id] },
    { user: username, date: new Date('2025-03-05T12:00:00Z'), amount: -200, type: 'transfer', category: cInvestments._id, account: a1._id, destinationAccount: a2._id },
    { user: username, date: new Date('2025-03-10T09:00:00Z'), amount: -15.00, type: 'expense', category: cTransport._id, account: a1._id } // Minimal
  ])
  console.log('✓ Created Transactions (10)')

  // Budgets
  await BudgetModel.create([
    { user: username, year: 2025, month: 1, category: cFood._id, amount: 300 },
    { user: username, year: 2025, month: 1, category: cTransport._id, amount: 150 },
    { user: username, year: 2025, month: 2, category: cFood._id, amount: 320 }
  ])
  console.log('✓ Created Budgets (3)')

  // Subscriptions
  await SubscriptionModel.create([
    { user: username, name: 'Test Streaming', amount: 9.99, cycle: 1, type: 'expense', category: cRestaurants._id, account: a1._id },
    { user: username, name: 'Test Gym', amount: 39.99, cycle: 1, type: 'expense', category: cFood._id, account: a1._id }
  ])
  console.log('✓ Created Subscriptions (2)')

  // Loans
  const loan = await LoanModel.create({
    user: username,
    name: 'Test Mortgage',
    initialAmount: 100000,
    pendingAmount: 95000,
    interestRate: 3.5,
    startDate: new Date('2025-01-01T00:00:00Z'),
    monthlyPayment: 450,
    initialEstimatedCost: 120000,
    account: a1._id,
    category: cTransport._id
  })
  console.log('✓ Created Loan (1)')

  // LoanPayments
  await LoanPaymentModel.create([
    { user: username, loan: loan._id, date: new Date('2025-01-01T00:00:00Z'), amount: 450, interest: 250, principal: 200, accumulatedPrincipal: 200, pendingCapital: 99800 },
    { user: username, loan: loan._id, date: new Date('2025-02-01T00:00:00Z'), amount: 450, interest: 245, principal: 205, accumulatedPrincipal: 405, pendingCapital: 99595 },
    { user: username, loan: loan._id, date: new Date('2025-03-01T00:00:00Z'), amount: 450, interest: 240, principal: 210, accumulatedPrincipal: 615, pendingCapital: 99385 }
  ])
  console.log('✓ Created LoanPayments (3)')

  // LoanEvents
  await LoanEventModel.create({
    user: username,
    loan: loan._id,
    date: new Date('2025-02-01T00:00:00Z'),
    newRate: 3.25,
    newPayment: 440
  })
  console.log('✓ Created LoanEvent (1)')

  // Properties
  const prop = await PropertyModel.create({ user: username, name: 'Test Property' })
  console.log('✓ Created Property (1)')

  // Supplies
  const sup = await SupplyModel.create({
    user: username,
    property: prop._id,
    type: 'electricity',
    contractedPowerPeak: 4.6,
    contractedPowerOffPeak: 4.6,
    currentPriceEnergyPeak: 0.15,
    currentPriceEnergyFlat: 0.12,
    currentPriceEnergyOffPeak: 0.08
  })
  console.log('✓ Created Supply (1)')

  // SupplyReadings
  await SupplyReadingModel.create([
    { user: username, supply: sup._id, startDate: new Date('2025-01-01T00:00:00Z'), endDate: new Date('2025-02-01T00:00:00Z'), amount: 85.30, consumption: 320, consumptionPeak: 100, consumptionFlat: 150, consumptionOffPeak: 70 },
    { user: username, supply: sup._id, startDate: new Date('2025-02-01T00:00:00Z'), endDate: new Date('2025-03-01T00:00:00Z'), amount: 92.15, consumption: 350, consumptionPeak: 110, consumptionFlat: 160, consumptionOffPeak: 80 }
  ])
  console.log('✓ Created SupplyReadings (2)')

  // Stocks
  await StockModel.create([
    { user: username, platform: 'TestBroker', ticker: 'TEST', name: 'Test Stock', shares: 10, price: 15.50, type: 'buy', date: new Date('2025-01-15T00:00:00Z') },
    { user: username, platform: 'TestBroker', ticker: 'TEST2', name: 'Test Stock 2', shares: 5, price: 32.75, type: 'buy', date: new Date('2025-02-15T00:00:00Z') }
  ])
  console.log('✓ Created Stocks (2)')

  // Pensions
  await PensionModel.create([
    { user: username, date: new Date('2025-01-31T00:00:00Z'), employeeAmount: 100, employeeUnits: 5.5, companyAmount: 50, companyUnits: 2.75, value: 18.20 },
    { user: username, date: new Date('2025-02-28T00:00:00Z'), employeeAmount: 100, employeeUnits: 5.4, companyAmount: 50, companyUnits: 2.70, value: 18.55 }
  ])
  console.log('✓ Created Pensions (2)')

  if (GoalModel) {
    await GoalModel.create({
      user: username,
      name: 'Test Goal',
      targetAmount: 5000,
      currentAmount: 1500,
      color: '#00ff00',
      icon: 'target'
    })
    console.log('✓ Created Goal (1)')
  }

  // 4. Resumen
  console.log('\n=== SEED COMPLETE ===')
  console.log(`User: ${user._id} (username: testuser)`)
  console.log(`Accounts: 3`)
  console.log(`Categories: 5`)
  console.log(`Stores: 3`)
  console.log(`Tags: 3`)
  console.log(`Transactions: 10`)
  console.log(`Budgets: 3`)
  console.log(`Subscriptions: 2`)
  console.log(`Loans: 1`)
  console.log(`LoanPayments: 3`)
  console.log(`LoanEvents: 1`)
  console.log(`Properties: 1`)
  console.log(`Supplies: 1`)
  console.log(`SupplyReadings: 2`)
  console.log(`Stocks: 2`)
  console.log(`Pensions: 2`)

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})

import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { TRANSACTION } from '@soker90/finper-db'
import { transactionsRoutes } from '../transactions.routes'

const { transactions, accounts, categories, subscriptions, subscriptionCandidates, users } = schema

// Verifica el CABLEADO de hooks transactions -> subscriptions (T1b):
//  - onTransactionCreated -> subscriptionCandidateService.detectCandidates
//  - onTransactionDeleted  -> subscriptionsService.recalculateNextPaymentDate
// (El comportamiento interno de cada service ya está cubierto en modules/subscriptions;
//  aquí se prueba que transactions.routes los invoca de verdad, end-to-end.)
describe('Transactions hooks wiring (T1b)', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/transactions'
  let accountId: string
  let categoryId: string
  let otherCategoryId: string

  const WEEK = 7 * 24 * 60 * 60 * 1000
  const txDate = Date.UTC(2025, 5, 15, 12, 0, 0)

  beforeAll(async () => {
    server.app.use('/test-api/transactions', transactionsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)
    token = await requestLogin(server.app, { username })

    accountId = generateId()
    sqliteDb.insert(accounts).values({ id: accountId, name: 'Acc', bank: 'Bank', balance: 1000, user: username }).run()
    categoryId = generateId()
    sqliteDb.insert(categories).values({ id: categoryId, name: 'Sub cat', type: 'expense', user: username }).run()
    otherCategoryId = generateId()
    sqliteDb.insert(categories).values({ id: otherCategoryId, name: 'No-sub cat', type: 'expense', user: username }).run()
  })

  afterEach(() => {
    sqliteDb.delete(subscriptionCandidates).where(eq(subscriptionCandidates.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(subscriptions).where(eq(subscriptions.user, username)).run()
  })

  afterAll(async () => {
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  const insertSubscription = (catId: string, nextPaymentDate: number): string => {
    const id = generateId()
    sqliteDb.insert(subscriptions).values({
      id, name: 'Netflix', amount: 10, cycle: 30, nextPaymentDate, categoryId: catId, accountId, user: username
    }).run()
    return id
  }

  it('onTransactionCreated creates a candidate when the transaction matches a subscription', async () => {
    const subId = insertSubscription(categoryId, txDate) // nextPaymentDate dentro de ±1 semana

    await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
      .send({ date: txDate, category: categoryId, amount: 10, type: TRANSACTION.Expense, account: accountId })
      .expect(200)

    const candidates = sqliteDb.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.user, username)).all()
    expect(candidates).toHaveLength(1)
    expect(candidates[0].subscriptionIds).toContain(subId)
  })

  it('onTransactionCreated does NOT create a candidate when nothing matches', async () => {
    insertSubscription(categoryId, txDate) // existe una subscription, pero en OTRA categoría que la transacción

    await supertest(server.app).post(path).set('Authorization', `Bearer ${token}`)
      .send({ date: txDate, category: otherCategoryId, amount: 10, type: TRANSACTION.Expense, account: accountId })
      .expect(200)

    const candidates = sqliteDb.select().from(subscriptionCandidates).where(eq(subscriptionCandidates.user, username)).all()
    expect(candidates).toHaveLength(0)
  })

  it('onTransactionDeleted recalculates the subscription nextPaymentDate', async () => {
    const subId = insertSubscription(categoryId, txDate + WEEK * 4) // valor inicial no-null
    const txId = generateId()
    sqliteDb.insert(transactions).values({
      id: txId,
      date: txDate,
      categoryId,
      amount: 10,
      type: 'expense',
      accountId,
      note: null,
      storeId: null,
      subscriptionId: subId,
      tags: [],
      user: username
    }).run()

    await supertest(server.app).delete(`${path}/${txId}`).set('Authorization', `Bearer ${token}`).expect(204)

    // Al borrar la única transacción vinculada, no quedan pagos -> nextPaymentDate pasa a null
    const sub = sqliteDb.select().from(subscriptions).where(eq(subscriptions.id, subId)).get()!
    expect(sub.nextPaymentDate).toBeNull()
  })
})

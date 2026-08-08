import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'
import { creditCardsRoutes } from '../credit-cards.routes'
import { accountsRepository } from '../../accounts/accounts.repository'

const { creditCards, creditCardMovements, accounts, categories, transactions, users } = schema

describe('Credit Cards Routes', () => {
  let token: string
  const username = generateUsername()
  const path = '/test-api/credit-cards'

  let accountId: string
  let categoryId: string

  beforeAll(async () => {
    server.app.use('/test-api/credit-cards', creditCardsRoutes)
    server.app.use(require('../../../middlewares/handle-error').default)

    token = await requestLogin(server.app, { username })

    const account = await accountsRepository.create(username, { name: 'Main Checking', bank: 'BBVA', balance: 1000 })
    accountId = account.id

    const catId = generateId()
    await sqliteDb.insert(categories).values({
      id: catId,
      name: 'Shopping',
      type: 'expense',
      user: username
    }).run()

    categoryId = catId
  })

  afterAll(async () => {
    sqliteDb.delete(creditCardMovements).where(eq(creditCardMovements.user, username)).run()
    sqliteDb.delete(creditCards).where(eq(creditCards.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(async () => {
    sqliteDb.delete(creditCardMovements).where(eq(creditCardMovements.user, username)).run()
    sqliteDb.delete(creditCards).where(eq(creditCards.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
  })

  describe('CRUD /api/credit-cards', () => {
    test('POST / creates a credit card', async () => {
      const response = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Visa Pass',
          accountId,
          limit: 1500
        })
        .expect(201)

      expect(response.body.name).toBe('Visa Pass')
      expect(response.body.accountId).toBe(accountId)
      expect(response.body.limit).toBe(1500)
      expect(response.body.currentDebt).toBe(0)
    })

    test('GET / returns list of cards with debt', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Visa Gold', accountId, limit: 2000 })

      const response = await supertest(server.app)
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(1)
      expect(response.body[0].name).toBe('Visa Gold')
    })

    test('PATCH /:id edits credit card', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Visa Original', accountId, limit: 1000 })

      const response = await supertest(server.app)
        .patch(`${path}/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Visa Updated', limit: 2500 })
        .expect(200)

      expect(response.body.name).toBe('Visa Updated')
      expect(response.body.limit).toBe(2500)
    })

    test('DELETE /:id deletes credit card', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete', accountId })

      await supertest(server.app)
        .delete(`${path}/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)
    })
  })

  describe('Movements & Debt Payment', () => {
    test('add movements and pay debt', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card for Debt', accountId, limit: 3000 })
        .expect(201)

      const cardId = cardRes.body.id

      // Add movement 1 (100 EUR expense)
      const m1 = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          type: 'expense',
          categoryId,
          note: 'Groceries'
        })
        .expect(201)

      // Add movement 2 (50 EUR expense)
      await supertest(server.app)

        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 50,
          type: 'expense',
          categoryId,
          note: 'Gasoline'
        })
        .expect(201)

      // Verify card debt is 150
      const cardDetail = await supertest(server.app)
        .get(`${path}/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(cardDetail.body.currentDebt).toBe(150)

      // Pay debt partially by selecting m1 (100 EUR)
      const payRes = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [m1.body.id] })
        .expect(200)

      expect(payRes.body.paidCount).toBe(1)
      expect(payRes.body.totalPaid).toBe(100)

      // Check account balance decreased from 1000 to 900
      const accRow = sqliteDb.select().from(accounts).where(eq(accounts.id, accountId)).get()!
      expect(accRow.balance).toBe(900)

      // Pay remaining debt (all: true)
      const payAllRes = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      expect(payAllRes.body.paidCount).toBe(1)
      expect(payAllRes.body.totalPaid).toBe(50)

      // Account balance should now be 850
      const accRowFinal = sqliteDb.select().from(accounts).where(eq(accounts.id, accountId)).get()!
      expect(accRowFinal.balance).toBe(850)

      // Remaining debt on card should be 0
      const cardFinal = await supertest(server.app)
        .get(`${path}/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(cardFinal.body.currentDebt).toBe(0)
    })
  })
})

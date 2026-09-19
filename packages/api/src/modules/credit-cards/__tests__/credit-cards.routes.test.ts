import supertest from 'supertest'
import { server } from '../../../server'
import { requestLogin } from '../../../../test/request-login'
import { generateUsername } from '../../../../test/generate-values'
import { db as sqliteDb } from '../../../db'
import { schema, generateId } from '@soker90/finper-db'
import { eq, sql } from 'drizzle-orm'
import { creditCardsRoutes } from '../credit-cards.routes'
import { accountsRepository } from '../../accounts/accounts.repository'

import { ERROR_MESSAGE } from '../../../i18n'

const { creditCards, creditCardMovements, creditCardMovementSplits, accounts, categories, transactions, transactionSplits, users, stores } = schema

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
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(creditCards).where(eq(creditCards.user, username)).run()
    sqliteDb.delete(accounts).where(eq(accounts.user, username)).run()
    sqliteDb.delete(categories).where(eq(categories.user, username)).run()
    sqliteDb.delete(stores).where(eq(stores.user, username)).run()
    sqliteDb.delete(users).where(eq(users.username, username)).run()
  })

  afterEach(async () => {
    sqliteDb.delete(creditCardMovements).where(eq(creditCardMovements.user, username)).run()
    sqliteDb.delete(transactions).where(eq(transactions.user, username)).run()
    sqliteDb.delete(creditCards).where(eq(creditCards.user, username)).run()
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

  describe('Auth & validation errors', () => {
    test('GET / without token returns 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('GET /:id for a non-existent card returns 404', async () => {
      await supertest(server.app)
        .get(`${path}/nonexistent-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    test('GET /:id/movements/:movementId edit for non-existent movement returns 404', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card', accountId })
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${created.body.id}/movements/nonexistent-movement`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 10 })
        .expect(404)
    })

    test('POST / with empty name returns 422', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', accountId })
        .expect(422)
    })

    test('POST /:id/movements with negative amount returns 422', async () => {
      const created = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card', accountId })

      await supertest(server.app)
        .post(`${path}/${created.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: -10, categoryId })
        .expect(422)
    })

    test('POST / with invalid accountId (not a string) returns 422', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card', accountId: 123 })
        .expect(422)
    })
  })

  describe('Paid movements protections', () => {
    const createCardWithPaidMovement = async (): Promise<{ cardId: string, movementId: string }> => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card with paid movement', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)
      const movementId = movementRes.body.id

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      return { cardId, movementId }
    }

    test('PATCH on a paid movement returns 400', async () => {
      const { movementId, cardId } = await createCardWithPaidMovement()

      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 30 })
        .expect(400)
    })

    test('DELETE on a paid movement returns 400', async () => {
      const { movementId, cardId } = await createCardWithPaidMovement()

      await supertest(server.app)
        .delete(`${path}/${cardId}/movements/${movementId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
    })

    test('DELETE credit card with paid movements returns conflict', async () => {
      const { cardId } = await createCardWithPaidMovement()

      await supertest(server.app)
        .delete(`${path}/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409)
    })

    test('DELETE credit card with only pending movements succeeds', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card with pending movement', accountId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .delete(`${path}/${cardRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      await supertest(server.app)
        .get(`${path}/${cardRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('payDebt partial amount & getMovements filter', () => {
    test('pay-debt with partial amount pays oldest movements first', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Partial Pay Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: 1000, amount: 40, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: 2000, amount: 60, type: 'expense', categoryId })
        .expect(201)

      const payRes = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 40 })
        .expect(200)

      expect(payRes.body.paidCount).toBe(1)
      expect(payRes.body.totalPaid).toBe(40)

      const movementsAfter = await supertest(server.app)
        .get(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const oldest = movementsAfter.body.find((movement: { date: number }) => movement.date === 1000)
      const newest = movementsAfter.body.find((movement: { date: number }) => movement.date === 2000)
      expect(oldest.status).toBe('paid')
      expect(newest.status).toBe('pending')
    })

    test('pay-debt with amount does not exceed the requested amount when a smaller movement is available', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Amount Cap Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: 1000, amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: 2000, amount: 100, type: 'expense', categoryId })
        .expect(201)

      const payRes = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(200)

      // The 100 EUR movement would push the total to 120, well past the requested 50,
      // so it must not be included: only the 20 EUR movement is paid.
      expect(payRes.body.paidCount).toBe(1)
      expect(payRes.body.totalPaid).toBe(20)
    })

    test('pay-debt with movementIds containing an invalid id returns 400', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalid Movement Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementRes.body.id, 'nonexistent-movement'] })
        .expect(400)

      // The valid movement must remain untouched (whole request rejected).
      const movements = await supertest(server.app)
        .get(`${path}/${cardId}/movements?status=pending`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(movements.body.length).toBe(1)
    })

    test('GET /:id/movements?status=paid only returns paid movements', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Filter Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 10, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      const paidMovements = await supertest(server.app)
        .get(`${path}/${cardId}/movements?status=paid`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(paidMovements.body.length).toBe(2)
      expect(paidMovements.body.every((m: { status: string }) => m.status === 'paid')).toBe(true)

      const pendingMovements = await supertest(server.app)
        .get(`${path}/${cardId}/movements?status=pending`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(pendingMovements.body.length).toBe(0)
    })
  })

  describe('Movement / credit card mismatch protection', () => {
    test('PATCH movement using another card id in the path returns 404', async () => {
      const cardA = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card A', accountId })
        .expect(201)

      const cardB = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card B', accountId })
        .expect(201)

      const movement = await supertest(server.app)
        .post(`${path}/${cardA.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${cardB.body.id}/movements/${movement.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 30 })
        .expect(404)
    })

    test('DELETE movement using another card id in the path returns 404', async () => {
      const cardA = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card A', accountId })
        .expect(201)

      const cardB = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card B', accountId })
        .expect(201)

      const movement = await supertest(server.app)
        .post(`${path}/${cardA.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .delete(`${path}/${cardB.body.id}/movements/${movement.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('Ownership validation', () => {
    test('POST / with an accountId belonging to another user returns 404', async () => {
      const otherUsername = generateUsername()
      sqliteDb.insert(users).values({ id: generateId(), username: otherUsername, password: 'pwd', createdAt: new Date() }).run()
      const otherAccount = await accountsRepository.create(otherUsername, { name: 'Other Account', bank: 'Santander', balance: 500 })

      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Rogue Card', accountId: otherAccount.id })
        .expect(404)

      sqliteDb.delete(accounts).where(eq(accounts.user, otherUsername)).run()
      sqliteDb.delete(users).where(eq(users.username, otherUsername)).run()
    })

    test('POST /:id/movements with a categoryId belonging to another user returns 404', async () => {
      const otherUsername = generateUsername()
      sqliteDb.insert(users).values({ id: generateId(), username: otherUsername, password: 'pwd', createdAt: new Date() }).run()
      const otherCategoryId = generateId()
      await sqliteDb.insert(categories).values({
        id: otherCategoryId,
        name: 'Other Category',
        type: 'expense',
        user: otherUsername
      }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Card', accountId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 10, categoryId: otherCategoryId })
        .expect(404)

      sqliteDb.delete(categories).where(eq(categories.user, otherUsername)).run()
      sqliteDb.delete(users).where(eq(users.username, otherUsername)).run()
    })
  })

  describe('tags & store-by-name (parity with bank transactions)', () => {
    test('POST /:id/movements accepts tags and a free-text store name', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Tags Card', accountId })
        .expect(201)

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 25,
          categoryId,
          storeId: 'Mercadona',
          tags: ['Groceries', 'groceries', '  Food  ']
        })
        .expect(201)

      expect(movementRes.body.tags).toEqual(['groceries', 'food'])
      expect(movementRes.body.store.name).toBe('Mercadona')

      // Reusing the same store name should reuse the existing store, not duplicate it.
      const storeRows = sqliteDb.select().from(stores).where(eq(stores.user, username)).all()
      expect(storeRows.filter((store) => store.name === 'Mercadona')).toHaveLength(1)
    })

    test('PATCH /:id/movements/:movementId updates tags', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Tags Edit Card', accountId })
        .expect(201)

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 10, categoryId, tags: ['old-tag'] })
        .expect(201)

      const updated = await supertest(server.app)
        .patch(`${path}/${cardRes.body.id}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tags: ['new-tag'] })
        .expect(200)

      expect(updated.body.tags).toEqual(['new-tag'])
    })

    test('pay-debt propagates the movement tags to the created transaction', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Tags Pay Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 30, categoryId, tags: ['recurring'] })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      const paidMovement = await sqliteDb.select().from(creditCardMovements)
        .where(eq(creditCardMovements.id, movementRes.body.id)).get()!
      const createdTransaction = sqliteDb.select().from(transactions)
        .where(eq(transactions.id, paidMovement.transactionId!)).get()!

      expect(createdTransaction.tags).toEqual(['recurring'])
    })

    test('pay-debt keeps the original movement date on the created transaction', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Date Pay Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const originalDate = Date.now() - 30 * 24 * 60 * 60 * 1000
      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: originalDate, amount: 20, type: 'expense', categoryId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      const paidMovement = await sqliteDb.select().from(creditCardMovements)
        .where(eq(creditCardMovements.id, movementRes.body.id)).get()!
      const createdTransaction = sqliteDb.select().from(transactions)
        .where(eq(transactions.id, paidMovement.transactionId!)).get()!

      expect(createdTransaction.date).toBe(originalDate)
    })

    test('creates a split pending movement and pay-debt copies lines to the transaction', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Split Pay Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 65, tags: ['comida'] },
            { categoryId: homeCategoryId, amount: 35, tags: ['hogar'] }
          ]
        })
        .expect(201)

      expect(movementRes.body.categoryId).toBe(categoryId)
      expect(movementRes.body.tags).toEqual([])
      expect(movementRes.body.splits).toHaveLength(2)
      expect(movementRes.body.splits[0]).toMatchObject({ categoryId, amount: 65, tags: ['comida'] })

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ all: true })
        .expect(200)

      const paidMovement = sqliteDb.select().from(creditCardMovements)
        .where(eq(creditCardMovements.id, movementRes.body.id)).get()!
      const createdTransaction = sqliteDb.select().from(transactions)
        .where(eq(transactions.id, paidMovement.transactionId!)).get()!
      expect(createdTransaction.categoryId).toBe(categoryId)
      expect(createdTransaction.tags).toEqual([])

      const lines = sqliteDb.select().from(transactionSplits)
        .where(eq(transactionSplits.transactionId, createdTransaction.id)).all()
      expect(lines).toHaveLength(2)
      expect(lines.map(line => line.amount).sort()).toEqual([35, 65])
    })

    test('replaces splits on a pending movement', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Edit Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 80,
          categoryId,
          splits: [
            { categoryId, amount: 50 },
            { categoryId: homeCategoryId, amount: 30 }
          ]
        })
        .expect(201)

      const edited = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 90,
          categoryId: homeCategoryId,
          splits: [
            { categoryId: homeCategoryId, amount: 40, tags: ['hogar'] },
            { categoryId, amount: 50 }
          ]
        })
        .expect(200)

      expect(edited.body.categoryId).toBe(homeCategoryId)
      expect(edited.body.tags).toEqual([])
      expect(edited.body.splits).toHaveLength(2)
      expect(edited.body.splits[0]).toMatchObject({ categoryId: homeCategoryId, amount: 40, tags: ['hogar'] })
    })

    test('rejects a movement with a single split line', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bad Split Card', accountId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 10, categoryId, splits: [{ categoryId, amount: 10 }] })
        .expect(422)
    })

    test('rejects splits whose rounded amounts do not add up to the total (sub-cent precision)', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Precision Card', accountId })
        .expect(201)

      // Each line rounds to 0.00 individually (0.004 -> 0), but their raw sum
      // (0.008) rounds to 0.01, matching `amount`. The persisted rows would
      // sum to 0 instead of 0.01 if the validator summed unrounded amounts.
      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 0.01,
          categoryId,
          splits: [
            { categoryId, amount: 0.004 },
            { categoryId, amount: 0.004 }
          ]
        })
        .expect(422)
    })

    test('rejects movement with more than 2 decimal places in amount', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Decimal Card', accountId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 15.555,
          categoryId
        })
        .expect(422)
    })

    test('rejects movement splits with more than 2 decimal places in amount', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Decimal Split Card', accountId })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 10,
          categoryId,
          splits: [
            { categoryId, amount: 5.001 },
            { categoryId, amount: 4.999 }
          ]
        })
        .expect(422)
    })

    test('rejects movement splits with more than 5 categories', async () => {
      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Max Splits Card', accountId })
        .expect(201)

      const extraCategories = [
        generateId(),
        generateId(),
        generateId(),
        generateId(),
        generateId()
      ]
      for (const extraCategoryId of extraCategories) {
        sqliteDb.insert(categories).values({
          id: extraCategoryId,
          name: `Cat ${extraCategoryId}`,
          type: 'expense',
          user: username
        }).run()
      }

      await supertest(server.app)
        .post(`${path}/${cardRes.body.id}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 60,
          categoryId,
          splits: [
            { categoryId, amount: 10 },
            { categoryId: extraCategories[0], amount: 10 },
            { categoryId: extraCategories[1], amount: 10 },
            { categoryId: extraCategories[2], amount: 10 },
            { categoryId: extraCategories[3], amount: 10 },
            { categoryId: extraCategories[4], amount: 10 }
          ]
        })
        .expect(422)
    })

    test('PATCH amount only (no splits) on a split movement rejects an amount inconsistent with the existing lines', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Amount Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 110 })
        .expect(422)
    })

    test('PATCH date only (no splits) on a split movement succeeds and keeps the lines untouched', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch Date', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Date Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const newDate = Date.now() - 1000
      const edited = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: newDate })
        .expect(200)

      expect(edited.body.date).toBe(newDate)
      expect(edited.body.splits).toHaveLength(2)
      expect(edited.body.splits.map((split: { amount: number }) => split.amount).sort()).toEqual([40, 60])
    })

    test('PATCH type only (no splits) on a split movement is rejected', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch Type', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Type Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'income' })
        .expect(422)
    })

    test('PATCH categoryId only (no splits) on a split movement is rejected', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch Category', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Category Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: homeCategoryId })
        .expect(422)
    })

    test('PATCH tags only (no splits) on a split movement is rejected', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch Tags', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Tags Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      // Tags on the parent of a split movement are invisible in the UI and
      // discarded by pay-debt, so a tags-only PATCH must be rejected just
      // like type/categoryId, instead of silently persisting hidden tags.
      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tags: ['solo-tag'] })
        .expect(422)
    })

    test('PATCH splits only (no amount) succeeds when the lines add up to the stored amount', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Patch Splits Only', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Splits Only Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const edited = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { categoryId, amount: 70 },
            { categoryId: homeCategoryId, amount: 30 }
          ]
        })
        .expect(200)

      expect(edited.body.amount).toBe(100)
      expect(edited.body.splits.map((split: { amount: number }) => split.amount).sort()).toEqual([30, 70])
    })

    test('PATCH splits without type on an income movement validates against the movement type, not "expense"', async () => {
      const incomeCategoryId = generateId()
      const incomeCategoryId2 = generateId()
      sqliteDb.insert(categories).values([
        { id: incomeCategoryId, name: 'Refund 1', type: 'income', user: username },
        { id: incomeCategoryId2, name: 'Refund 2', type: 'income', user: username }
      ]).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patch Income Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 50, type: 'income', categoryId: incomeCategoryId })
        .expect(201)

      // Income-typed lines on an income movement must be accepted even
      // though `type` is not part of this PATCH.
      const edited = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { categoryId: incomeCategoryId, amount: 20 },
            { categoryId: incomeCategoryId2, amount: 30 }
          ]
        })
        .expect(200)
      expect(edited.body.splits).toHaveLength(2)

      // Expense-typed lines on that same income movement must be rejected
      // instead of assumed valid because `type` defaults to "expense".
      await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { categoryId, amount: 20 },
            { categoryId: incomeCategoryId2, amount: 30 }
          ]
        })
        .expect(422)
    })

    test('PATCH splits: [] removes the split lines and applies the new categoryId/tags to the parent', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Hogar Remove Split', type: 'expense', user: username }).run()

      const cardRes = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Remove Split Card', accountId })
        .expect(201)
      const cardId = cardRes.body.id

      const movementRes = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      // This is the payload the client now sends when the user disables
      // split mode ("Quitar división"): the full body plus an empty
      // `splits` array, instead of omitting the key entirely.
      const edited = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: movementRes.body.date,
          amount: 100,
          type: 'expense',
          categoryId: homeCategoryId,
          tags: ['sin-dividir'],
          splits: []
        })
        .expect(200)

      expect(edited.body.categoryId).toBe(homeCategoryId)
      expect(edited.body.tags).toEqual(['sin-dividir'])
      expect(edited.body.splits).toBeUndefined()

      const remainingSplits = sqliteDb.select().from(creditCardMovementSplits)
        .where(eq(creditCardMovementSplits.movementId, movementRes.body.id)).all()
      expect(remainingSplits).toHaveLength(0)
    })

    test('PATCH Scenario A: changing amount without splits on a split movement returns 422', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Home A', type: 'expense', user: username }).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Scenario A Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const patchResponse = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 120 })
        .expect(422)

      expect(patchResponse.body.message).toBe(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH)
    })

    test('PATCH Scenario B: changing categoryId or type on a split movement without splits returns 422, but works on normal movement', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Home B', type: 'expense', user: username }).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Scenario B Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      // Split movement: changing categoryId without splits is rejected
      const splitMovement = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const categoryReject = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${splitMovement.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: homeCategoryId })
        .expect(422)
      expect(categoryReject.body.message).toBe(ERROR_MESSAGE.TRANSACTION.SPLIT_FIELDS_REQUIRE_SPLITS)

      // Normal movement: changing categoryId succeeds
      const normalMovement = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 80,
          categoryId
        })
        .expect(201)

      const normalUpdate = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${normalMovement.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoryId: homeCategoryId })
        .expect(200)
      expect(normalUpdate.body.categoryId).toBe(homeCategoryId)
    })

    test('PATCH Scenario C: changing amount and providing matching splits updates both', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Home C', type: 'expense', user: username }).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Scenario C Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: homeCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const patchResponse = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 150,
          splits: [
            { categoryId, amount: 90 },
            { categoryId: homeCategoryId, amount: 60 }
          ]
        })
        .expect(200)

      expect(patchResponse.body.amount).toBe(150)
      expect(patchResponse.body.splits).toHaveLength(2)
      expect(patchResponse.body.splits.map((split: { amount: number }) => split.amount).sort()).toEqual([60, 90])
    })

    test('PATCH Scenario E: providing exactly 1 split is rejected with 422', async () => {
      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Scenario E Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId
        })
        .expect(201)

      const patchResponse = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { categoryId, amount: 100 }
          ]
        })
        .expect(422)

      expect(patchResponse.body.message).toBe(ERROR_MESSAGE.TRANSACTION.SPLIT_MIN)
    })

    test('PATCH with repeated categories across splits is accepted with 200', async () => {
      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Repeated Cat Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId
        })
        .expect(201)

      const patchResponse = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { categoryId, amount: 60, tags: ['tag1'] },
            { categoryId, amount: 40, tags: ['tag2'] }
          ]
        })
        .expect(200)

      expect(patchResponse.body.splits).toHaveLength(2)
      expect(patchResponse.body.splits[0].categoryId).toBe(categoryId)
      expect(patchResponse.body.splits[1].categoryId).toBe(categoryId)
    })

    test('PATCH note on split movement preserves splits untouched', async () => {
      const homeCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: homeCategoryId, name: 'Home Note', type: 'expense', user: username }).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Note Preservation Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          note: 'Original note',
          splits: [
            { categoryId, amount: 60, tags: ['line1'] },
            { categoryId: homeCategoryId, amount: 40, tags: ['line2'] }
          ]
        })
        .expect(201)

      const patchResponse = await supertest(server.app)
        .patch(`${path}/${cardId}/movements/${movementResponse.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ note: 'Updated note' })
        .expect(200)

      expect(patchResponse.body.note).toBe('Updated note')
      expect(patchResponse.body.splits).toHaveLength(2)
      expect(patchResponse.body.splits[0].tags).toEqual(['line1'])
      expect(patchResponse.body.splits[1].tags).toEqual(['line2'])
    })

    test('payDebt rejects already paid movement with ALREADY_PAID', async () => {
      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Already Paid Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 50, categoryId })
        .expect(201)

      // First pay-debt succeeds
      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(200)

      // Second pay-debt fails with 400 ALREADY_PAID
      const secondAttempt = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(400)

      expect(secondAttempt.body.message).toBe(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID)
    })

    test('payDebt rejects movement of another user with INVALID_PAYMENT', async () => {
      const otherUsername = generateUsername()
      const otherToken = await requestLogin(server.app, { username: otherUsername })
      const otherAccount = await accountsRepository.create(otherUsername, { name: 'Other Checking', bank: 'Santander', balance: 500 })

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'User Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      // Other user card and movement
      const otherCardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other Card', accountId: otherAccount.id })
        .expect(201)

      const otherCategory = generateId()
      sqliteDb.insert(categories).values({ id: otherCategory, name: 'Other Cat', type: 'expense', user: otherUsername }).run()

      const otherMovementResponse = await supertest(server.app)
        .post(`${path}/${otherCardResponse.body.id}/movements`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ date: Date.now(), amount: 30, categoryId: otherCategory })
        .expect(201)

      // First user attempts to pay other user's movement
      const unauthorizedPay = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [otherMovementResponse.body.id] })
        .expect(400)

      expect(unauthorizedPay.body.message).toBe(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT)

      // Clean up other user
      sqliteDb.delete(creditCardMovements).where(eq(creditCardMovements.user, otherUsername)).run()
      sqliteDb.delete(creditCards).where(eq(creditCards.user, otherUsername)).run()
      sqliteDb.delete(accounts).where(eq(accounts.user, otherUsername)).run()
      sqliteDb.delete(categories).where(eq(categories.user, otherUsername)).run()
      sqliteDb.delete(users).where(eq(users.username, otherUsername)).run()
    })

    test('payDebt rolls back completely when split category is missing', async () => {
      const deletedCategoryId = generateId()
      sqliteDb.insert(categories).values({ id: deletedCategoryId, name: 'To Be Deleted', type: 'expense', user: username }).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Rollback Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId,
          splits: [
            { categoryId, amount: 60 },
            { categoryId: deletedCategoryId, amount: 40 }
          ]
        })
        .expect(201)

      const initialAccount = sqliteDb.select().from(accounts).where(eq(accounts.id, accountId)).get()!

      // Temporarily disable foreign keys to delete the category and simulate category loss
      sqliteDb.run(sql`PRAGMA foreign_keys = OFF`)
      sqliteDb.delete(categories).where(eq(categories.id, deletedCategoryId)).run()
      sqliteDb.run(sql`PRAGMA foreign_keys = ON`)

      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(404)

      // Verify complete rollback: movement still pending, no transaction, balance unchanged
      const movementAfter = sqliteDb.select().from(creditCardMovements).where(eq(creditCardMovements.id, movementResponse.body.id)).get()!
      expect(movementAfter.status).toBe('pending')
      expect(movementAfter.transactionId).toBeNull()

      const createdTxs = sqliteDb.select().from(transactions).where(eq(transactions.creditCardId, cardId)).all()
      expect(createdTxs).toHaveLength(0)

      const accountAfter = sqliteDb.select().from(accounts).where(eq(accounts.id, accountId)).get()!
      expect(accountAfter.balance).toBe(initialAccount.balance)
    })

    test('concurrent payDebt requests on the same movement result in exactly one payment transaction', async () => {
      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Concurrent Pay Card', accountId })
        .expect(201)
      const cardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${cardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: Date.now(), amount: 75, categoryId })
        .expect(201)

      // First pay-debt succeeds
      await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(200)

      // Second pay-debt fails with ALREADY_PAID
      const secondAttempt = await supertest(server.app)
        .post(`${path}/${cardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(400)

      expect(secondAttempt.body.message).toBe(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID)

      // Exactly 1 transaction exists
      const createdTxs = sqliteDb.select().from(transactions).where(eq(transactions.creditCardId, cardId)).all()
      expect(createdTxs).toHaveLength(1)
    })

    test('payDebt preserves splits with repeated categories and distinct tags without data loss', async () => {
      const foodCategoryId = generateId()
      const transportCategoryId = generateId()
      sqliteDb.insert(categories).values([
        { id: foodCategoryId, name: 'Comida Pay Debt', type: 'expense', user: username },
        { id: transportCategoryId, name: 'Transporte Pay Debt', type: 'expense', user: username }
      ]).run()

      const cardResponse = await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Preserve Splits Pay Card', accountId })
        .expect(201)
      const testCardId = cardResponse.body.id

      const movementResponse = await supertest(server.app)
        .post(`${path}/${testCardId}/movements`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: Date.now(),
          amount: 100,
          categoryId: foodCategoryId,
          splits: [
            { categoryId: foodCategoryId, amount: 30, tags: ['supermarket'] },
            { categoryId: foodCategoryId, amount: 20, tags: ['restaurant'] },
            { categoryId: transportCategoryId, amount: 50, tags: ['taxi'] }
          ]
        })
        .expect(201)

      await supertest(server.app)
        .post(`${path}/${testCardId}/pay-debt`)
        .set('Authorization', `Bearer ${token}`)
        .send({ movementIds: [movementResponse.body.id] })
        .expect(200)

      const paidMovement = sqliteDb.select().from(creditCardMovements)
        .where(eq(creditCardMovements.id, movementResponse.body.id)).get()!
      expect(paidMovement.status).toBe('paid')

      const createdTx = sqliteDb.select().from(transactions)
        .where(eq(transactions.id, paidMovement.transactionId!)).get()!
      expect(createdTx.amount).toBe(100)
      expect(createdTx.categoryId).toBe(foodCategoryId)
      expect(createdTx.tags).toEqual([])

      const createdSplits = sqliteDb.select().from(transactionSplits)
        .where(eq(transactionSplits.transactionId, createdTx.id)).all()
      expect(createdSplits).toHaveLength(3)

      const foodSplits = createdSplits.filter(split => split.categoryId === foodCategoryId)
      expect(foodSplits).toHaveLength(2)
      expect(foodSplits.map(split => ({ amount: split.amount, tags: split.tags }))).toEqual(
        expect.arrayContaining([
          { amount: 30, tags: ['supermarket'] },
          { amount: 20, tags: ['restaurant'] }
        ])
      )

      const transportSplits = createdSplits.filter(split => split.categoryId === transportCategoryId)
      expect(transportSplits).toHaveLength(1)
      expect(transportSplits[0].amount).toBe(50)
      expect(transportSplits[0].tags).toEqual(['taxi'])
    })
  })
})

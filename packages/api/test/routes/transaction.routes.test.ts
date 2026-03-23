import supertest from 'supertest'
import {
  AccountModel,
  IAccount,
  ITransaction,
  mongoose,
  StoreModel,
  TransactionModel,
  TransactionType
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertAccount, insertCategory, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'
import { ERROR_MESSAGE } from '../../src/i18n'
import { roundNumber } from '../../src/utils'
import { getTransactionAmount } from '../../src/services/utils'

const testDatabase = require('../test-db')(mongoose)

describe('Transaction', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('POST /', () => {
    const path = '/api/transactions'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterAll(() => testDatabase.cleanAll())

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).post(path).expect(401)
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).auth(token, { type: 'bearer' }).expect(422)
    })

    test.each(['date', 'category', 'amount', 'type', 'account'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const params: Record<string, string | number> = {
        date: faker.date.past().getTime(),
        category: (await insertCategory({ user }))._id.toString(),
        amount: faker.finance.amount(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
        account: (await insertAccount({ user }))._id.toString()
      }

      delete params[param]
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when the account is of other user, it should response an error with status code 404', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: faker.date.past().getTime(),
          category: (await insertCategory({ user }))._id.toString(),
          amount: faker.finance.amount(),
          type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
          account: (await insertAccount())._id.toString(),
          note: faker.lorem.sentence(),
          store: faker.company.name()
        })
        .expect(404)
    })

    test('when success creating an transaction', async () => {
      await supertest(server.app)
        .post(path)
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: faker.date.past().getTime(),
          category: (await insertCategory({ user }))._id.toString(),
          amount: faker.finance.amount(),
          type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
          account: (await insertAccount({ user }))._id.toString(),
          note: faker.lorem.sentence(),
          store: faker.company.name()
        })
        .expect(200)
    })

    test('when success creating an transaction with same store, it should was create only one store', async () => {
      const store = faker.company.name()
      for (let i = 0; i < 2; i++) {
        await supertest(server.app)
          .post(path)
          .set('Authorization', `Bearer ${token}`)
          .send({
            date: faker.date.past().getTime(),
            category: (await insertCategory({ user }))._id.toString(),
            amount: faker.finance.amount(),
            type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
            account: (await insertAccount({ user }))._id.toString(),
            note: faker.lorem.sentence(),
            store
          })
          .expect(200)
      }

      expect(await StoreModel.countDocuments({ name: store })).toBe(1)
    })

    test.each([TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable])(
      'when success creating an transaction of %s and balance is updated', async (type) => {
        const balance = faker.number.float({ multipleOf: 0.01, max: 10000, min: 0 })
        const account = await insertAccount({ user, balance })
        const transactionAmount = faker.number.float({ multipleOf: 0.01, max: 100, min: 0 })

        await supertest(server.app)
          .post(path)
          .set('Authorization', `Bearer ${token}`)
          .send({
            date: faker.date.past().getTime(),
            category: (await insertCategory({ user }))._id.toString(),
            amount: transactionAmount,
            type,
            account: account._id.toString(),
            note: faker.lorem.sentence(),
            store: faker.company.name()
          })

        const accountAfter = await AccountModel.findById(account._id) as IAccount
        const balanceAfter = type === TransactionType.Income
          ? account.balance + transactionAmount
          : type === TransactionType.Expense
            ? account.balance - transactionAmount
            : account.balance

        expect(accountAfter?.balance).toBe(roundNumber(balanceAfter))
      })
  })

  describe('GET /summary', () => {
    const path = '/api/transactions/summary'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(() => TransactionModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when months param is invalid, it should response an error with status code 422', async () => {
      await supertest(server.app).get(`${path}?months=abc`).auth(token, { type: 'bearer' }).expect(422)
    })

    test('when there are no transactions, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when there are transactions, it should return monthly totals grouped by month', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Gastos en el mes actual: 100 + 50 = 150
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TransactionType.Expense })
      await insertTransaction({ user, date: new Date(year, month, 10).getTime(), amount: 50, type: TransactionType.Expense })
      // Ingreso en el mes actual
      await insertTransaction({ user, date: new Date(year, month, 3).getTime(), amount: 2000, type: TransactionType.Income })
      // Gasto en el mes anterior
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      await insertTransaction({ user, date: new Date(prevYear, prevMonth, 15).getTime(), amount: 300, type: TransactionType.Expense })

      const response = await supertest(server.app)
        .get(`${path}?months=2`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(2)
      // Mes anterior: solo gasto
      expect(response.body[0].expenses).toBe(300)
      expect(response.body[0].income).toBe(0)
      // Mes actual: ingreso y gastos
      expect(response.body[1].income).toBe(2000)
      expect(response.body[1].expenses).toBe(150)
    })

    test('when a expense has negative amount (refund), it should subtract from expenses total', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Gasto de 50 y devolución de 40 → gasto neto 10
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 50, type: TransactionType.Expense })
      await insertTransaction({ user, date: new Date(year, month, 10).getTime(), amount: -40, type: TransactionType.Expense })

      const response = await supertest(server.app)
        .get(`${path}?months=1`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].expenses).toBe(10)
    })

    test('transactions of type not_computable should not be included in totals', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 500, type: TransactionType.NotComputable })
      await insertTransaction({ user, date: new Date(year, month, 6).getTime(), amount: 100, type: TransactionType.Expense })

      const response = await supertest(server.app)
        .get(`${path}?months=1`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].expenses).toBe(100)
      expect(response.body[0].income).toBe(0)
    })

    test('transactions of other users should not be included', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Transacción de otro usuario
      await insertTransaction({ date: new Date(year, month, 5).getTime(), amount: 9999, type: TransactionType.Expense })
      // Transacción del usuario autenticado
      await insertTransaction({ user, date: new Date(year, month, 5).getTime(), amount: 100, type: TransactionType.Expense })

      const response = await supertest(server.app)
        .get(`${path}?months=1`)
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].expenses).toBe(100)
    })
  })

  describe('GET /', () => {
    const path = '/api/transactions'
    let token: string
    const user: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when then user have no transactions, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user have transactions, it should return the transactions', async () => {
      const transaction: any = await insertTransaction({
        user
      })

      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body[0]._id).toEqual(transaction._id.toString())
      expect(response.body[0].date).toEqual(transaction.date)
      expect(response.body[0].category._id).toEqual(transaction.category._id.toString())
      expect(response.body[0].amount).toEqual(transaction.amount)
      expect(response.body[0].type).toEqual(transaction.type)
      expect(response.body[0].account._id).toEqual(transaction.account._id.toString())
      expect(response.body[0].note).toEqual(transaction.note)
      expect(response.body[0].store._id).toEqual(transaction.store._id.toString())
    })
  })

  describe('PUT /:id', () => {
    const path = (id: string) => `/api/transactions/${id}`
    let token: string
    const username: string = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username })
    })

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).put(path('any')).expect(401)
    })

    test('when the transaction does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).put(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(ERROR_MESSAGE.TRANSACTION.NOT_FOUND)
        })
    })

    test('when no params provided, it should response an error with status code 422', async () => {
      const transaction: ITransaction = await insertTransaction({ user: username })
      await supertest(server.app).put(path(transaction._id.toString())).auth(token, { type: 'bearer' })
        .send({})
        .expect(422)
    })

    test.each(['date', 'category', 'amount', 'type', 'account'])('when no %s param provided, it should response an error with status code 422', async (param: string) => {
      const transaction: ITransaction = await insertTransaction({ user: username })
      const params: Record<string, string | number> = {
        date: faker.date.past().getTime(),
        category: (await insertCategory({ user: username }))._id.toString(),
        amount: faker.number.int(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
        account: (await insertAccount({ user: username }))._id.toString()

      }

      delete params[param]
      await supertest(server.app)
        .put(path(transaction._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(422)
    })

    test('when transaction is successfully edited', async () => {
      const transaction: ITransaction = await insertTransaction({ user: username })

      const params: Record<string, string | number> = {
        date: faker.date.past().getTime(),
        category: (await insertCategory({ user: username }))._id.toString(),
        amount: faker.number.int(),
        type: Math.random() > 0.5 ? TransactionType.Expense : TransactionType.Income,
        account: (await insertAccount({ user: username }))._id.toString()

      }
      await supertest(server.app)
        .put(path(transaction._id.toString()))
        .set('Authorization', `Bearer ${token}`)
        .send(params)
        .expect(200)
    })

    test.each([{
      old: TransactionType.Income,
      updated: TransactionType.Expense
    }, {
      old: TransactionType.Expense,
      updated: TransactionType.NotComputable
    },
    {
      old: TransactionType.NotComputable,
      updated: TransactionType.Income
    }, {
      old: TransactionType.Expense,
      updated: TransactionType.Income
    },
    {
      old: TransactionType.Income,
      updated: TransactionType.NotComputable
    }, {
      old: TransactionType.NotComputable,
      updated: TransactionType.Expense
    }])(
      'when success editing an transaction of %s and balance is updated', async ({ old, updated }) => {
        const balance = faker.number.float({ multipleOf: 0.01, max: 10000, min: 0 })
        const amountOld = faker.number.float({ multipleOf: 0.01, max: 100, min: 0 })
        const amountNew = faker.number.float({ multipleOf: 0.01, max: 100, min: 0 })

        const account = await insertAccount({ user: username, balance: roundNumber(balance) })

        const params = {
          date: faker.date.past().getTime(),
          category: (await insertCategory({ user: username }))._id.toString(),
          amount: amountOld,
          type: old,
          account: account._id.toString(),
          note: faker.lorem.sentence()
        }

        const responseCreated = await supertest(server.app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send(params)

        const transaction = responseCreated.body

        await supertest(server.app)
          .put(path(transaction._id.toString()))
          .set('Authorization', `Bearer ${token}`)
          .send({
            type: updated,
            amount: amountNew,
            account: transaction.account,
            note: transaction.note,
            date: transaction.date,
            category: transaction.category
          })

        const balanceAfter = balance + getTransactionAmount({ amount: amountNew, type: updated } as any)
        const balanceAfterRound = Math.round(balanceAfter * 100) / 100
        const accountAfter = await AccountModel.findById(account._id) as IAccount

        expect(accountAfter?.balance).toBe(roundNumber(balanceAfterRound))
      })
  })

  describe('DELETE /:id', () => {
    const path = (id: string) => `/api/transactions/${id}`
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterEach(() => TransactionModel.deleteMany({}))

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).delete(path('any')).expect(401)
    })

    test('when the transaction does not exist, it should response an error with status code 404', async () => {
      await supertest(server.app).delete(path('62a39498c4497e1fe3c2bf35')).auth(token, { type: 'bearer' })
        .expect(404)
    })

    test('when exist the transaction, but belongs to another user it should response with status code 404', async () => {
      const transaction: ITransaction = await insertTransaction()

      await supertest(server.app).delete(path(transaction._id.toString())).set('Authorization', `Bearer ${token}`).expect(404)
    })

    test('when exist the transaction, it should response with status code 204', async () => {
      const transaction: ITransaction = await insertTransaction({ user })

      await supertest(server.app).delete(path(transaction._id.toString())).set('Authorization', `Bearer ${token}`).expect(204)
    })

    test.each([TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable])('when delete the transaction of type %s, it should decrease the account balance', async (type) => {
      const balance = faker.number.float({ multipleOf: 0.01, max: 10000, min: 0 })
      const account = await insertAccount({ user, balance })

      const params = {
        date: faker.date.past().getTime(),
        category: (await insertCategory({ user }))._id.toString(),
        amount: faker.number.float({ multipleOf: 0.01, max: 100, min: 0 }),
        type,
        account: account._id.toString(),
        note: faker.lorem.sentence()
      }

      const responseCreated = await supertest(server.app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(params)

      const transaction = responseCreated.body

      await supertest(server.app).delete(path(transaction._id.toString())).set('Authorization', `Bearer ${token}`).expect(204)
      expect(await AccountModel.findById(account._id)).toHaveProperty('balance', roundNumber(balance))
    })
  })
})

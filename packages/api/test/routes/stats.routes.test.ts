import supertest from 'supertest'
import {
  mongoose,
  TransactionModel,
  TRANSACTION
} from '@soker90/finper-models'

import { server } from '../../src/server'

import { requestLogin } from '../request-login'
import { insertAccount, insertCategory, insertTransaction } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Stats', () => {
  beforeAll(() => testDatabase.connect())

  afterAll(() => testDatabase.close())

  describe('GET /api/stats/tags/available', () => {
    const path = '/api/stats/tags/available'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterAll(() => testDatabase.cleanAll())

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when the user has no transactions with tags, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user has transactions with tags, it should return unique sorted tags', async () => {
      await TransactionModel.deleteMany({ user })
      await insertTransaction({ user, type: TRANSACTION.Expense, tags: ['juan', 'viaje-japon'] as any })
      await insertTransaction({ user, type: TRANSACTION.Expense, tags: ['juan', 'casa'] as any })
      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual(['casa', 'juan', 'viaje-japon'])
    })
  })

  describe('GET /api/stats/tags', () => {
    const path = '/api/stats/tags'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterAll(() => testDatabase.cleanAll())

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get(path).expect(401)
    })

    test('when the user has no tagged transactions, it should return an empty array', async () => {
      await supertest(server.app).get(path).auth(token, { type: 'bearer' }).expect(200, [])
    })

    test('when the user has tagged expenses, it should return summary with byCategory', async () => {
      await TransactionModel.deleteMany({ user })
      const category = await insertCategory({ user, type: TRANSACTION.Expense })
      const account = await insertAccount({ user })
      const currentYear = new Date().getFullYear()
      const dateInYear = new Date(currentYear, 5, 15).getTime()

      await TransactionModel.create({
        date: dateInYear,
        category: category._id,
        amount: 100,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['juan'],
        user
      })

      await TransactionModel.create({
        date: dateInYear,
        category: category._id,
        amount: 200,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['juan'],
        user
      })

      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].tag).toBe('juan')
      expect(response.body[0].totalAmount).toBe(300)
      expect(response.body[0].transactionCount).toBe(2)
      expect(response.body[0].byCategory).toHaveLength(1)
      expect(response.body[0].byCategory[0].categoryName).toBe(category.name)
    })

    test('it should exclude income and not_computable transactions', async () => {
      await TransactionModel.deleteMany({ user })
      const category = await insertCategory({ user, type: TRANSACTION.Expense })
      const account = await insertAccount({ user })
      const currentYear = new Date().getFullYear()
      const dateInYear = new Date(currentYear, 5, 15).getTime()

      await TransactionModel.create({
        date: dateInYear,
        category: category._id,
        amount: 100,
        type: TRANSACTION.Income,
        account: account._id,
        tags: ['salario'],
        user
      })

      await TransactionModel.create({
        date: dateInYear,
        category: category._id,
        amount: 50,
        type: TRANSACTION.NotComputable,
        account: account._id,
        tags: ['transferencia'],
        user
      })

      const response = await supertest(server.app).get(path).auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(0)
    })

    test('it should filter by year when query param provided', async () => {
      await TransactionModel.deleteMany({ user })
      const category = await insertCategory({ user, type: TRANSACTION.Expense })
      const account = await insertAccount({ user })

      await TransactionModel.create({
        date: new Date(2024, 5, 15).getTime(),
        category: category._id,
        amount: 100,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['viaje'],
        user
      })

      await TransactionModel.create({
        date: new Date(2025, 5, 15).getTime(),
        category: category._id,
        amount: 200,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['viaje'],
        user
      })

      const response2024 = await supertest(server.app).get(`${path}?year=2024`).auth(token, { type: 'bearer' })
      expect(response2024.body).toHaveLength(1)
      expect(response2024.body[0].totalAmount).toBe(100)

      const response2025 = await supertest(server.app).get(`${path}?year=2025`).auth(token, { type: 'bearer' })
      expect(response2025.body).toHaveLength(1)
      expect(response2025.body[0].totalAmount).toBe(200)
    })
  })

  describe('GET /api/stats/tags/:tagName', () => {
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    afterAll(() => testDatabase.cleanAll())

    test('when token is not provided, it should response an error with status code 401', async () => {
      await supertest(server.app).get('/api/stats/tags/juan').expect(401)
    })

    test('when called without year, it should return historic data', async () => {
      await TransactionModel.deleteMany({ user })
      const category = await insertCategory({ user, type: TRANSACTION.Expense })
      const account = await insertAccount({ user })

      await TransactionModel.create({
        date: new Date(2024, 5, 15).getTime(),
        category: category._id,
        amount: 100,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['vicente'],
        user
      })

      await TransactionModel.create({
        date: new Date(2025, 5, 15).getTime(),
        category: category._id,
        amount: 200,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['vicente'],
        user
      })

      const response = await supertest(server.app).get('/api/stats/tags/vicente').auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body.tag).toBe('vicente')
      expect(response.body.totalAmount).toBe(300)
      expect(response.body.years).toHaveLength(2)
      expect(response.body.years[0].year).toBe(2025)
      expect(response.body.years[1].year).toBe(2024)
    })

    test('when called with year, it should return detail for that year', async () => {
      await TransactionModel.deleteMany({ user })
      const category = await insertCategory({ user, type: TRANSACTION.Expense })
      const account = await insertAccount({ user })
      const dateInYear = new Date(2025, 5, 15).getTime()

      await TransactionModel.create({
        date: dateInYear,
        category: category._id,
        amount: 150,
        type: TRANSACTION.Expense,
        account: account._id,
        tags: ['viaje-japon'],
        user
      })

      const response = await supertest(server.app).get('/api/stats/tags/viaje-japon?year=2025').auth(token, { type: 'bearer' })
      expect(response.statusCode).toBe(200)
      expect(response.body.tag).toBe('viaje-japon')
      expect(response.body.year).toBe(2025)
      expect(response.body.totalAmount).toBe(150)
      expect(response.body.transactionCount).toBe(1)
      expect(response.body.byCategory).toHaveLength(1)
      expect(response.body.byCategory[0].categoryName).toBe(category.name)
      expect(response.body.transactions).toHaveLength(1)
    })
  })
})

import supertest from 'supertest'
import { mongoose } from '@soker90/finper-models'

import { server } from '../../src/server'
import { requestLogin } from '../request-login'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

describe('Wealth', () => {
  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  describe('GET /api/wealth/fire-projection', () => {
    const path = '/api/wealth/fire-projection'
    let token: string
    const user = generateUsername()

    beforeAll(async () => {
      token = await requestLogin(server.app, { username: user })
    })

    test('when token is not provided, it should respond 401', async () => {
      await supertest(server.app)
        .get(path)
        .query({ currentBalance: 50000, annualExpenses: 24000 })
        .expect(401)
    })

    test('when currentBalance is missing, it should respond 422', async () => {
      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ annualExpenses: 24000 })
        .expect(422)
    })

    test('when annualExpenses is missing, it should respond 422', async () => {
      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000 })
        .expect(422)
    })

    test('when annualReturnRate is above 100, it should respond 422', async () => {
      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, annualReturnRate: 101 })
        .expect(422)
    })

    test('when withdrawalRate is below 1, it should respond 422', async () => {
      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, withdrawalRate: 0 })
        .expect(422)
    })

    test('when withdrawalRate is above 20, it should respond 422', async () => {
      await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, withdrawalRate: 21 })
        .expect(422)
    })

    test('when valid params are provided, it should return a fire projection', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, annualReturnRate: 7, withdrawalRate: 4, monthlyContribution: 500 })
        .expect(200)

      expect(res.body).toHaveProperty('netWorth')
      expect(res.body).toHaveProperty('fireTarget')
      expect(res.body).toHaveProperty('yearsToFire')
      expect(res.body).toHaveProperty('projectionPoints')
      expect(Array.isArray(res.body.projectionPoints)).toBe(true)
      expect(res.body.projectionPoints.length).toBeGreaterThan(0)
    })

    test('when valid params with debts, it should subtract debts from netWorth', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({
          currentBalance: 50000,
          annualExpenses: 24000,
          totalDebts: 10000,
          totalLoansPending: 5000,
          totalReceivable: 2000,
          monthlyContribution: 500
        })
        .expect(200)

      // netWorth = 50000 - 10000 - 5000 + 2000 = 37000
      expect(res.body.netWorth).toBe(37000)
    })

    test('when balance is 0, it should return a projection starting from 0', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 0, annualExpenses: 24000, monthlyContribution: 500 })
        .expect(200)

      expect(res.body.netWorth).toBe(0)
      expect(res.body.projectionPoints[0].netWorth).toBeGreaterThan(0)
    })

    test('each projection point should have all required fields', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, monthlyContribution: 500 })
        .expect(200)

      const firstPoint = res.body.projectionPoints[0]
      expect(firstPoint).toHaveProperty('year')
      expect(firstPoint).toHaveProperty('netWorth')
      expect(firstPoint).toHaveProperty('contributions')
      expect(firstPoint).toHaveProperty('interest')
      expect(firstPoint).toHaveProperty('fireTarget')
      expect(firstPoint).toHaveProperty('isFireReached')
      expect(typeof firstPoint.isFireReached).toBe('boolean')
    })

    test('fireTarget should equal annualExpenses / withdrawalRate', async () => {
      const res = await supertest(server.app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .query({ currentBalance: 50000, annualExpenses: 24000, withdrawalRate: 4, monthlyContribution: 500 })
        .expect(200)

      // fireTarget = 24000 / 0.04 = 600000
      expect(res.body.fireTarget).toBe(600000)
    })
  })
})

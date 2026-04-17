import {
  SubscriptionModel,
  TransactionModel,
  mongoose
} from '@soker90/finper-models'
import { faker } from '@faker-js/faker'

import SubscriptionService, { advanceDate } from '../../src/services/subscription.service'
import {
  insertAccount,
  insertCategory,
  insertSubscription,
  insertTransaction
} from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

// ── Helper ───────────────────────────────────────────────────────────────────
const makeDate = (year: number, month: number, day: number): number =>
  new Date(year, month - 1, day, 12, 0, 0).getTime()

const toYMD = (ts: number): string => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── advanceDate ───────────────────────────────────────────────────────────────
describe('advanceDate', () => {
  const base = makeDate(2024, 3, 15) // 15 March 2024

  test('monthly → advances 1 month', () => {
    expect(toYMD(advanceDate(base, 1))).toBe('2024-04-15')
  })

  test('bimonthly → advances 2 months', () => {
    expect(toYMD(advanceDate(base, 2))).toBe('2024-05-15')
  })

  test('quarterly → advances 3 months', () => {
    expect(toYMD(advanceDate(base, 3))).toBe('2024-06-15')
  })

  test('semi-annually → advances 6 months', () => {
    expect(toYMD(advanceDate(base, 6))).toBe('2024-09-15')
  })

  test('annually → advances 1 year', () => {
    expect(toYMD(advanceDate(base, 12))).toBe('2025-03-15')
  })

  test('monthly edge case: Jan 31 clamps to last day of February', () => {
    // Feb 2024 has 29 days (leap year) → result should be Feb 29, not Mar 2
    const jan31 = makeDate(2024, 1, 31)
    expect(toYMD(advanceDate(jan31, 1))).toBe('2024-02-29')
  })

  test('annually edge case: Feb 29 leap year clamps to Feb 28 next year', () => {
    // Feb 29 in 2024 (leap) → 2025 is not a leap year → clamp to Feb 28
    const feb29 = makeDate(2024, 2, 29)
    expect(toYMD(advanceDate(feb29, 12))).toBe('2025-02-28')
  })
})

// ── SubscriptionService ───────────────────────────────────────────────────────
describe('SubscriptionService', () => {
  const service = new SubscriptionService()

  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())

  // ── getSubscriptions ────────────────────────────────────────────────────
  describe('getSubscriptions', () => {
    test('returns empty array when user has no subscriptions', async () => {
      const result = await service.getSubscriptions(generateUsername())
      expect(result).toEqual([])
    })

    test('returns only subscriptions belonging to the given user', async () => {
      const user = generateUsername()
      await insertSubscription({ user })
      await insertSubscription({ user })
      await insertSubscription({ user: generateUsername() }) // other user

      const result = await service.getSubscriptions(user)
      expect(result.length).toBe(2)
      result.forEach(s => expect(s.user).toBe(user))
    })

    test('populates categoryId and accountId', async () => {
      const user = generateUsername()
      await insertSubscription({ user })

      const [subscription] = await service.getSubscriptions(user)
      expect(subscription.categoryId).toHaveProperty('name')
      expect(subscription.accountId).toHaveProperty('name')
      expect(subscription.accountId).toHaveProperty('bank')
    })

    test('returns subscriptions ordered by nextPaymentDate ascending (nulls first)', async () => {
      const user = generateUsername()
      const now = Date.now()
      await insertSubscription({ user, nextPaymentDate: now + 10000 })
      await insertSubscription({ user, nextPaymentDate: null })
      await insertSubscription({ user, nextPaymentDate: now + 5000 })

      const result = await service.getSubscriptions(user)
      expect(result[0].nextPaymentDate).toBeNull()
      expect((result[1] as any).nextPaymentDate).toBe(now + 5000)
      expect((result[2] as any).nextPaymentDate).toBe(now + 10000)
    })
  })

  // ── getSubscription ─────────────────────────────────────────────────────
  describe('getSubscription', () => {
    test('returns null when subscription does not exist', async () => {
      const result = await service.getSubscription('62a39498c4497e1fe3c2bf35', generateUsername())
      expect(result).toBeNull()
    })

    test('returns null when subscription belongs to a different user', async () => {
      const owner = generateUsername()
      const sub = await insertSubscription({ user: owner })

      const result = await service.getSubscription(sub._id.toString(), generateUsername())
      expect(result).toBeNull()
    })

    test('returns the document when id and user match', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user })

      const result = await service.getSubscription(sub._id.toString(), user)
      expect(result).not.toBeNull()
      expect(result!._id.toString()).toBe(sub._id.toString())
    })
  })

  // ── addSubscription ─────────────────────────────────────────────────────
  describe('addSubscription', () => {
    test('persists all required fields', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      const created = await service.addSubscription({
        name: 'Netflix',
        amount: 9.99,
        cycle: 1,
        categoryId: category._id as any,
        accountId: account._id as any,
        user
      })

      expect(created.name).toBe('Netflix')
      expect(created.amount).toBe(9.99)
      expect(created.cycle).toBe(1)
      expect(created.user).toBe(user)
    })

    test('nextPaymentDate is null after creation', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      const created = await service.addSubscription({
        name: faker.company.name(),
        amount: 5,
        cycle: 1,
        categoryId: category._id as any,
        accountId: account._id as any,
        user,
        nextPaymentDate: 999999999 // should be stripped
      } as any)

      expect(created.nextPaymentDate).toBeNull()
    })

    test('persists optional logoUrl when provided', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const logoUrl = 'https://example.com/logo.png'

      const created = await service.addSubscription({
        name: faker.company.name(),
        amount: 5,
        cycle: 2,
        categoryId: category._id as any,
        accountId: account._id as any,
        logoUrl,
        user
      })

      expect(created.logoUrl).toBe(logoUrl)
    })
  })

  // ── editSubscription ────────────────────────────────────────────────────
  describe('editSubscription', () => {
    test('returns null when subscription does not exist', async () => {
      const result = await service.editSubscription('62a39498c4497e1fe3c2bf35', { name: 'New' })
      expect(result).toBeNull()
    })

    test('applies a partial update without altering other fields', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user, name: 'Original', amount: 10 })

      const updated = await service.editSubscription(sub._id.toString(), { name: 'Updated' })

      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated')
      expect(updated!.amount).toBe(10)
    })

    test('returns the updated document (new: true)', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user, name: 'Before' })
      const newName = faker.company.name()

      const updated = await service.editSubscription(sub._id.toString(), { name: newName })

      expect(updated!.name).toBe(newName)
    })

    test('recalculates nextPaymentDate when cycle is updated', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, cycle: 1 })
      const txDate = makeDate(2024, 3, 10)
      await TransactionModel.create({ date: txDate, amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      const result = await service.editSubscription(sub._id.toString(), { cycle: 3 })

      const expectedDate = advanceDate(txDate, 3)
      // el documento retornado ya refleja la nueva fecha
      expect((result as any)?.nextPaymentDate).toBe(expectedDate)
      // y la BD también está actualizada
      const inDb = await SubscriptionModel.findById(sub._id).lean()
      expect(inDb?.nextPaymentDate).toBe(expectedDate)
    })
  })

  // ── deleteSubscription ──────────────────────────────────────────────────
  describe('deleteSubscription', () => {
    test('removes the document from the collection', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user })

      await service.deleteSubscription(sub._id.toString())

      const found = await SubscriptionModel.findById(sub._id).lean()
      expect(found).toBeNull()
    })

    test('does not throw when the id does not exist', async () => {
      await expect(service.deleteSubscription('62a39498c4497e1fe3c2bf35')).resolves.toBeUndefined()
    })

    test('unlinks all transactions linked to the subscription', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const tx1 = await TransactionModel.create({ date: Date.now() - 10000, amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })
      const tx2 = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      await service.deleteSubscription(sub._id.toString())

      const updated1 = await TransactionModel.findById(tx1._id).lean()
      const updated2 = await TransactionModel.findById(tx2._id).lean()
      expect((updated1 as any)?.subscriptionId).toBeUndefined()
      expect((updated2 as any)?.subscriptionId).toBeUndefined()
    })
  })

  // ── getActiveSubscriptions ──────────────────────────────────────────────
  describe('getActiveSubscriptions', () => {
    test('returns empty array when user has no subscriptions', async () => {
      const result = await service.getActiveSubscriptions(generateUsername())
      expect(result).toEqual([])
    })

    test('returns only subscriptions of the specified user', async () => {
      const user = generateUsername()
      await insertSubscription({ user })
      await insertSubscription({ user })

      const result = await service.getActiveSubscriptions(user)
      expect(result.length).toBe(2)
      result.forEach(s => expect(s.user).toBe(user))
    })
  })

  // ── getTransactionsBySubscription ───────────────────────────────────────
  describe('getTransactionsBySubscription', () => {
    test('returns empty array when no transactions are linked', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user })

      const result = await service.getTransactionsBySubscription(sub._id.toString(), user)
      expect(result).toEqual([])
    })

    test('returns only transactions with the given subscriptionId', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user })
      const tx = await insertTransaction({ user })
      await TransactionModel.findByIdAndUpdate(tx._id, { subscriptionId: sub._id })
      await insertTransaction({ user }) // unlinked, should not appear

      const result = await service.getTransactionsBySubscription(sub._id.toString(), user)
      expect(result.length).toBe(1)
      expect(result[0]._id.toString()).toBe(tx._id.toString())
    })

    test('does not return transactions belonging to another user', async () => {
      const user = generateUsername()
      const otherUser = generateUsername()
      const sub = await insertSubscription({ user })

      // Other user's transaction mistakenly pointing to our subscription
      const otherTx = await insertTransaction({ user: otherUser })
      await TransactionModel.findByIdAndUpdate(otherTx._id, { subscriptionId: sub._id })

      const result = await service.getTransactionsBySubscription(sub._id.toString(), user)
      expect(result.length).toBe(0)
    })
  })

  // ── getMatchingTransactions ─────────────────────────────────────────────
  describe('getMatchingTransactions', () => {
    test('returns empty array when subscription does not exist', async () => {
      const result = await service.getMatchingTransactions('62a39498c4497e1fe3c2bf35', generateUsername())
      expect(result).toEqual([])
    })

    test('returns unlinked transactions matching category and account', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })

      // Matching transaction (same category + account, no subscriptionId)
      await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        user
      })

      const result = await service.getMatchingTransactions(sub._id.toString(), user)
      expect(result.length).toBeGreaterThanOrEqual(1)
      result.forEach(tx => {
        expect((tx.category as any)._id.toString()).toBe(category._id.toString())
        expect((tx.account as any)._id.toString()).toBe(account._id.toString())
      })
    })

    test('excludes transactions already linked to a subscription', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const otherSub = await insertSubscription({ user })

      // Linked transaction → should NOT appear
      await TransactionModel.create({
        date: Date.now(),
        amount: 9.99,
        type: 'expense',
        category: category._id,
        account: account._id,
        subscriptionId: otherSub._id,
        user
      })

      const result = await service.getMatchingTransactions(sub._id.toString(), user)
      result.forEach(tx => {
        expect((tx as any).subscriptionId).toBeUndefined()
      })
    })

    test('returns at most 50 results', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })

      await Promise.all(
        Array.from({ length: 55 }, () =>
          TransactionModel.create({
            date: Date.now(),
            amount: 9.99,
            type: 'expense',
            category: category._id,
            account: account._id,
            user
          })
        )
      )

      const result = await service.getMatchingTransactions(sub._id.toString(), user)
      expect(result.length).toBe(50)
    })
  })

  // ── linkTransactions ────────────────────────────────────────────────────
  describe('linkTransactions', () => {
    test('sets subscriptionId on all specified transactions', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const tx1 = await TransactionModel.create({ date: Date.now() - 10000, amount: 9.99, type: 'expense', category: category._id, account: account._id, user })
      const tx2 = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, user })

      await service.linkTransactions(sub._id.toString(), [tx1._id.toString(), tx2._id.toString()])

      const updated1 = await TransactionModel.findById(tx1._id).lean()
      const updated2 = await TransactionModel.findById(tx2._id).lean()
      expect(updated1?.subscriptionId?.toString()).toBe(sub._id.toString())
      expect(updated2?.subscriptionId?.toString()).toBe(sub._id.toString())
    })

    test('does not modify transactions not in the array', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const txLinked = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, user })
      const txOther = await TransactionModel.create({ date: Date.now(), amount: 5, type: 'expense', category: category._id, account: account._id, user })

      await service.linkTransactions(sub._id.toString(), [txLinked._id.toString()])

      const other = await TransactionModel.findById(txOther._id).lean()
      expect((other as any)?.subscriptionId).toBeUndefined()
    })

    test('recalculates nextPaymentDate after linking', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, cycle: 1 })
      const txDate = makeDate(2024, 3, 10)
      const tx = await TransactionModel.create({ date: txDate, amount: 9.99, type: 'expense', category: category._id, account: account._id, user })

      await service.linkTransactions(sub._id.toString(), [tx._id.toString()])

      const updated = await SubscriptionModel.findById(sub._id).lean()
      expect(updated?.nextPaymentDate).toBe(advanceDate(txDate, 1))
    })
  })

  // ── unlinkTransaction ───────────────────────────────────────────────────
  describe('unlinkTransaction', () => {
    test('removes subscriptionId from the transaction', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const tx = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      await service.unlinkTransaction(sub._id.toString(), tx._id.toString())

      const updated = await TransactionModel.findById(tx._id).lean()
      expect((updated as any)?.subscriptionId).toBeUndefined()
    })

    test('does not modify other linked transactions', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const txKeep = await TransactionModel.create({ date: Date.now() - 5000, amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })
      const txUnlink = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      await service.unlinkTransaction(sub._id.toString(), txUnlink._id.toString())

      const kept = await TransactionModel.findById(txKeep._id).lean()
      expect(kept?.subscriptionId?.toString()).toBe(sub._id.toString())
    })

    test('sets nextPaymentDate to null when no more linked transactions remain', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id })
      const tx = await TransactionModel.create({ date: Date.now(), amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      await service.unlinkTransaction(sub._id.toString(), tx._id.toString())

      const updated = await SubscriptionModel.findById(sub._id).lean()
      expect(updated?.nextPaymentDate).toBeNull()
    })
  })

  // ── recalculateNextPaymentDate ──────────────────────────────────────────
  describe('recalculateNextPaymentDate', () => {
    test('sets nextPaymentDate to null when no transactions are linked', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({ user, nextPaymentDate: Date.now() })

      await service.recalculateNextPaymentDate(sub._id.toString())

      const updated = await SubscriptionModel.findById(sub._id).lean()
      expect(updated?.nextPaymentDate).toBeNull()
    })

    test('sets nextPaymentDate to advanceDate(lastTxDate, cycle)', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const sub = await insertSubscription({ user, accountId: account._id, categoryId: category._id, cycle: 2 })

      const oldDate = makeDate(2024, 1, 1)
      const newDate = makeDate(2024, 2, 1)
      // Two transactions: the service should pick the most recent (newDate)
      await TransactionModel.create({ date: oldDate, amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })
      await TransactionModel.create({ date: newDate, amount: 9.99, type: 'expense', category: category._id, account: account._id, subscriptionId: sub._id, user })

      await service.recalculateNextPaymentDate(sub._id.toString())

      const updated = await SubscriptionModel.findById(sub._id).lean()
      expect(updated?.nextPaymentDate).toBe(advanceDate(newDate, 2))
    })

    test('does nothing when the subscription does not exist', async () => {
      await expect(service.recalculateNextPaymentDate('62a39498c4497e1fe3c2bf35')).resolves.toBeNull()
    })
  })
})

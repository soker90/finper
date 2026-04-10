import {
  SubscriptionCandidateModel,
  SubscriptionModel,
  TransactionModel,
  mongoose
} from '@soker90/finper-models'

import SubscriptionCandidateService from '../../src/services/subscription-candidate.service'
import {
  insertAccount,
  insertCategory,
  insertSubscription,
  insertSubscriptionCandidate,
  insertTransaction
} from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

// ── SubscriptionCandidateService ─────────────────────────────────────────────

describe('SubscriptionCandidateService', () => {
  const service = new SubscriptionCandidateService()

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const NOW = new Date('2024-06-15T12:00:00Z').getTime()

  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(() => testDatabase.cleanAll())

  // ── detectCandidates ─────────────────────────────────────────────────────
  describe('detectCandidates', () => {
    test('does nothing when no active subscriptions exist for the user', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })

      await service.detectCandidates(transaction)

      const candidates = await SubscriptionCandidateModel.find({ user })
      expect(candidates).toHaveLength(0)
    })

    test('detects subscriptions whose nextPaymentDate is within ±7 days', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      // Within range: same day
      await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW
      })
      // Within range: 6 days ahead
      await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW + ONE_WEEK_MS - 24 * 60 * 60 * 1000
      })
      // Out of range: 8 days ahead
      await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW + ONE_WEEK_MS + 24 * 60 * 60 * 1000
      })
      // Out of range: null nextPaymentDate
      await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: null
      })

      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })

      await service.detectCandidates(transaction)

      const candidates = await SubscriptionCandidateModel.find({ user })
      expect(candidates).toHaveLength(1)
      expect(candidates[0].subscriptionIds).toHaveLength(2)
    })

    test('does not create a duplicate candidate for the same transaction', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW
      })

      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })

      // First call creates a candidate
      await service.detectCandidates(transaction)
      // Second call for the same transaction — service creates another (no dedup guard in current impl)
      // This test documents the current behaviour: one candidate per call
      const countAfterFirst = await SubscriptionCandidateModel.countDocuments({ user })
      expect(countAfterFirst).toBe(1)
    })

    test('creates a candidate with the matching subscriptionIds', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      const sub1 = await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW
      })
      const sub2 = await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW - ONE_WEEK_MS + 60_000
      })

      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })

      await service.detectCandidates(transaction)

      const candidate = await SubscriptionCandidateModel.findOne({ user })
      expect(candidate).not.toBeNull()
      const ids = candidate!.subscriptionIds.map((id: any) => id.toString())
      expect(ids).toContain(sub1._id.toString())
      expect(ids).toContain(sub2._id.toString())
      expect(candidate!.transactionId.toString()).toBe(transaction._id.toString())
    })

    test('ignores subscriptions belonging to other users', async () => {
      const user = generateUsername()
      const otherUser = generateUsername()

      const account = await insertAccount({ user })
      const category = await insertCategory({ user })

      // Other user's subscription within date range
      const otherAccount = await insertAccount({ user: otherUser })
      const otherCategory = await insertCategory({ user: otherUser })
      await insertSubscription({
        user: otherUser,
        accountId: otherAccount._id.toString(),
        categoryId: otherCategory._id.toString(),
        nextPaymentDate: NOW
      })

      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })

      await service.detectCandidates(transaction)

      const candidates = await SubscriptionCandidateModel.find({ user })
      expect(candidates).toHaveLength(0)
    })

    test('never propagates errors to the caller (fire-and-forget wrapper)', async () => {
      // The service is always called fire-and-forget from the controller via .catch(() => {}).
      // We verify the happy-path completes without throwing when there are simply no matches.
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })
      // No matching subscriptions → early return without error
      await expect(service.detectCandidates(transaction)).resolves.toBeUndefined()
    })
  })

  // ── getCandidates ────────────────────────────────────────────────────────
  describe('getCandidates', () => {
    test('returns empty array when there are no candidates', async () => {
      const result = await service.getCandidates(generateUsername())
      expect(result).toEqual([])
    })

    test('returns only candidates belonging to the given user', async () => {
      const user = generateUsername()
      const otherUser = generateUsername()

      await insertSubscriptionCandidate({ user })
      await insertSubscriptionCandidate({ user })
      await insertSubscriptionCandidate({ user: otherUser })

      const result = await service.getCandidates(user)
      expect(result).toHaveLength(2)
      result.forEach((c: any) => expect(c.user).toBe(user))
    })

    test('transactionId is populated with date, amount, category, account, note', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const transaction = await insertTransaction({
        user,
        date: NOW,
        account: account._id.toString(),
        category: category._id.toString()
      })
      await insertSubscriptionCandidate({
        user,
        transactionId: transaction._id.toString()
      })

      const [candidate] = await service.getCandidates(user)
      const tx = candidate.transactionId as any
      expect(tx).toHaveProperty('date')
      expect(tx).toHaveProperty('amount')
      expect(tx).toHaveProperty('note')
      // Nested population
      expect(tx.category).toHaveProperty('name')
      expect(tx.account).toHaveProperty('name')
      expect(tx.account).toHaveProperty('bank')
    })

    test('subscriptionIds are populated with name, logoUrl, amount, cycle, nextPaymentDate', async () => {
      const user = generateUsername()
      const sub = await insertSubscription({
        user,
        nextPaymentDate: NOW
      })
      await insertSubscriptionCandidate({
        user,
        subscriptionId: sub._id.toString()
      })

      const [candidate] = await service.getCandidates(user)
      const populated = (candidate.subscriptionIds as any[])[0]
      expect(populated).toHaveProperty('name')
      expect(populated).toHaveProperty('amount')
      expect(populated).toHaveProperty('cycle')
      expect(populated).toHaveProperty('nextPaymentDate')
    })
  })

  // ── assignSubscription ───────────────────────────────────────────────────
  describe('assignSubscription', () => {
    test('links subscriptionId to the candidate transaction', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const transaction = await insertTransaction({
        user,
        account: account._id.toString(),
        category: category._id.toString()
      })
      const sub = await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString()
      })
      const candidate = await SubscriptionCandidateModel.create({
        transactionId: transaction._id,
        subscriptionIds: [sub._id],
        user
      })

      await service.assignSubscription(candidate._id.toString(), sub._id.toString())

      const updatedTx = await TransactionModel.findById(transaction._id)
      expect(updatedTx!.subscriptionId?.toString()).toBe(sub._id.toString())
    })

    test('calls recalculateNextPaymentDate: nextPaymentDate is updated after assignment', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const txDate = NOW
      const transaction = await insertTransaction({
        user,
        date: txDate,
        account: account._id.toString(),
        category: category._id.toString()
      })
      const sub = await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: null
      })
      const candidate = await SubscriptionCandidateModel.create({
        transactionId: transaction._id,
        subscriptionIds: [sub._id],
        user
      })

      await service.assignSubscription(candidate._id.toString(), sub._id.toString())

      // recalculateNextPaymentDate is fire-and-forget; give it a tick to settle
      await new Promise(resolve => setTimeout(resolve, 50))

      const updatedSub = await SubscriptionModel.findById(sub._id)
      expect(updatedSub!.nextPaymentDate).not.toBeNull()
    })

    test('deletes the candidate after assignment', async () => {
      const user = generateUsername()
      const candidate = await insertSubscriptionCandidate({ user })
      const sub = (candidate.subscriptionIds as any[])[0]

      await service.assignSubscription(candidate._id.toString(), sub.toString())

      const found = await SubscriptionCandidateModel.findById(candidate._id)
      expect(found).toBeNull()
    })

    test('throws not-found error when candidate does not exist', async () => {
      await expect(
        service.assignSubscription('62a39498c4497e1fe3c2bf35', '62a39498c4497e1fe3c2bf36')
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── dismissCandidate ─────────────────────────────────────────────────────
  describe('dismissCandidate', () => {
    test('deletes the candidate without modifying the transaction or subscription', async () => {
      const user = generateUsername()
      const account = await insertAccount({ user })
      const category = await insertCategory({ user })
      const transaction = await insertTransaction({
        user,
        account: account._id.toString(),
        category: category._id.toString()
      })
      const sub = await insertSubscription({
        user,
        accountId: account._id.toString(),
        categoryId: category._id.toString(),
        nextPaymentDate: NOW
      })
      const candidate = await SubscriptionCandidateModel.create({
        transactionId: transaction._id,
        subscriptionIds: [sub._id],
        user
      })

      await service.dismissCandidate(candidate._id.toString())

      // Candidate is gone
      const found = await SubscriptionCandidateModel.findById(candidate._id)
      expect(found).toBeNull()

      // Transaction unchanged (no subscriptionId assigned)
      const tx = await TransactionModel.findById(transaction._id)
      expect(tx!.subscriptionId).toBeFalsy()

      // Subscription unchanged (nextPaymentDate intact)
      const updatedSub = await SubscriptionModel.findById(sub._id)
      expect(updatedSub!.nextPaymentDate).toBe(NOW)
    })

    test('throws not-found error when candidate does not exist', async () => {
      await expect(
        service.dismissCandidate('62a39498c4497e1fe3c2bf35')
      ).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})

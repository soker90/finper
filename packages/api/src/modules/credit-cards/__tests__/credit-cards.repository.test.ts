import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { schema, generateId, type DB } from '@soker90/finper-db'
import { CreditCardsRepository } from '../credit-cards.repository'

const { users, accounts, categories, stores } = schema

describe('CreditCardsRepository (integration)', () => {
  let db: DB
  let repository: CreditCardsRepository
  const username = 'cc-repo-user'
  let accountId: string
  let categoryId: string
  let storeId: string

  beforeEach(() => {
    db = createTestDb()
    repository = new CreditCardsRepository(db)

    db.insert(users).values({ id: generateId(), username, password: 'pwd', createdAt: new Date() }).run()

    accountId = generateId()
    db.insert(accounts).values({ id: accountId, name: 'Main', bank: 'BBVA', balance: 1000, user: username }).run()

    categoryId = generateId()
    db.insert(categories).values({ id: categoryId, name: 'Shopping', type: 'expense', user: username }).run()

    storeId = generateId()
    db.insert(stores).values({ id: storeId, name: 'Amazon', user: username }).run()
  })

  afterEach(() => {
    closeTestDb(db)
  })

  it('creates and retrieves a credit card with account populated', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId, limit: 1000 })

    expect(card?.name).toBe('Visa')
    expect(card?.account?.name).toBe('Main')
    expect(card?.currentDebt).toBe(0)

    const found = await repository.findById(card!.id, username)
    expect(found?.id).toBe(card!.id)
  })

  it('findByUser aggregates pending debt per card', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId })
    await repository.createMovement(username, {
      creditCardId: card!.id, date: 1, amount: 100, type: 'expense', categoryId
    })
    await repository.createMovement(username, {
      creditCardId: card!.id, date: 2, amount: 30, type: 'income', categoryId
    })

    const cards = await repository.findByUser(username)
    expect(cards.find((c) => c.id === card!.id)?.currentDebt).toBe(70)
  })

  it('findMovementById includes category and store joins', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId })
    const movement = await repository.createMovement(username, {
      creditCardId: card!.id, date: 1, amount: 50, type: 'expense', categoryId, storeId
    })

    const found = await repository.findMovementById(movement!.id, username)

    expect(found?.category?.name).toBe('Shopping')
    expect(found?.store?.name).toBe('Amazon')
  })

  it('hasPaidMovements is false for a card with only pending movements', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId })
    await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 50, type: 'expense', categoryId })

    await expect(repository.hasPaidMovements(card!.id, username)).resolves.toBe(false)
  })

  it('hasPaidMovements is true after paying debt', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId })
    await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 50, type: 'expense', categoryId })

    await repository.payDebt({ card: card!, user: username, payload: { all: true } })

    await expect(repository.hasPaidMovements(card!.id, username)).resolves.toBe(true)
  })

  it('deletePendingMovementsByCard removes card and its pending movements', async () => {
    const card = await repository.create(username, { name: 'Visa', accountId })
    await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 50, type: 'expense', categoryId })

    const deleted = await repository.deletePendingMovementsByCard(card!.id, username)

    expect(deleted).toBe(true)
    await expect(repository.findById(card!.id, username)).resolves.toBeUndefined()
    await expect(repository.findMovements(card!.id, username)).resolves.toEqual([])
  })

  describe('payDebt', () => {
    it('pays the full debt (all) and updates account balance', async () => {
      const card = await repository.create(username, { name: 'Visa', accountId })
      await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 100, type: 'expense', categoryId })
      await repository.createMovement(username, { creditCardId: card!.id, date: 2, amount: 50, type: 'expense', categoryId })

      const result = await repository.payDebt({ card: card!, user: username, payload: { all: true } })

      expect(result.paidCount).toBe(2)
      expect(result.totalPaid).toBe(150)
      expect(result.card?.currentDebt).toBe(0)
    })

    it('pays a partial amount picking oldest movements first', async () => {
      const card = await repository.create(username, { name: 'Visa', accountId })
      await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 100, type: 'expense', categoryId })
      await repository.createMovement(username, { creditCardId: card!.id, date: 2, amount: 50, type: 'expense', categoryId })

      const result = await repository.payDebt({ card: card!, user: username, payload: { amount: 100 } })

      expect(result.paidCount).toBe(1)
      expect(result.totalPaid).toBe(100)
      expect(result.card?.currentDebt).toBe(50)
    })

    it('pays specific movementIds', async () => {
      const card = await repository.create(username, { name: 'Visa', accountId })
      const m1 = await repository.createMovement(username, { creditCardId: card!.id, date: 1, amount: 100, type: 'expense', categoryId })
      await repository.createMovement(username, { creditCardId: card!.id, date: 2, amount: 50, type: 'expense', categoryId })

      const result = await repository.payDebt({ card: card!, user: username, payload: { movementIds: [m1!.id] } })

      expect(result.paidCount).toBe(1)
      expect(result.totalPaid).toBe(100)
      expect(result.card?.currentDebt).toBe(50)
    })

    it('returns undefined card when there is nothing to pay', async () => {
      const card = await repository.create(username, { name: 'Visa', accountId })

      const result = await repository.payDebt({ card: card!, user: username, payload: {} })

      expect(result.card).toBeUndefined()
      expect(result.paidCount).toBe(0)
    })
  })
})

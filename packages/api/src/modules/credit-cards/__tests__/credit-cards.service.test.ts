import Boom from '@hapi/boom'
import { CreditCardsService } from '../credit-cards.service'
import type { ICreditCardsRepository, CreditCardRow, CreditCardMovementRow } from '../credit-cards.repository'

const buildCard = (overrides: Partial<CreditCardRow> = {}): CreditCardRow => ({
  id: 'card-1',
  name: 'Visa',
  accountId: 'acc-1',
  limit: 1000,
  logoBank: null,
  user: 'user1',
  account: { id: 'acc-1', name: 'Main', bank: 'BBVA', balance: 500 },
  currentDebt: 0,
  ...overrides
})

const buildMovement = (overrides: Partial<CreditCardMovementRow> = {}): CreditCardMovementRow => ({
  id: 'mov-1',
  creditCardId: 'card-1',
  date: 1000,
  amount: 100,
  type: 'expense',
  categoryId: 'cat-1',
  storeId: null,
  note: null,
  status: 'pending',
  paidAt: null,
  transactionId: null,
  tags: [],
  user: 'user1',
  category: { id: 'cat-1', name: 'Shopping', type: 'expense' },
  store: null,
  ...overrides
})

const buildRepository = (overrides: Partial<ICreditCardsRepository> = {}): jest.Mocked<ICreditCardsRepository> => ({
  findByUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasPaidMovements: jest.fn(),
  deletePendingMovementsByCard: jest.fn(),
  findMovements: jest.fn(),
  findMovementById: jest.fn(),
  createMovement: jest.fn(),
  updateMovement: jest.fn(),
  deleteMovement: jest.fn(),
  payDebt: jest.fn(),
  ...overrides
} as unknown as jest.Mocked<ICreditCardsRepository>)

describe('CreditCardsService', () => {
  describe('getCreditCards', () => {
    it('returns serialized cards for the user', async () => {
      const repository = buildRepository({ findByUser: jest.fn().mockResolvedValue([buildCard()]) })
      const service = new CreditCardsService(repository)

      const result = await service.getCreditCards('user1')

      expect(repository.findByUser).toHaveBeenCalledWith('user1')
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Visa')
    })
  })

  describe('getCreditCardById', () => {
    it('throws 404 when the card does not exist', async () => {
      const repository = buildRepository({ findById: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.getCreditCardById('missing', 'user1')).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns the serialized card when found', async () => {
      const repository = buildRepository({ findById: jest.fn().mockResolvedValue(buildCard()) })
      const service = new CreditCardsService(repository)

      const result = await service.getCreditCardById('card-1', 'user1')

      expect(result?.name).toBe('Visa')
    })
  })

  describe('createCreditCard', () => {
    it('delegates creation to the repository', async () => {
      const repository = buildRepository({ create: jest.fn().mockResolvedValue(buildCard()) })
      const service = new CreditCardsService(repository)

      const result = await service.createCreditCard({ user: 'user1', data: { name: 'Visa', accountId: 'acc-1' } })

      expect(repository.create).toHaveBeenCalledWith('user1', { name: 'Visa', accountId: 'acc-1' })
      expect(result?.name).toBe('Visa')
    })
  })

  describe('editCreditCard', () => {
    it('throws 404 when the card does not exist', async () => {
      const repository = buildRepository({ update: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.editCreditCard({ id: 'missing', user: 'user1', value: { name: 'X' } }))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns the updated card', async () => {
      const repository = buildRepository({ update: jest.fn().mockResolvedValue(buildCard({ name: 'Updated' })) })
      const service = new CreditCardsService(repository)

      const result = await service.editCreditCard({ id: 'card-1', user: 'user1', value: { name: 'Updated' } })

      expect(result?.name).toBe('Updated')
    })
  })

  describe('deleteCreditCard', () => {
    it('throws 404 when the card does not exist', async () => {
      const repository = buildRepository({ findById: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.deleteCreditCard('missing', 'user1')).rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws conflict when the card has paid movements', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        hasPaidMovements: jest.fn().mockResolvedValue(true)
      })
      const service = new CreditCardsService(repository)

      await expect(service.deleteCreditCard('card-1', 'user1')).rejects.toMatchObject({ statusCode: 409 })
      expect(repository.deletePendingMovementsByCard).not.toHaveBeenCalled()
    })

    it('deletes the card together with its pending movements', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        hasPaidMovements: jest.fn().mockResolvedValue(false),
        deletePendingMovementsByCard: jest.fn().mockResolvedValue(true)
      })
      const service = new CreditCardsService(repository)

      const result = await service.deleteCreditCard('card-1', 'user1')

      expect(repository.deletePendingMovementsByCard).toHaveBeenCalledWith('card-1', 'user1')
      expect(result).toBe(true)
    })
  })

  describe('getMovements', () => {
    it('validates the card exists and returns serialized movements', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        findMovements: jest.fn().mockResolvedValue([buildMovement()])
      })
      const service = new CreditCardsService(repository)

      const result = await service.getMovements({ creditCardId: 'card-1', user: 'user1' })

      expect(repository.findMovements).toHaveBeenCalledWith('card-1', 'user1', undefined)
      expect(result).toHaveLength(1)
    })
  })

  describe('addMovement', () => {
    it('validates the card exists and creates the movement', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        createMovement: jest.fn().mockResolvedValue(buildMovement())
      })
      const service = new CreditCardsService(repository)

      const data = { date: 1000, amount: 100, type: 'expense' as const, categoryId: 'cat-1' }
      const result = await service.addMovement({ creditCardId: 'card-1', user: 'user1', data })

      expect(repository.createMovement).toHaveBeenCalledWith('user1', { creditCardId: 'card-1', ...data, tags: [] })
      expect(result?.id).toBe('mov-1')
    })
  })

  describe('editMovement', () => {
    it('throws 404 when the movement does not exist', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.editMovement({ id: 'missing', creditCardId: 'card-1', user: 'user1', value: {} }))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 404 when the movement belongs to a different credit card', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(buildMovement({ creditCardId: 'card-2' })) })
      const service = new CreditCardsService(repository)

      await expect(service.editMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1', value: { amount: 50 } }))
        .rejects.toMatchObject({ statusCode: 404 })
      expect(repository.updateMovement).not.toHaveBeenCalled()
    })

    it('throws when the movement is already paid', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(buildMovement({ status: 'paid' })) })
      const service = new CreditCardsService(repository)

      await expect(service.editMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1', value: { amount: 50 } }))
        .rejects.toMatchObject({ statusCode: 400 })
      expect(repository.updateMovement).not.toHaveBeenCalled()
    })

    it('updates the movement when pending', async () => {
      const repository = buildRepository({
        findMovementById: jest.fn().mockResolvedValue(buildMovement()),
        updateMovement: jest.fn().mockResolvedValue(buildMovement({ amount: 200 }))
      })
      const service = new CreditCardsService(repository)

      const result = await service.editMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1', value: { amount: 200 } })

      expect(result?.amount).toBe(200)
    })
  })

  describe('deleteMovement', () => {
    it('throws 404 when the movement does not exist', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.deleteMovement({ id: 'missing', creditCardId: 'card-1', user: 'user1' }))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 404 when the movement belongs to a different credit card', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(buildMovement({ creditCardId: 'card-2' })) })
      const service = new CreditCardsService(repository)

      await expect(service.deleteMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1' }))
        .rejects.toMatchObject({ statusCode: 404 })
      expect(repository.deleteMovement).not.toHaveBeenCalled()
    })

    it('throws when the movement is already paid', async () => {
      const repository = buildRepository({ findMovementById: jest.fn().mockResolvedValue(buildMovement({ status: 'paid' })) })
      const service = new CreditCardsService(repository)

      await expect(service.deleteMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1' }))
        .rejects.toMatchObject({ statusCode: 400 })
    })

    it('deletes the movement when pending', async () => {
      const repository = buildRepository({
        findMovementById: jest.fn().mockResolvedValue(buildMovement()),
        deleteMovement: jest.fn().mockResolvedValue(true)
      })
      const service = new CreditCardsService(repository)

      const result = await service.deleteMovement({ id: 'mov-1', creditCardId: 'card-1', user: 'user1' })

      expect(result).toBe(true)
    })
  })

  describe('payDebt', () => {
    it('throws 404 when the card does not exist', async () => {
      const repository = buildRepository({ findById: jest.fn().mockResolvedValue(undefined) })
      const service = new CreditCardsService(repository)

      await expect(service.payDebt({ creditCardId: 'missing', user: 'user1', payload: { all: true } }))
        .rejects.toMatchObject({ statusCode: 404 })
    })

    it('throws 400 when nothing could be paid', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        payDebt: jest.fn().mockResolvedValue({ card: undefined, paidCount: 0, totalPaid: 0 })
      })
      const service = new CreditCardsService(repository)

      await expect(service.payDebt({ creditCardId: 'card-1', user: 'user1', payload: {} }))
        .rejects.toMatchObject({ statusCode: 400 })
    })

    it('pays the full debt (all mode)', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        payDebt: jest.fn().mockResolvedValue({ card: buildCard({ currentDebt: 0 }), paidCount: 2, totalPaid: 150 })
      })
      const service = new CreditCardsService(repository)

      const result = await service.payDebt({ creditCardId: 'card-1', user: 'user1', payload: { all: true } })

      expect(repository.payDebt).toHaveBeenCalledWith({ card: buildCard(), user: 'user1', payload: { all: true } })
      expect(result.paidCount).toBe(2)
      expect(result.totalPaid).toBe(150)
    })

    it('pays a partial amount', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        payDebt: jest.fn().mockResolvedValue({ card: buildCard({ currentDebt: 50 }), paidCount: 1, totalPaid: 100 })
      })
      const service = new CreditCardsService(repository)

      const result = await service.payDebt({ creditCardId: 'card-1', user: 'user1', payload: { amount: 100 } })

      expect(result.totalPaid).toBe(100)
    })

    it('pays selected movementIds', async () => {
      const repository = buildRepository({
        findById: jest.fn().mockResolvedValue(buildCard()),
        payDebt: jest.fn().mockResolvedValue({ card: buildCard({ currentDebt: 0 }), paidCount: 1, totalPaid: 100 })
      })
      const service = new CreditCardsService(repository)

      const result = await service.payDebt({ creditCardId: 'card-1', user: 'user1', payload: { movementIds: ['mov-1'] } })

      expect(result.paidCount).toBe(1)
    })
  })
})

// Ensures Boom errors used above expose statusCode (sanity check of the helper contract)
describe('sanity', () => {
  it('Boom.notFound output has statusCode 404', () => {
    expect(Boom.notFound('x').output.statusCode).toBe(404)
  })
})

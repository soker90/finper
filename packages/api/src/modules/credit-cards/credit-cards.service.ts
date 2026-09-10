import Boom from '@hapi/boom'
import { roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { sanitizeTags, assertSplitLines, loadCategoriesById } from '../../utils'
import { db as sqliteDb } from '../../db'
import { creditCardsRepository, type ICreditCardsRepository, type CreateCreditCardData, type UpdateCreditCardData, type CreateCreditCardMovementData, type UpdateCreditCardMovementData, type PayDebtPayload, type CreditCardMovementRow } from './credit-cards.repository'
import { serializeCreditCard, serializeCreditCardMovement } from './credit-cards.serializer'

/** Validates the split-lines invariant for a PATCH against the movement it
 * would result in (existing movement merged with the request body), since
 * the request body alone may be missing `amount`/`type`/etc on a partial
 * update. This is the single place that enforces the invariant for edits —
 * the Joi schema in credit-cards.validators.ts only checks shape. */
const assertSplitInvariant = (params: { movement: CreditCardMovementRow, value: UpdateCreditCardMovementData, user: string }): void => {
  const { movement, value, user } = params
  const existingSplits = movement.splits ?? []

  if (value.splits === undefined) {
    if (existingSplits.length < 2) return

    if (value.type !== undefined || value.categoryId !== undefined || value.tags !== undefined) {
      throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_FIELDS_REQUIRE_SPLITS).output
    }

    if (value.amount !== undefined) {
      const existingTotal = roundMoney(existingSplits.reduce((sum, split) => sum + roundMoney(split.amount), 0))
      if (existingTotal !== roundMoney(value.amount)) {
        throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output
      }
    }
    return
  }

  const categoriesById = loadCategoriesById(sqliteDb, value.splits.map(split => split.categoryId), user)
  assertSplitLines({
    lines: value.splits,
    amount: value.amount ?? movement.amount,
    type: value.type ?? movement.type,
    categoriesById
  })
}

export class CreditCardsService {
  constructor (private readonly repository: ICreditCardsRepository = creditCardsRepository) {}

  public async getCreditCards (user: string) {
    const cards = await this.repository.findByUser(user)
    return cards.map(serializeCreditCard)
  }

  public async getCreditCardById (id: string, user: string) {
    const card = await this.repository.findById(id, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
    return serializeCreditCard(card)
  }

  public async createCreditCard ({ user, data }: { user: string, data: CreateCreditCardData }) {
    const card = await this.repository.create(user, data)
    return serializeCreditCard(card)
  }

  public async editCreditCard ({ id, user, value }: { id: string, user: string, value: UpdateCreditCardData }) {
    const card = await this.repository.update(id, user, value)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
    return serializeCreditCard(card)
  }

  public async deleteCreditCard (id: string, user: string): Promise<boolean> {
    const card = await this.repository.findById(id, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output

    const hasPaidMovements = await this.repository.hasPaidMovements(id, user)
    if (hasPaidMovements) {
      throw Boom.conflict(ERROR_MESSAGE.CREDIT_CARD.HAS_PAID_MOVEMENTS).output
    }

    return this.repository.deletePendingMovementsByCard(id, user)
  }

  public async getMovements ({ creditCardId, user, status }: { creditCardId: string, user: string, status?: string }) {
    await this.getCreditCardById(creditCardId, user)
    const movements = await this.repository.findMovements(creditCardId, user, status)
    return movements.map(serializeCreditCardMovement)
  }

  public async addMovement ({ creditCardId, user, data }: { creditCardId: string, user: string, data: Omit<CreateCreditCardMovementData, 'creditCardId'> }) {
    await this.getCreditCardById(creditCardId, user)
    const hasSplits = Array.isArray(data.splits) && data.splits.length >= 2
    const movement = await this.repository.createMovement(user, {
      ...data,
      tags: hasSplits ? [] : sanitizeTags(data.tags),
      splits: data.splits?.map(split => ({ ...split, tags: sanitizeTags(split.tags) })),
      creditCardId
    })
    return serializeCreditCardMovement(movement)
  }

  public async editMovement ({ id, creditCardId, user, value }: { id: string, creditCardId: string, user: string, value: UpdateCreditCardMovementData }) {
    const movement = await this.repository.findMovementById(id, user)
    if (!movement || movement.creditCardId !== creditCardId) {
      throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.MOVEMENT_NOT_FOUND).output
    }
    if (movement.status === 'paid') {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
    }
    assertSplitInvariant({ movement, value, user })
    const hasSplits = Array.isArray(value.splits) && value.splits.length >= 2
    const updated = await this.repository.updateMovement(id, user, {
      ...value,
      ...(hasSplits
        ? { tags: [] }
        : (value.tags !== undefined && { tags: sanitizeTags(value.tags) })),
      ...(value.splits !== undefined && {
        splits: value.splits.map(split => ({ ...split, tags: sanitizeTags(split.tags) }))
      })
    })
    return serializeCreditCardMovement(updated)
  }

  public async deleteMovement ({ id, creditCardId, user }: { id: string, creditCardId: string, user: string }): Promise<boolean> {
    const movement = await this.repository.findMovementById(id, user)
    if (!movement || movement.creditCardId !== creditCardId) {
      throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.MOVEMENT_NOT_FOUND).output
    }
    if (movement.status === 'paid') {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
    }
    return this.repository.deleteMovement(id, user)
  }

  public async payDebt ({ creditCardId, user, payload }: {
    creditCardId: string
    user: string
    payload: PayDebtPayload
  }) {
    const card = await this.repository.findById(creditCardId, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output

    const result = await this.repository.payDebt({ card, user, payload })

    if (!result.card) {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT).output
    }

    return {
      card: serializeCreditCard(result.card),
      paidCount: result.paidCount,
      totalPaid: result.totalPaid
    }
  }
}

export const creditCardsService = new CreditCardsService()

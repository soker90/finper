import Boom from '@hapi/boom'
import { roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { sanitizeTags, assertSplitEditInvariant, normalizeSplitLineAmounts } from '../../utils'
import { db as sqliteDb } from '../../db'
import { creditCardsRepository, type ICreditCardsRepository, type CreateCreditCardData, type UpdateCreditCardData, type CreateCreditCardMovementData, type UpdateCreditCardMovementData, type PayDebtPayload } from './credit-cards.repository'
import { serializeCreditCard, serializeCreditCardMovement } from './credit-cards.serializer'

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
    const normalizedAmount = roundMoney(data.amount)
    const normalizedSplits = normalizeSplitLineAmounts(data.splits)
    const hasSplits = Array.isArray(normalizedSplits) && normalizedSplits.length >= 2
    const movement = await this.repository.createMovement(user, {
      ...data,
      amount: normalizedAmount,
      tags: hasSplits ? [] : sanitizeTags(data.tags),
      splits: normalizedSplits?.map(split => ({ ...split, tags: sanitizeTags(split.tags) })),
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
    const normalizedValue = {
      ...value,
      ...(value.amount !== undefined && { amount: roundMoney(value.amount) }),
      ...(value.splits !== undefined && { splits: normalizeSplitLineAmounts(value.splits) })
    }
    assertSplitEditInvariant({
      existingSplits: (movement.splits ?? []).map(split => ({ categoryId: split.categoryId, amount: roundMoney(split.amount) })),
      currentAmount: roundMoney(movement.amount),
      currentType: movement.type,
      newSplits: normalizedValue.splits?.map(split => ({ categoryId: split.categoryId, amount: split.amount, tags: split.tags })),
      newAmount: normalizedValue.amount,
      newType: normalizedValue.type,
      hasNewCategoryOrTags: normalizedValue.categoryId !== undefined || normalizedValue.tags !== undefined,
      user,
      db: sqliteDb
    })
    const hasSplits = Array.isArray(normalizedValue.splits) && normalizedValue.splits.length >= 2
    const updated = await this.repository.updateMovement(id, user, {
      ...normalizedValue,
      ...(hasSplits
        ? { tags: [] }
        : (normalizedValue.tags !== undefined && { tags: sanitizeTags(normalizedValue.tags) })),
      ...(normalizedValue.splits !== undefined && {
        splits: normalizedValue.splits.map(split => ({ ...split, tags: sanitizeTags(split.tags) }))
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

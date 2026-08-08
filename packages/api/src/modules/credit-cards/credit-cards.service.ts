import Boom from '@hapi/boom'
import { eq, sql } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema, generateId, roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { creditCardsRepository, type ICreditCardsRepository } from './credit-cards.repository'
import { serializeCreditCard, serializeCreditCardMovement } from './credit-cards.serializer'

const { creditCardMovements, accounts, transactions } = schema

export class CreditCardsService {
  constructor (private readonly repository: ICreditCardsRepository = creditCardsRepository) {}

  public async getCreditCards (user: string): Promise<any[]> {
    const cards = await this.repository.findByUser(user)
    return cards.map(serializeCreditCard)
  }

  public async getCreditCardById (id: string, user: string): Promise<any> {
    const card = await this.repository.findById(id, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
    return serializeCreditCard(card)
  }

  public async createCreditCard ({ user, data }: { user: string, data: any }): Promise<any> {
    const card = await this.repository.create(user, data)
    return serializeCreditCard(card)
  }

  public async editCreditCard ({ id, user, value }: { id: string, user: string, value: any }): Promise<any> {
    const card = await this.repository.update(id, user, value)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
    return serializeCreditCard(card)
  }

  public async deleteCreditCard (id: string, user: string): Promise<boolean> {
    const card = await this.repository.findById(id, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
    return this.repository.delete(id, user)
  }

  public async getMovements ({ creditCardId, user, status }: { creditCardId: string, user: string, status?: string }): Promise<any[]> {
    await this.getCreditCardById(creditCardId, user)
    const movements = await this.repository.findMovements(creditCardId, user, status)
    return movements.map(serializeCreditCardMovement)
  }

  public async addMovement ({ creditCardId, user, data }: { creditCardId: string, user: string, data: any }): Promise<any> {
    await this.getCreditCardById(creditCardId, user)
    const movement = await this.repository.createMovement(user, {
      creditCardId,
      ...data
    })
    return serializeCreditCardMovement(movement)
  }

  public async editMovement ({ id, user, value }: { id: string, user: string, value: any }): Promise<any> {
    const movement = await this.repository.findMovementById(id, user)
    if (!movement) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.MOVEMENT_NOT_FOUND).output
    if (movement.status === 'paid') {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
    }
    const updated = await this.repository.updateMovement(id, user, value)
    return serializeCreditCardMovement(updated)
  }

  public async deleteMovement ({ id, user }: { id: string, user: string }): Promise<boolean> {
    const movement = await this.repository.findMovementById(id, user)
    if (!movement) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.MOVEMENT_NOT_FOUND).output
    if (movement.status === 'paid') {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
    }
    return this.repository.deleteMovement(id, user)
  }

  public async payDebt ({ creditCardId, user, payload }: {
    creditCardId: string
    user: string
    payload: { movementIds?: string[], amount?: number, all?: boolean }
  }): Promise<{ card: any, paidCount: number, totalPaid: number }> {
    const card = await this.repository.findById(creditCardId, user)
    if (!card) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output

    const pendingMovements = await this.repository.findMovements(creditCardId, user, 'pending')
    if (pendingMovements.length === 0) {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT).output
    }

    let movementsToPay: any[] = []

    if (payload.movementIds && payload.movementIds.length > 0) {
      const selectedSet = new Set(payload.movementIds)
      movementsToPay = pendingMovements.filter((m) => selectedSet.has(m.id))
    } else if (payload.all) {
      movementsToPay = [...pendingMovements]
    } else if (payload.amount && payload.amount > 0) {
      let accumulated = 0
      const target = payload.amount
      const sorted = [...pendingMovements].sort((a, b) => a.date - b.date)
      for (const m of sorted) {
        movementsToPay.push(m)
        const net = m.type === 'expense' ? m.amount : -m.amount
        accumulated += net
        if (accumulated >= target) break
      }
    }

    if (movementsToPay.length === 0) {
      throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT).output
    }

    const now = Date.now()

    sqliteDb.transaction((tx) => {
      let netDebtPaid = 0

      for (const m of movementsToPay) {
        const txId = generateId()
        const net = m.type === 'expense' ? m.amount : -m.amount
        netDebtPaid += net

        const noteText = m.note ? `Pago tarjeta ${card.name}: ${m.note}` : `Pago tarjeta ${card.name}`

        tx.insert(transactions).values({
          id: txId,
          date: now,
          categoryId: m.categoryId,
          amount: m.amount,
          type: m.type,
          accountId: card.accountId,
          note: noteText,
          storeId: m.storeId || null,
          user
        }).run()

        tx.update(creditCardMovements)
          .set({
            status: 'paid',
            paidAt: now,
            transactionId: txId
          })
          .where(eq(creditCardMovements.id, m.id))
          .run()
      }

      const balanceDelta = roundMoney(-netDebtPaid)
      if (balanceDelta !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${balanceDelta}, 2)` })
          .where(eq(accounts.id, card.accountId))
          .run()
      }
    })

    const updatedCard = await this.repository.findById(creditCardId, user)
    const totalPaid = movementsToPay.reduce((acc, m) => acc + (m.type === 'expense' ? m.amount : -m.amount), 0)

    return {
      card: serializeCreditCard(updatedCard),
      paidCount: movementsToPay.length,
      totalPaid: roundMoney(totalPaid)
    }
  }
}

export const creditCardsService = new CreditCardsService()

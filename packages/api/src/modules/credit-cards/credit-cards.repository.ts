import Boom from '@hapi/boom'
import { type DB, schema, generateId, roundMoney } from '@soker90/finper-db'
import { eq, and, sql, desc } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { ERROR_MESSAGE } from '../../i18n'

const { creditCards, creditCardMovements, accounts, categories, stores, transactions } = schema

export type CreditCard = typeof creditCards.$inferSelect
export type CreditCardMovement = typeof creditCardMovements.$inferSelect

export interface CreditCardRow extends CreditCard {
  account: {
    id: string
    name: string
    bank: string
    balance: number
  } | null
  currentDebt: number
}

export interface CreditCardMovementRow extends CreditCardMovement {
  category: {
    id: string
    name: string
    type: string
  } | null
  store: {
    id: string
    name: string
  } | null
}

export interface CreateCreditCardData {
  name: string
  accountId: string
  limit?: number | null
}

export interface UpdateCreditCardData {
  name?: string
  accountId?: string
  limit?: number | null
}

export interface CreateCreditCardMovementData {
  creditCardId: string
  date: number
  amount: number
  type: 'expense' | 'income'
  categoryId: string
  storeId?: string | null
  note?: string | null
}

export interface UpdateCreditCardMovementData {
  date?: number
  amount?: number
  type?: 'expense' | 'income'
  categoryId?: string
  storeId?: string | null
  note?: string | null
}

export interface PayDebtPayload {
  movementIds?: string[]
  amount?: number
  all?: boolean
}

export interface PayDebtResult {
  card: CreditCardRow | undefined
  paidCount: number
  totalPaid: number
}

export interface ICreditCardsRepository {
  findByUser(user: string): Promise<CreditCardRow[]>
  findById(id: string, user: string): Promise<CreditCardRow | undefined>
  create(user: string, data: CreateCreditCardData): Promise<CreditCardRow | undefined>
  update(id: string, user: string, data: UpdateCreditCardData): Promise<CreditCardRow | undefined>
  delete(id: string, user: string): Promise<boolean>
  hasPaidMovements(id: string, user: string): Promise<boolean>
  deletePendingMovementsByCard(id: string, user: string): Promise<boolean>
  findMovements(creditCardId: string, user: string, status?: string): Promise<CreditCardMovementRow[]>
  findMovementById(id: string, user: string): Promise<CreditCardMovementRow | undefined>
  createMovement(user: string, data: CreateCreditCardMovementData): Promise<CreditCardMovementRow | undefined>
  updateMovement(id: string, user: string, data: UpdateCreditCardMovementData): Promise<CreditCardMovementRow | undefined>
  deleteMovement(id: string, user: string): Promise<boolean>
  payDebt(params: { card: CreditCardRow, user: string, payload: PayDebtPayload }): Promise<PayDebtResult>
}

const movementSelectFields = {
  id: creditCardMovements.id,
  creditCardId: creditCardMovements.creditCardId,
  date: creditCardMovements.date,
  amount: creditCardMovements.amount,
  type: creditCardMovements.type,
  categoryId: creditCardMovements.categoryId,
  storeId: creditCardMovements.storeId,
  note: creditCardMovements.note,
  status: creditCardMovements.status,
  paidAt: creditCardMovements.paidAt,
  transactionId: creditCardMovements.transactionId,
  user: creditCardMovements.user,
  category: {
    id: categories.id,
    name: categories.name,
    type: categories.type
  },
  store: {
    id: stores.id,
    name: stores.name
  }
}

export class CreditCardsRepository implements ICreditCardsRepository {
  constructor (private readonly db: DB = sqliteDb) {}

  public async findByUser (user: string): Promise<CreditCardRow[]> {
    const cards = await this.db.select({
      id: creditCards.id,
      name: creditCards.name,
      accountId: creditCards.accountId,
      limit: creditCards.limit,
      user: creditCards.user,
      account: {
        id: accounts.id,
        name: accounts.name,
        bank: accounts.bank,
        balance: accounts.balance
      }
    })
      .from(creditCards)
      .leftJoin(accounts, eq(creditCards.accountId, accounts.id))
      .where(eq(creditCards.user, user))
      .all()

    const pendingSumRows = await this.db.select({
      creditCardId: creditCardMovements.creditCardId,
      debt: sql<number>`SUM(CASE WHEN ${creditCardMovements.type} = 'expense' THEN ${creditCardMovements.amount} ELSE -${creditCardMovements.amount} END)`
    })
      .from(creditCardMovements)
      .where(and(eq(creditCardMovements.user, user), eq(creditCardMovements.status, 'pending')))
      .groupBy(creditCardMovements.creditCardId)
      .all()

    const debtMap = new Map<string, number>()
    for (const row of pendingSumRows) {
      debtMap.set(row.creditCardId, roundMoney(row.debt || 0))
    }

    return cards.map((card) => ({
      ...card,
      currentDebt: debtMap.get(card.id) ?? 0
    })) as CreditCardRow[]
  }

  public async findById (id: string, user: string): Promise<CreditCardRow | undefined> {
    const cards = await this.db.select({
      id: creditCards.id,
      name: creditCards.name,
      accountId: creditCards.accountId,
      limit: creditCards.limit,
      user: creditCards.user,
      account: {
        id: accounts.id,
        name: accounts.name,
        bank: accounts.bank,
        balance: accounts.balance
      }
    })
      .from(creditCards)
      .leftJoin(accounts, eq(creditCards.accountId, accounts.id))
      .where(and(eq(creditCards.id, id), eq(creditCards.user, user)))
      .all()

    if (cards.length === 0) return undefined
    const card = cards[0]

    const debtRow = await this.db.select({
      debt: sql<number>`SUM(CASE WHEN ${creditCardMovements.type} = 'expense' THEN ${creditCardMovements.amount} ELSE -${creditCardMovements.amount} END)`
    })
      .from(creditCardMovements)
      .where(and(
        eq(creditCardMovements.creditCardId, id),
        eq(creditCardMovements.user, user),
        eq(creditCardMovements.status, 'pending')
      ))
      .get()

    return {
      ...card,
      currentDebt: roundMoney(debtRow?.debt || 0)
    } as CreditCardRow
  }

  public async create (user: string, data: CreateCreditCardData): Promise<CreditCardRow | undefined> {
    const id = generateId()
    const newCard = {
      id,
      user,
      name: data.name,
      accountId: data.accountId,
      limit: data.limit != null ? roundMoney(data.limit) : null
    }

    await this.db.insert(creditCards).values(newCard).run()
    return this.findById(id, user)
  }

  public async update (id: string, user: string, data: UpdateCreditCardData): Promise<CreditCardRow | undefined> {
    const updateData: Partial<CreditCard> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.accountId !== undefined) updateData.accountId = data.accountId
    if (data.limit !== undefined) updateData.limit = data.limit != null ? roundMoney(data.limit) : null

    if (Object.keys(updateData).length > 0) {
      await this.db.update(creditCards)
        .set(updateData)
        .where(and(eq(creditCards.id, id), eq(creditCards.user, user)))
        .run()
    }

    return this.findById(id, user)
  }

  public async delete (id: string, user: string): Promise<boolean> {
    const result = await this.db.delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.user, user)))
      .run()
    return (result.changes ?? 0) > 0
  }

  public async hasPaidMovements (id: string, user: string): Promise<boolean> {
    const row = await this.db.select({ id: creditCardMovements.id })
      .from(creditCardMovements)
      .where(and(
        eq(creditCardMovements.creditCardId, id),
        eq(creditCardMovements.user, user),
        eq(creditCardMovements.status, 'paid')
      ))
      .get()
    return !!row
  }

  public async deletePendingMovementsByCard (id: string, user: string): Promise<boolean> {
    let deleted = false
    this.db.transaction((tx) => {
      tx.delete(creditCardMovements)
        .where(and(
          eq(creditCardMovements.creditCardId, id),
          eq(creditCardMovements.user, user),
          eq(creditCardMovements.status, 'pending')
        ))
        .run()

      const result = tx.delete(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.user, user)))
        .run()

      deleted = (result.changes ?? 0) > 0
    })
    return deleted
  }

  public async findMovements (creditCardId: string, user: string, status?: string): Promise<CreditCardMovementRow[]> {
    const conditions = [
      eq(creditCardMovements.creditCardId, creditCardId),
      eq(creditCardMovements.user, user)
    ]
    if (status) {
      conditions.push(eq(creditCardMovements.status, status))
    }

    const rows = await this.db.select(movementSelectFields)
      .from(creditCardMovements)
      .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
      .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(creditCardMovements.date))
      .all()

    return rows as CreditCardMovementRow[]
  }

  public async findMovementById (id: string, user: string): Promise<CreditCardMovementRow | undefined> {
    const rows = await this.db.select(movementSelectFields)
      .from(creditCardMovements)
      .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
      .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
      .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
      .all()

    return rows.length > 0 ? (rows[0] as CreditCardMovementRow) : undefined
  }

  public async createMovement (user: string, data: CreateCreditCardMovementData): Promise<CreditCardMovementRow | undefined> {
    const id = generateId()
    const newMovement = {
      id,
      user,
      creditCardId: data.creditCardId,
      date: data.date,
      amount: roundMoney(data.amount),
      type: data.type,
      categoryId: data.categoryId,
      storeId: data.storeId || null,
      note: data.note || null,
      status: 'pending' as const
    }

    await this.db.insert(creditCardMovements).values(newMovement).run()
    return this.findMovementById(id, user)
  }

  public async updateMovement (id: string, user: string, data: UpdateCreditCardMovementData): Promise<CreditCardMovementRow | undefined> {
    const updateData: Partial<CreditCardMovement> = {}
    if (data.date !== undefined) updateData.date = data.date
    if (data.amount !== undefined) updateData.amount = roundMoney(data.amount)
    if (data.type !== undefined) updateData.type = data.type
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.storeId !== undefined) updateData.storeId = data.storeId || null
    if (data.note !== undefined) updateData.note = data.note || null

    if (Object.keys(updateData).length > 0) {
      await this.db.update(creditCardMovements)
        .set(updateData)
        .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
        .run()
    }

    return this.findMovementById(id, user)
  }

  public async deleteMovement (id: string, user: string): Promise<boolean> {
    const result = await this.db.delete(creditCardMovements)
      .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
      .run()
    return (result.changes ?? 0) > 0
  }

  public async payDebt ({ card, user, payload }: { card: CreditCardRow, user: string, payload: PayDebtPayload }): Promise<PayDebtResult> {
    const pendingMovements = await this.findMovements(card.id, user, 'pending')

    let movementsToPay: CreditCardMovementRow[] = []

    if (payload.movementIds && payload.movementIds.length > 0) {
      const pendingById = new Map(pendingMovements.map((m) => [m.id, m]))
      movementsToPay = payload.movementIds.map((movementId) => {
        const movement = pendingById.get(movementId)
        if (!movement) throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT).output
        return movement
      })
    } else if (payload.all) {
      movementsToPay = [...pendingMovements]
    } else if (payload.amount && payload.amount > 0) {
      let accumulated = 0
      const target = payload.amount
      const sorted = [...pendingMovements].sort((a, b) => a.date - b.date)
      for (const m of sorted) {
        const net = m.type === 'expense' ? m.amount : -m.amount
        // Always include at least one movement so a small payment still makes progress,
        // but don't let further movements push the total past the requested amount.
        if (movementsToPay.length > 0 && accumulated + net > target) break
        movementsToPay.push(m)
        accumulated += net
        if (accumulated >= target) break
      }
    }

    if (movementsToPay.length === 0) {
      return { card: undefined, paidCount: 0, totalPaid: 0 }
    }

    const now = Date.now()
    const paidMovements: CreditCardMovementRow[] = []

    this.db.transaction((tx) => {
      let netDebtPaid = 0

      for (const m of movementsToPay) {
        const txId = generateId()

        // Guard against concurrent pay-debt requests: reserve the movement first by
        // flipping it to paid only if it is still pending and belongs to this user.
        // The transactionId FK requires the transactions row to exist first, so it's
        // set in a second update right after inserting it below.
        const updateResult = tx.update(creditCardMovements)
          .set({
            status: 'paid',
            paidAt: now
          })
          .where(and(
            eq(creditCardMovements.id, m.id),
            eq(creditCardMovements.user, user),
            eq(creditCardMovements.status, 'pending')
          ))
          .run()

        if ((updateResult.changes ?? 0) === 0) {
          throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
        }

        const net = m.type === 'expense' ? m.amount : -m.amount
        netDebtPaid += net
        paidMovements.push(m)

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
          creditCardId: card.id,
          user
        }).run()

        tx.update(creditCardMovements)
          .set({ transactionId: txId })
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

    const updatedCard = await this.findById(card.id, user)
    const totalPaid = paidMovements.reduce((acc, m) => acc + (m.type === 'expense' ? m.amount : -m.amount), 0)

    return {
      card: updatedCard,
      paidCount: paidMovements.length,
      totalPaid: roundMoney(totalPaid)
    }
  }
}

export const creditCardsRepository = new CreditCardsRepository()

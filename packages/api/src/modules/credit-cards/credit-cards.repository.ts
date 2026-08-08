import { type DB, schema, generateId, roundMoney } from '@soker90/finper-db'
import { eq, and, sql, desc } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'

const { creditCards, creditCardMovements, accounts, categories, stores } = schema

export interface ICreditCardsRepository {
  findByUser(user: string): Promise<any[]>
  findById(id: string, user: string): Promise<any | undefined>
  create(user: string, data: { name: string, accountId: string, limit?: number | null }): Promise<any>
  update(id: string, user: string, data: { name?: string, accountId?: string, limit?: number | null }): Promise<any | undefined>
  delete(id: string, user: string): Promise<boolean>
  findMovements(creditCardId: string, user: string, status?: string): Promise<any[]>
  findMovementById(id: string, user: string): Promise<any | undefined>
  createMovement(user: string, data: {
    creditCardId: string
    date: number
    amount: number
    type: 'expense' | 'income'
    categoryId: string
    storeId?: string | null
    note?: string | null
  }): Promise<any>
  updateMovement(id: string, user: string, data: {
    date?: number
    amount?: number
    type?: 'expense' | 'income'
    categoryId?: string
    storeId?: string | null
    note?: string | null
  }): Promise<any | undefined>
  deleteMovement(id: string, user: string): Promise<boolean>
}

export class CreditCardsRepository implements ICreditCardsRepository {
  constructor (private readonly db: DB = sqliteDb) {}

  public async findByUser (user: string): Promise<any[]> {
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
    }))
  }

  public async findById (id: string, user: string): Promise<any | undefined> {
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
    }
  }

  public async create (user: string, data: { name: string, accountId: string, limit?: number | null }): Promise<any> {
    const id = generateId()
    const newCard = {
      id,
      user,
      name: data.name,
      accountId: data.accountId,
      limit: data.limit ? roundMoney(data.limit) : null
    }

    await this.db.insert(creditCards).values(newCard).run()
    return this.findById(id, user)
  }

  public async update (id: string, user: string, data: { name?: string, accountId?: string, limit?: number | null }): Promise<any | undefined> {
    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.accountId !== undefined) updateData.accountId = data.accountId
    if (data.limit !== undefined) updateData.limit = data.limit ? roundMoney(data.limit) : null

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

  public async findMovements (creditCardId: string, user: string, status?: string): Promise<any[]> {
    const conditions = [
      eq(creditCardMovements.creditCardId, creditCardId),
      eq(creditCardMovements.user, user)
    ]
    if (status) {
      conditions.push(eq(creditCardMovements.status, status))
    }

    const rows = await this.db.select({
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
    })
      .from(creditCardMovements)
      .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
      .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(creditCardMovements.date))
      .all()

    return rows
  }

  public async findMovementById (id: string, user: string): Promise<any | undefined> {
    const rows = await this.db.select({
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
      user: creditCardMovements.user
    })
      .from(creditCardMovements)
      .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
      .all()

    return rows.length > 0 ? rows[0] : undefined
  }

  public async createMovement (user: string, data: {
    creditCardId: string
    date: number
    amount: number
    type: 'expense' | 'income'
    categoryId: string
    storeId?: string | null
    note?: string | null
  }): Promise<any> {
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

  public async updateMovement (id: string, user: string, data: {
    date?: number
    amount?: number
    type?: 'expense' | 'income'
    categoryId?: string
    storeId?: string | null
    note?: string | null
  }): Promise<any | undefined> {
    const updateData: Record<string, any> = {}
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
}

export const creditCardsRepository = new CreditCardsRepository()

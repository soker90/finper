import Boom from '@hapi/boom'
import { type DB, schema, generateId, roundMoney } from '@soker90/finper-db'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { ERROR_MESSAGE } from '../../i18n'
import { chunk, sanitizeTags, loadCategoriesById } from '../../utils'

const { creditCards, creditCardMovements, creditCardMovementSplits, accounts, categories, stores, transactions, transactionSplits } = schema

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

export interface CreditCardMovementSplitRow {
  id: string
  categoryId: string
  amount: number
  tags: string[]
  categoryName: string | null
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
  splits?: CreditCardMovementSplitRow[]
}

export type MovementSplitInput = { categoryId: string, amount: number, tags?: string[] }

export interface CreateCreditCardData {
  name: string
  accountId: string
  limit?: number | null
  logoBank?: string | null
}

export interface UpdateCreditCardData {
  name?: string
  accountId?: string
  limit?: number | null
  logoBank?: string | null
}

export interface CreateCreditCardMovementData {
  creditCardId: string
  date: number
  amount: number
  type: 'expense' | 'income'
  categoryId: string
  storeId?: string | null
  note?: string | null
  tags?: string[]
  splits?: MovementSplitInput[]
}

export interface UpdateCreditCardMovementData {
  date?: number
  amount?: number
  type?: 'expense' | 'income'
  categoryId?: string
  storeId?: string | null
  note?: string | null
  tags?: string[]
  splits?: MovementSplitInput[]
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
  tags: creditCardMovements.tags,
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

const persistMovementSplits = (tx: { delete: typeof sqliteDb.delete, insert: typeof sqliteDb.insert }, params: { movementId: string, user: string, splits?: MovementSplitInput[] }) => {
  if (params.splits === undefined) return
  tx.delete(creditCardMovementSplits)
    .where(and(eq(creditCardMovementSplits.movementId, params.movementId), eq(creditCardMovementSplits.user, params.user)))
    .run()
  if (params.splits.length < 2) return
  for (const split of params.splits) {
    tx.insert(creditCardMovementSplits).values({
      id: generateId(),
      movementId: params.movementId,
      categoryId: split.categoryId,
      amount: roundMoney(split.amount),
      tags: sanitizeTags(split.tags),
      user: params.user
    }).run()
  }
}

// SQLite caps the number of bound parameters per statement, so ids are
// queried in chunks instead of a single unbounded `IN (...)` list.
const ID_CHUNK_SIZE = 500

const loadSplitsByMovementIds = (db: { select: any }, movementIds: string[], user?: string): Map<string, CreditCardMovementSplitRow[]> => {
  const grouped = new Map<string, CreditCardMovementSplitRow[]>()
  if (movementIds.length === 0) return grouped

  for (const idsChunk of chunk(movementIds, ID_CHUNK_SIZE)) {
    const conditions = [inArray(creditCardMovementSplits.movementId, idsChunk)]
    if (user) conditions.push(eq(creditCardMovementSplits.user, user))

    const rows = db.select({
      id: creditCardMovementSplits.id,
      movementId: creditCardMovementSplits.movementId,
      categoryId: creditCardMovementSplits.categoryId,
      amount: creditCardMovementSplits.amount,
      tags: creditCardMovementSplits.tags,
      categoryName: categories.name
    })
      .from(creditCardMovementSplits)
      .leftJoin(categories, eq(creditCardMovementSplits.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(sql`credit_card_movement_splits.rowid`)
      .all()

    for (const row of rows) {
      const list = grouped.get(row.movementId) ?? []
      list.push({
        id: row.id,
        categoryId: row.categoryId,
        amount: row.amount,
        tags: row.tags ?? [],
        categoryName: row.categoryName
      })
      grouped.set(row.movementId, list)
    }
  }
  return grouped
}

const attachSplits = (db: { select: any }, movements: CreditCardMovementRow[], user?: string): CreditCardMovementRow[] => {
  const splitsByMovement = loadSplitsByMovementIds(db, movements.map(movement => movement.id), user)
  return movements.map(movement => {
    const splits = splitsByMovement.get(movement.id)
    return splits && splits.length >= 2 ? { ...movement, splits } : movement
  })
}

export class CreditCardsRepository implements ICreditCardsRepository {
  constructor (private readonly db: DB = sqliteDb) {}

  public async findByUser (user: string): Promise<CreditCardRow[]> {
    const cards = await this.db.select({
      id: creditCards.id,
      name: creditCards.name,
      accountId: creditCards.accountId,
      limit: creditCards.limit,
      logoBank: creditCards.logoBank,
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
      logoBank: creditCards.logoBank,
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
      limit: data.limit != null ? roundMoney(data.limit) : null,
      logoBank: data.logoBank || null
    }

    await this.db.insert(creditCards).values(newCard).run()
    return this.findById(id, user)
  }

  public async update (id: string, user: string, data: UpdateCreditCardData): Promise<CreditCardRow | undefined> {
    const updateData: Partial<CreditCard> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.accountId !== undefined) updateData.accountId = data.accountId
    if (data.limit !== undefined) updateData.limit = data.limit != null ? roundMoney(data.limit) : null
    if (data.logoBank !== undefined) updateData.logoBank = data.logoBank || null

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

    return attachSplits(this.db, rows as CreditCardMovementRow[], user)
  }

  public async findMovementById (id: string, user: string): Promise<CreditCardMovementRow | undefined> {
    const rows = await this.db.select(movementSelectFields)
      .from(creditCardMovements)
      .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
      .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
      .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
      .all()

    const withSplits = attachSplits(this.db, rows as CreditCardMovementRow[], user)
    return withSplits[0]
  }

  public async createMovement (user: string, data: CreateCreditCardMovementData): Promise<CreditCardMovementRow | undefined> {
    const id = generateId()
    const movementSplits = data.splits
    const hasSplits = Array.isArray(movementSplits) && movementSplits.length >= 2
    const newMovement = {
      id,
      user,
      creditCardId: data.creditCardId,
      date: data.date,
      amount: roundMoney(data.amount),
      type: data.type,
      categoryId: hasSplits ? movementSplits[0].categoryId : data.categoryId,
      storeId: data.storeId || null,
      note: data.note || null,
      tags: hasSplits ? [] : (data.tags ?? []),
      status: 'pending' as const
    }

    this.db.transaction((tx) => {
      tx.insert(creditCardMovements).values(newMovement).run()
      persistMovementSplits(tx, { movementId: id, user, splits: data.splits })
    })
    return this.findMovementById(id, user)
  }

  public async updateMovement (id: string, user: string, data: UpdateCreditCardMovementData): Promise<CreditCardMovementRow | undefined> {
    const hasSplits = Array.isArray(data.splits) && data.splits.length >= 2
    const updateData: Partial<CreditCardMovement> = {}
    if (data.date !== undefined) updateData.date = data.date
    if (data.amount !== undefined) updateData.amount = roundMoney(data.amount)
    if (data.type !== undefined) updateData.type = data.type
    if (hasSplits) {
      updateData.categoryId = data.splits![0].categoryId
      updateData.tags = []
    } else {
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
      if (data.tags !== undefined) updateData.tags = data.tags
    }
    if (data.storeId !== undefined) updateData.storeId = data.storeId || null
    if (data.note !== undefined) updateData.note = data.note || null

    this.db.transaction((tx) => {
      if (Object.keys(updateData).length > 0) {
        tx.update(creditCardMovements)
          .set(updateData)
          .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
          .run()
      }
      if (data.splits !== undefined) {
        persistMovementSplits(tx, { movementId: id, user, splits: data.splits })
      }
    })

    return this.findMovementById(id, user)
  }

  public async deleteMovement (id: string, user: string): Promise<boolean> {
    const result = await this.db.delete(creditCardMovements)
      .where(and(eq(creditCardMovements.id, id), eq(creditCardMovements.user, user)))
      .run()
    return (result.changes ?? 0) > 0
  }

  public async payDebt ({ card, user, payload }: { card: CreditCardRow, user: string, payload: PayDebtPayload }): Promise<PayDebtResult> {
    return this.db.transaction((tx) => {
      let movementsToPay: CreditCardMovementRow[] = []

      if (payload.movementIds && payload.movementIds.length > 0) {
        for (const movementId of payload.movementIds) {
          const movementRows = tx.select(movementSelectFields)
            .from(creditCardMovements)
            .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
            .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
            .where(and(
              eq(creditCardMovements.id, movementId),
              eq(creditCardMovements.creditCardId, card.id),
              eq(creditCardMovements.user, user)
            ))
            .all()
          const movementWithSplits = attachSplits(tx, movementRows as CreditCardMovementRow[], user)[0]

          if (!movementWithSplits) {
            throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.INVALID_PAYMENT).output
          }
          if (movementWithSplits.status !== 'pending') {
            throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
          }
          movementsToPay.push(movementWithSplits)
        }
      } else {
        const pendingRows = tx.select(movementSelectFields)
          .from(creditCardMovements)
          .leftJoin(categories, eq(creditCardMovements.categoryId, categories.id))
          .leftJoin(stores, eq(creditCardMovements.storeId, stores.id))
          .where(and(
            eq(creditCardMovements.creditCardId, card.id),
            eq(creditCardMovements.user, user),
            eq(creditCardMovements.status, 'pending')
          ))
          .orderBy(desc(creditCardMovements.date))
          .all()
        const pendingMovements = attachSplits(tx, pendingRows as CreditCardMovementRow[], user)

        if (payload.all) {
          movementsToPay = [...pendingMovements]
        } else if (payload.amount && payload.amount > 0) {
          let accumulated = 0
          const target = payload.amount
          const sorted = [...pendingMovements].sort((firstItem, secondItem) => firstItem.date - secondItem.date)
          for (const movement of sorted) {
            const net = movement.type === 'expense' ? movement.amount : -movement.amount
            if (movementsToPay.length > 0 && accumulated + net > target) break
            movementsToPay.push(movement)
            accumulated += net
            if (accumulated >= target) break
          }
        }
      }

      if (movementsToPay.length === 0) {
        return { card: undefined, paidCount: 0, totalPaid: 0 }
      }

      const allCategoryIds = [
        ...movementsToPay.map(movement => movement.categoryId),
        ...movementsToPay.flatMap(movement => (movement.splits ?? []).map(split => split.categoryId))
      ]
      const categoriesById = loadCategoriesById(tx as any, allCategoryIds, user)
      for (const movement of movementsToPay) {
        if (movement.splits && movement.splits.length >= 2) {
          for (const split of movement.splits) {
            if (!categoriesById.has(split.categoryId)) {
              throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
            }
          }
        } else if (!categoriesById.has(movement.categoryId)) {
          throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
        }
      }

      const now = Date.now()
      const paidMovements: CreditCardMovementRow[] = []
      let netDebtPaid = 0

      for (const movement of movementsToPay) {
        const txId = generateId()

        const updateResult = tx.update(creditCardMovements)
          .set({
            status: 'paid',
            paidAt: now
          })
          .where(and(
            eq(creditCardMovements.id, movement.id),
            eq(creditCardMovements.user, user),
            eq(creditCardMovements.status, 'pending')
          ))
          .run()

        if ((updateResult.changes ?? 0) === 0) {
          throw Boom.badRequest(ERROR_MESSAGE.CREDIT_CARD.ALREADY_PAID).output
        }

        const net = movement.type === 'expense' ? movement.amount : -movement.amount
        netDebtPaid += net
        paidMovements.push(movement)

        const noteText = movement.note ? `Pago tarjeta ${card.name}: ${movement.note}` : `Pago tarjeta ${card.name}`
        const movementSplits = movement.splits && movement.splits.length >= 2 ? movement.splits : []
        const hasSplits = movementSplits.length >= 2

        tx.insert(transactions).values({
          id: txId,
          date: movement.date,
          categoryId: hasSplits ? movementSplits[0].categoryId : movement.categoryId,
          amount: roundMoney(movement.amount),
          type: movement.type,
          accountId: card.accountId,
          note: noteText,
          storeId: movement.storeId || null,
          creditCardId: card.id,
          tags: hasSplits ? [] : sanitizeTags(movement.tags ?? []),
          user
        }).run()

        for (const split of movementSplits) {
          tx.insert(transactionSplits).values({
            id: generateId(),
            transactionId: txId,
            categoryId: split.categoryId,
            amount: roundMoney(split.amount),
            tags: sanitizeTags(split.tags),
            user
          }).run()
        }

        tx.update(creditCardMovements)
          .set({ transactionId: txId })
          .where(and(eq(creditCardMovements.id, movement.id), eq(creditCardMovements.user, user)))
          .run()
      }

      const balanceDelta = roundMoney(-netDebtPaid)
      if (balanceDelta !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${balanceDelta}, 2)` })
          .where(and(eq(accounts.id, card.accountId), eq(accounts.user, user)))
          .run()
      }

      const cardRow = tx.select({
        id: creditCards.id,
        name: creditCards.name,
        accountId: creditCards.accountId,
        limit: creditCards.limit,
        logoBank: creditCards.logoBank,
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
        .where(and(eq(creditCards.id, card.id), eq(creditCards.user, user)))
        .get()

      const remainingDebtRow = tx.select({
        debt: sql<number>`SUM(CASE WHEN ${creditCardMovements.type} = 'expense' THEN ${creditCardMovements.amount} ELSE -${creditCardMovements.amount} END)`
      })
        .from(creditCardMovements)
        .where(and(
          eq(creditCardMovements.creditCardId, card.id),
          eq(creditCardMovements.user, user),
          eq(creditCardMovements.status, 'pending')
        ))
        .get()

      const currentDebt = roundMoney(remainingDebtRow?.debt || 0)
      const updatedCard = cardRow ? { ...cardRow, currentDebt } as CreditCardRow : undefined
      const totalPaid = paidMovements.reduce((accumulatedTotal, movement) => accumulatedTotal + (movement.type === 'expense' ? movement.amount : -movement.amount), 0)

      return {
        card: updatedCard,
        paidCount: paidMovements.length,
        totalPaid: roundMoney(totalPaid)
      }
    })
  }
}

export const creditCardsRepository = new CreditCardsRepository()

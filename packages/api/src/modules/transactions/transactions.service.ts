import Boom from '@hapi/boom'
import { sql, eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema, generateId, roundMoney } from '@soker90/finper-db'
import { getTransactionAmount, sanitizeTags, assertSplitEditInvariant } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeTransaction, serializeTransactionPopulated } from './transactions.serializer'
import { loadSplitsByTransactionIds } from './effective-category-rows'
import type { TransactionFilters } from './transactions.repository'

const { transactions, accounts, transactionSplits } = schema

const amountOf = (transaction: { type: string, amount: number }): number =>
  getTransactionAmount(transaction as unknown as Parameters<typeof getTransactionAmount>[0])

type ITransactionsRepository = ReturnType<typeof import('./transactions.repository').createTransactionsRepository>

export interface TransactionHooks {
  onTransactionCreated?: (transaction: any) => void
  onTransactionDeleted?: (subscriptionId: string | null) => void
}

type SplitInput = { category: string, amount: number, tags?: string[] }

const persistSplits = (tx: { delete: typeof sqliteDb.delete, insert: typeof sqliteDb.insert }, params: { transactionId: string, user: string, splits?: SplitInput[] }) => {
  if (params.splits === undefined) return
  tx.delete(transactionSplits)
    .where(and(eq(transactionSplits.transactionId, params.transactionId), eq(transactionSplits.user, params.user)))
    .run()
  if (params.splits.length < 2) return
  for (const split of params.splits) {
    tx.insert(transactionSplits).values({
      id: generateId(),
      transactionId: params.transactionId,
      categoryId: split.category,
      amount: roundMoney(split.amount),
      tags: sanitizeTags(split.tags),
      user: params.user
    }).run()
  }
}

const serializedWithSplits = (row: typeof schema.transactions.$inferSelect, user: string) => {
  const splits = loadSplitsByTransactionIds(sqliteDb, [row.id], user).get(row.id)
  return serializeTransaction(row, splits)
}

export class TransactionsService {
  constructor (
    private repository: ITransactionsRepository,
    private hooks: TransactionHooks = {}
  ) {}

  public addTransaction (params: any): any {
    const hasSplits = Array.isArray(params.splits) && params.splits.length >= 2
    const sanitizedTags = hasSplits ? [] : sanitizeTags(params.tags)
    const amount = amountOf(params)
    const categoryId = hasSplits ? params.splits[0].category : params.category

    const created = sqliteDb.transaction((tx) => {
      const row = tx.insert(transactions).values({
        id: generateId(),
        date: params.date,
        categoryId,
        amount: roundMoney(params.amount),
        type: params.type,
        accountId: params.account,
        note: params.note ?? null,
        storeId: params.store ?? null,
        subscriptionId: params.subscriptionId ?? null,
        tags: sanitizedTags,
        user: params.user
      }).returning().get()

      persistSplits(tx, { transactionId: row.id, user: params.user, splits: params.splits })

      if (amount !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${amount}, 2)` })
          .where(and(eq(accounts.id, params.account), eq(accounts.user, params.user)))
          .run()
      }
      return row
    })

    this.hooks.onTransactionCreated?.(created)
    return serializedWithSplits(created, params.user)
  }

  public editTransaction ({ id, value }: { id: string, value: any }): any {
    const oldTransaction = this.repository.findById(id, value.user)
    /* v8 ignore next — validateTransactionExist runs before via route */
    if (!oldTransaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output

    const existingSplits = loadSplitsByTransactionIds(sqliteDb, [id], value.user).get(id) ?? []

    const isYield = Boolean(oldTransaction.yieldId)
    const willHaveSplits = value.splits !== undefined
      ? (value.splits.length >= 2)
      : (existingSplits.length >= 2)

    if (willHaveSplits && isYield) {
      throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_YIELD).output
    }

    assertSplitEditInvariant({
      existingSplits: existingSplits.map(split => ({ categoryId: split.categoryId, amount: split.amount })),
      currentAmount: oldTransaction.amount,
      currentType: oldTransaction.type,
      newSplits: value.splits?.map((split: any) => ({ categoryId: split.category, amount: split.amount, tags: split.tags })),
      newAmount: value.amount,
      newType: value.type,
      hasNewCategoryOrTags: value.category !== undefined || value.tags !== undefined,
      user: value.user,
      db: sqliteDb
    })

    const finalAmount = value.amount !== undefined ? roundMoney(value.amount) : oldTransaction.amount
    const finalType = value.type ?? oldTransaction.type
    const finalAccountId = value.account ?? oldTransaction.accountId
    const finalDate = value.date ?? oldTransaction.date
    const finalNote = value.note !== undefined ? (value.note ?? null) : oldTransaction.note
    const finalStoreId = value.store !== undefined ? (value.store ?? null) : oldTransaction.storeId

    let finalCategoryId = oldTransaction.categoryId
    let finalTags = oldTransaction.tags

    if (value.splits !== undefined) {
      if (value.splits.length >= 2) {
        finalCategoryId = value.splits[0].category
        finalTags = []
      } else {
        // value.splits === [] -> explicitly converted to normal transaction
        finalCategoryId = value.category ?? oldTransaction.categoryId
        finalTags = value.tags !== undefined ? sanitizeTags(value.tags) : oldTransaction.tags
      }
    } else {
      if (existingSplits.length >= 2) {
        finalCategoryId = existingSplits[0].categoryId
        finalTags = []
      } else {
        if (value.category !== undefined) finalCategoryId = value.category
        if (value.tags !== undefined) finalTags = sanitizeTags(value.tags)
      }
    }

    const oldSignedAmount = amountOf(oldTransaction)

    const updated = sqliteDb.transaction((tx) => {
      const row = tx.update(transactions)
        .set({
          date: finalDate,
          categoryId: finalCategoryId,
          amount: finalAmount,
          type: finalType,
          accountId: finalAccountId,
          note: finalNote,
          storeId: finalStoreId,
          tags: finalTags
        })
        .where(and(eq(transactions.id, id), eq(transactions.user, value.user)))
        .returning()
        .get()

      if (value.splits !== undefined) {
        persistSplits(tx, { transactionId: id, user: value.user, splits: value.splits })
      }

      const newSignedAmount = amountOf(row)
      if (oldTransaction.accountId === row.accountId) {
        const delta = roundMoney(newSignedAmount - oldSignedAmount)
        if (delta !== 0) {
          tx.update(accounts)
            .set({ balance: sql`ROUND(${accounts.balance} + ${delta}, 2)` })
            .where(and(eq(accounts.id, row.accountId), eq(accounts.user, value.user)))
            .run()
        }
      } else {
        if (oldSignedAmount !== 0) {
          tx.update(accounts)
            .set({ balance: sql`ROUND(${accounts.balance} - ${oldSignedAmount}, 2)` })
            .where(and(eq(accounts.id, oldTransaction.accountId), eq(accounts.user, value.user)))
            .run()
        }
        if (newSignedAmount !== 0) {
          tx.update(accounts)
            .set({ balance: sql`ROUND(${accounts.balance} + ${newSignedAmount}, 2)` })
            .where(and(eq(accounts.id, row.accountId), eq(accounts.user, value.user)))
            .run()
        }
      }
      return row
    })

    return serializedWithSplits(updated, value.user)
  }

  public deleteTransaction (id: string, user: string): void {
    const transaction = this.repository.findById(id, user)
    /* v8 ignore next — validateTransactionExist runs before via route */
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output

    const amount = amountOf(transaction)

    sqliteDb.transaction((tx) => {
      tx.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.user, user))).run()
      if (amount !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${-amount}, 2)` })
          .where(and(eq(accounts.id, transaction.accountId), eq(accounts.user, user)))
          .run()
      }
    })

    this.hooks.onTransactionDeleted?.(transaction.subscriptionId ?? null)
  }

  public getTransactions (params: TransactionFilters): any[] {
    const rows = this.repository.findMany(params)
    const splitsByTransaction = loadSplitsByTransactionIds(sqliteDb, rows.map(row => row.id), params.user)
    return rows.map(row => serializeTransactionPopulated(row, splitsByTransaction.get(row.id)))
  }
}

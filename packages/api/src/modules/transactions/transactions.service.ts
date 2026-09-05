import Boom from '@hapi/boom'
import { sql, eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema, generateId, roundMoney } from '@soker90/finper-db'
import { getTransactionAmount, sanitizeTags } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeTransaction, serializeTransactionPopulated } from './transactions.serializer'
import { loadSplitsByTransactionIds } from './effective-category-rows'
import type { TransactionFilters } from './transactions.repository'

const { transactions, accounts, transactionSplits } = schema

const amountOf = (t: { type: string, amount: number }): number =>
  getTransactionAmount(t as unknown as Parameters<typeof getTransactionAmount>[0])

type ITransactionsRepository = ReturnType<typeof import('./transactions.repository').createTransactionsRepository>

export interface TransactionHooks {
  onTransactionCreated?: (transaction: any) => void
  onTransactionDeleted?: (subscriptionId: string | null) => void
}

type SplitInput = { category: string, amount: number, tags?: string[] }

const persistSplits = (tx: { delete: typeof sqliteDb.delete, insert: typeof sqliteDb.insert }, params: { transactionId: string, user: string, splits?: SplitInput[] }) => {
  tx.delete(transactionSplits).where(eq(transactionSplits.transactionId, params.transactionId)).run()
  if (!params.splits || params.splits.length < 2) return
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

const serializedWithSplits = (row: typeof schema.transactions.$inferSelect) => {
  const splits = loadSplitsByTransactionIds(sqliteDb, [row.id]).get(row.id)
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
        amount: params.amount,
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
          .where(eq(accounts.id, params.account))
          .run()
      }
      return row
    })

    this.hooks.onTransactionCreated?.(created)
    return serializedWithSplits(created)
  }

  public editTransaction ({ id, value }: { id: string, value: any }): any {
    const oldTransaction = this.repository.findById(id, value.user)
    /* v8 ignore next — validateTransactionExist runs before via route */
    if (!oldTransaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output

    const hasSplits = Array.isArray(value.splits) && value.splits.length >= 2
    if (hasSplits && oldTransaction.yieldId) {
      throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_YIELD).output
    }

    const oldAmount = amountOf(oldTransaction)
    const sanitizedTags = hasSplits ? [] : sanitizeTags(value.tags)
    const categoryId = hasSplits ? value.splits[0].category : value.category

    const updated = sqliteDb.transaction((tx) => {
      const row = tx.update(transactions)
        .set({
          date: value.date,
          categoryId,
          amount: value.amount,
          type: value.type,
          accountId: value.account,
          note: value.note ?? null,
          storeId: value.store ?? null,
          tags: sanitizedTags
        })
        .where(eq(transactions.id, id))
        .returning()
        .get()

      persistSplits(tx, { transactionId: id, user: value.user, splits: value.splits })

      const newAmount = amountOf(row)
      const delta = newAmount - oldAmount
      if (delta !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${delta}, 2)` })
          .where(eq(accounts.id, row.accountId))
          .run()
      }
      return row
    })

    return serializedWithSplits(updated)
  }

  public deleteTransaction (id: string, user: string): void {
    const transaction = this.repository.findById(id, user)
    /* v8 ignore next — validateTransactionExist runs before via route */
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output

    const amount = amountOf(transaction)

    sqliteDb.transaction((tx) => {
      tx.delete(transactions).where(eq(transactions.id, id)).run()
      if (amount !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${-amount}, 2)` })
          .where(eq(accounts.id, transaction.accountId))
          .run()
      }
    })

    this.hooks.onTransactionDeleted?.(transaction.subscriptionId ?? null)
  }

  public getTransactions (params: TransactionFilters): any[] {
    const rows = this.repository.findMany(params)
    const splitsByTransaction = loadSplitsByTransactionIds(sqliteDb, rows.map(row => row.id))
    return rows.map(row => serializeTransactionPopulated(row, splitsByTransaction.get(row.id)))
  }
}

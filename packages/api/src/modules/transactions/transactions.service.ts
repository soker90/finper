import Boom from '@hapi/boom'
import { sql, eq } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema, generateId } from '@soker90/finper-db'
import { getTransactionAmount, sanitizeTags } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeTransaction, serializeTransactionPopulated } from './transactions.serializer'

const { transactions, accounts } = schema

// getTransactionAmount (helper compartido) tipa su parámetro como ITransaction
// (Mongoose: con category/account). Solo lee type y amount; la fila Drizzle los
// tiene, así que adaptamos el tipo con un cast acotado al parámetro esperado.
const amountOf = (t: { type: string, amount: number }): number =>
  getTransactionAmount(t as unknown as Parameters<typeof getTransactionAmount>[0])

type ITransactionsRepository = ReturnType<typeof import('./transactions.repository').createTransactionsRepository>

// Hooks a subscriptions (DECISIÓN 3): puntos de extensión fire-and-forget.
// Por defecto NO-OP. Se conectarán al construir el módulo subscriptions.
export interface TransactionHooks {
  onTransactionCreated?: (transaction: any) => void
  onTransactionDeleted?: (subscriptionId: string | null) => void
}

export class TransactionsService {
  constructor (
    private repository: ITransactionsRepository,
    private hooks: TransactionHooks = {}
  ) {}

  public addTransaction (params: any): any {
    const sanitizedTags = sanitizeTags(params.tags)
    const amount = amountOf(params)

    const created = sqliteDb.transaction((tx) => {
      const row = tx.insert(transactions).values({
        id: generateId(),
        date: params.date,
        categoryId: params.category,
        amount: params.amount,
        type: params.type,
        accountId: params.account,
        note: params.note ?? null,
        storeId: params.store ?? null,
        subscriptionId: params.subscriptionId ?? null,
        tags: sanitizedTags,
        user: params.user
      }).returning().get()

      if (amount !== 0) {
        tx.update(accounts)
          .set({ balance: sql`ROUND(${accounts.balance} + ${amount}, 2)` })
          .where(eq(accounts.id, params.account))
          .run()
      }
      return row
    })

    this.hooks.onTransactionCreated?.(created)
    return serializeTransaction(created)
  }

  public editTransaction ({ id, value }: { id: string, value: any }): any {
    const oldTransaction = this.repository.findById(id, value.user)
    /* istanbul ignore next — validateTransactionExist runs before via route */
    if (!oldTransaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output

    const oldAmount = amountOf(oldTransaction)
    const sanitizedTags = sanitizeTags(value.tags)

    const updated = sqliteDb.transaction((tx) => {
      const row = tx.update(transactions)
        .set({
          date: value.date,
          categoryId: value.category,
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

    return serializeTransaction(updated)
  }

  public deleteTransaction (id: string, user: string): void {
    const transaction = this.repository.findById(id, user)
    /* istanbul ignore next — validateTransactionExist runs before via route */
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

  public getTransactions (params: {
    user: string, account?: string, category?: string, type?: string, store?: string, page?: number, limit?: number
  }): any[] {
    return this.repository.findMany(params).map(serializeTransactionPopulated)
  }
}

import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { type DB, schema, TRANSACTION } from '@soker90/finper-db'
import { findEffectiveCategoryRows, loadSplitsByTransactionIds } from '../transactions/effective-category-rows'
import { getCategoryAccountingAmount } from '../transactions/category-accounting'

const { transactions, categories, accounts, stores } = schema

export interface ExpenseRow {
  id: string
  date: number
  amount: number
  tags: string[]
  categoryId: string
  categoryName: string | null
}

export interface ExpenseDetailRow extends ExpenseRow {
  type: string
  note: string | null
  accountId: string
  accountName: string | null
  accountBank: string | null
  storeId: string | null
  storeName: string | null
  /** Id of the split line this row comes from, when the transaction is
   * divided. Undefined for non-split rows. See EffectiveCategoryRow. */
  splitId?: string
}

export const createStatsRepository = (db: DB) => ({
  findExpenses: (user: string, range?: { from: number, to: number }): ExpenseRow[] => {
    const rows = findEffectiveCategoryRows(db, {
      user,
      from: range?.from,
      to: range?.to,
      toInclusive: true
    })
    return rows.filter(row => row.categoryType === TRANSACTION.Expense && (row.type === TRANSACTION.Expense || row.type === TRANSACTION.Income)).map(row => ({
      id: row.transactionId,
      date: row.date,
      amount: getCategoryAccountingAmount({ categoryType: row.categoryType, type: row.type, amount: row.amount }),
      tags: row.tags ?? [],
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? null
    }))
  },

  findExpenseDetails: (user: string, from: number, to: number): ExpenseDetailRow[] => {
    const parents = db.select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      tags: transactions.tags,
      type: transactions.type,
      note: transactions.note,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      accountId: transactions.accountId,
      accountName: accounts.name,
      accountBank: accounts.bank,
      storeId: transactions.storeId,
      storeName: stores.name
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(stores, eq(transactions.storeId, stores.id))
      .where(and(
        eq(transactions.user, user),
        gte(transactions.date, from),
        lte(transactions.date, to)
      ))
      .orderBy(desc(transactions.date))
      .all() as ExpenseDetailRow[]

    const splitsByTransaction = loadSplitsByTransactionIds(db, parents.map(parent => parent.id), user)
    const rows: ExpenseDetailRow[] = []

    for (const parent of parents) {
      const splits = splitsByTransaction.get(parent.id)
      if (splits && splits.length >= 2) {
        for (const split of splits) {
          rows.push({
            ...parent,
            amount: getCategoryAccountingAmount({ categoryType: split.categoryType, type: parent.type, amount: split.amount }),
            categoryId: split.categoryId,
            categoryType: split.categoryType,
            categoryName: split.categoryName,
            tags: split.tags ?? [],
            splitId: split.id
          })
        }
      } else {
        rows.push({ ...parent, amount: getCategoryAccountingAmount({ categoryType: parent.categoryType, type: parent.type, amount: parent.amount }) })
      }
    }

    return rows.filter(row => row.categoryType === TRANSACTION.Expense && (row.type === TRANSACTION.Expense || row.type === TRANSACTION.Income))
  }
})

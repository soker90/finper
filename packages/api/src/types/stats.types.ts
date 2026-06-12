import { schema } from '@soker90/finper-db'

type TransactionRow = typeof schema.transactions.$inferSelect

export interface TagCategoryBreakdown {
  categoryId: string
  categoryName: string
  amount: number
  count: number
}

export interface TagSummary {
  tag: string
  totalAmount: number
  transactionCount: number
  byCategory: TagCategoryBreakdown[]
}

export interface TagYearSummary {
  year: number
  totalAmount: number
  transactionCount: number
}

export interface TagHistoric {
  tag: string
  totalAmount: number
  years: TagYearSummary[]
}

export interface TagDetail {
  tag: string
  year: number
  totalAmount: number
  transactionCount: number
  byCategory: TagCategoryBreakdown[]
  transactions: TransactionRow[]
}

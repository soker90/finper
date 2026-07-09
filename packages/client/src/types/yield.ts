export type YieldType = 'interest' | 'cashback'

export interface Yield {
  _id: string
  name: string
  type: YieldType
  accountId: string
  categoryId: string
  account: {
    _id: string
    name: string
    bank: string
  }
  netAccumulated: number
  entriesCount: number
  paymentsCount: number
}

export interface YieldInput {
  name?: string
  type: YieldType
  accountId: string
  categoryId: string
}

export interface YieldEntry {
  _id: string
  date: number
  amount: number
  type: string
  category: { _id: string, name: string }
  note?: string
}

export interface YieldMonthRow {
  month: string
  grossIncome?: number
  taxExpense?: number
  net?: number
  billsTotal?: number
  cashbackAmount?: number
  percentage?: number | null
  entries: YieldEntry[]
}

export interface YieldDetail extends Yield {
  entries: YieldEntry[]
  monthlyRows: YieldMonthRow[]
}

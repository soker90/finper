export type YieldType = 'interest' | 'cashback'

export interface Yield {
  _id: string
  type: YieldType
  accountId: string
  categoryIds: string[]
  account: {
    _id: string
    name: string
    bank: string
  }
  netAccumulated: number
  annualBreakdown?: {
    year: number
    net: number
    grossIncome: number
    taxExpense: number
    billsTotal: number
    cashbackAmount: number
  }[]
  entriesCount: number
  paymentsCount: number
}

export interface YieldInput {
  type: YieldType
  accountId: string
  categoryIds: string[]
}

export interface YieldEntry {
  _id: string
  date: number
  amount: number
  type: string
  category: { _id: string, name: string }
  note?: string
}

export interface YieldSettlement {
  id: string
  settlementDate?: number | null
  grossIncome?: number
  taxExpense?: number
  net?: number
  tae?: number | null
  averageBalance?: number | null
  taeSource?: 'provided' | 'calculated' | null
  balanceSource?: 'provided' | 'calculated' | null
  billsTotal?: number
  cashbackAmount?: number
  percentage?: number | null
  grossPercentage?: number | null
  status?: 'pending' | 'completed'
  entries: YieldEntry[]
}

export interface YieldDetail extends Yield {
  entries: YieldEntry[]
  settlements: YieldSettlement[]
}

export type YieldType = 'interest' | 'cashback'

export interface Yield {
  _id: string
  name: string
  type: YieldType
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
  name: string
  type: YieldType
  accountId: string
}

export interface YieldEntry {
  _id: string
  date: number
  amount: number
  type: string
  category: { _id: string, name: string }
  note?: string
}

import type { StockOperationType } from '@soker90/finper-types'

export type { StockOperationType }

export interface StockPurchase {
  _id?: string
  ticker: string
  name: string
  shares: number
  price: number
  type: StockOperationType
  date: number
  platform: string
}

export interface StockPosition {
  ticker: string
  name: string
  shares: number
  dividendShares: number
  avgCost: number
  currentPrice: number | null
  totalCost: number
  currentValue: number | null
  gainLoss: number | null
  gainLossPct: number | null
  purchases: StockPurchase[]
}

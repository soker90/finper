export type StockOperationType = 'buy' | 'sell' | 'dividend'

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

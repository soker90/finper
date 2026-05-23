export const STOCK_TYPE = {
  Buy: 'buy',
  Sell: 'sell',
  Dividend: 'dividend',
} as const

export type StockType = typeof STOCK_TYPE[keyof typeof STOCK_TYPE]

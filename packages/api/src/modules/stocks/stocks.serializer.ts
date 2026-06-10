import { schema } from '@soker90/finper-db'
import type { StockPosition } from './stocks.service'

export const serializeStock = (stock: typeof schema.stocks.$inferSelect) => {
  const { id, date, ...rest } = stock
  return {
    ...rest,
    date,
    _id: id
  }
}

export const serializeStockPosition = (position: StockPosition) => {
  return {
    ...position,
    purchases: position.purchases.map(serializeStock)
  }
}

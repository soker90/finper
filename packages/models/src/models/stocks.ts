import { model, Schema, HydratedDocument } from 'mongoose'
import type { StockType } from '@soker90/finper-types'

export const STOCK_TYPE = {
  Buy: 'buy',
  Sell: 'sell',
  Dividend: 'dividend',
} as const

export type { StockType }

export interface IStock {
  ticker: string
  name: string
  shares: number
  price: number
  type: StockType
  date: number
  user: string
  platform: string
}

export type StockDocument = HydratedDocument<IStock>

const stockSchema = new Schema<IStock>({
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: Object.values(STOCK_TYPE), required: true },
  date: { type: Number, required: true },
  user: { type: String, required: true },
  platform: { type: String, required: true }
}, { versionKey: false })

export const StockModel = model<IStock>('Stock', stockSchema)

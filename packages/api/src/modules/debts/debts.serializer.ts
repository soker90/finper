import { schema } from '@soker90/finper-db'
import { InferSelectModel } from 'drizzle-orm'

export type DebtRow = InferSelectModel<typeof schema.debts>

export const debtsSerializer = {
  toJson (row: DebtRow) {
    const json: Record<string, any> = {
      _id: row.id,
      from: row.from,
      amount: row.amount,
      type: row.type,
      user: row.user
    }

    if (row.date != null) {
      json.date = row.date instanceof Date ? row.date.getTime() : row.date
    }
    if (row.concept != null) {
      json.concept = row.concept
    }

    return json
  }
}

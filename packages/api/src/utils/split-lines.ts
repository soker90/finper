import Boom from '@hapi/boom'
import { eq, and, inArray } from 'drizzle-orm'
import { type DB, schema, roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../i18n'

const { categories } = schema

export interface SplitLineInput {
  categoryId: string
  amount: number
}

export interface SplitLineCategory {
  type: string
}

/** Batch-loads the categories referenced by a set of split lines, scoped to
 * the user, so `assertSplitLines` can check each line's type with a single
 * query instead of one SELECT per line. */
export const loadCategoriesById = (db: DB, ids: string[], user: string): Map<string, SplitLineCategory> => {
  const categoriesById = new Map<string, SplitLineCategory>()
  if (ids.length === 0) return categoriesById
  const rows = db.select({ id: categories.id, type: categories.type }).from(categories)
    .where(and(inArray(categories.id, [...new Set(ids)]), eq(categories.user, user)))
    .all()
  for (const row of rows) categoriesById.set(row.id, { type: row.type })
  return categoriesById
}

/** Shared invariant for split lines (transactions and credit card movements):
 * either zero lines (no split) or at least two, the rounded amounts must add
 * up to the total, and every line's category must match the movement type.
 * Storage and loading stay domain-specific (different tables/fields); only
 * this validation is shared to avoid the rules drifting apart per domain. */
export const assertSplitLines = (params: {
  lines?: SplitLineInput[]
  amount: number
  type: string
  categoriesById: Map<string, SplitLineCategory>
}): void => {
  const { lines, amount, type, categoriesById } = params
  if (!lines) return
  if (lines.length === 1) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_MIN).output
  if (lines.length < 2) return

  const total = roundMoney(lines.reduce((sum, line) => sum + roundMoney(line.amount), 0))
  if (total !== roundMoney(amount)) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output

  for (const line of lines) {
    const category = categoriesById.get(line.categoryId)
    if (!category || category.type !== type) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_TYPE_MISMATCH).output
  }
}

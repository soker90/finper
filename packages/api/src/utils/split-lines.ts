import Boom from '@hapi/boom'
import { eq, and, inArray } from 'drizzle-orm'
import { type DB, schema, roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../i18n'
import { chunk } from './chunk-array'

const { categories } = schema

export interface SplitLineInput {
  categoryId: string
  amount: number
}

export interface SplitLineCategory {
  type: string
}

export const normalizeSplitLineAmounts = <Line extends { amount: number }>(lines: Line[] | undefined): Line[] | undefined =>
  lines?.map(line => ({ ...line, amount: roundMoney(line.amount) }))

/** Batch-loads the categories referenced by a set of split lines, scoped to
 * the user, so `assertSplitLines` can check each line's type with a single
 * query instead of one SELECT per line. Uses chunking to stay well under
 * SQLite bound parameter limits. */
export const loadCategoriesById = (db: DB, ids: string[], user: string): Map<string, SplitLineCategory> => {
  const categoriesById = new Map<string, SplitLineCategory>()
  if (ids.length === 0) return categoriesById
  const uniqueCategoryIds = [...new Set(ids)]
  for (const idChunk of chunk(uniqueCategoryIds, 500)) {
    const rows = db.select({ id: categories.id, type: categories.type }).from(categories)
      .where(and(inArray(categories.id, idChunk), eq(categories.user, user)))
      .all()
    for (const row of rows) categoriesById.set(row.id, { type: row.type })
  }
  return categoriesById
}

/** Shared invariant for split lines (transactions and credit card movements):
 * either zero lines (no split) or between two and five. Its inputs must already be
 * normalized to two decimals, so the sum can be checked against the persisted values.
 * Every line's category must exist (for this user),
 * and match the movement type (repeated categories across lines are allowed).
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
  if (lines.length > 5) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_MAX).output
  if (lines.length < 2) return

  const total = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0))
  if (total !== amount) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output

  for (const line of lines) {
    const category = categoriesById.get(line.categoryId)
    if (!category) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    if (category.type !== type) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_TYPE_MISMATCH).output
  }
}

export interface SplitEditInvariantParams {
  existingSplits: Array<{ categoryId: string, amount: number }>
  currentAmount: number
  currentType: string
  newSplits?: Array<{ categoryId: string, amount: number }>
  newAmount?: number
  newType?: string
  hasNewCategoryOrTags?: boolean
  user: string
  db: DB
}

/** Validates split invariants on PATCH/PUT operations for both transactions
 * and credit card movements. Enforces:
 * - If currently split and splits are omitted: rejecting changes to category,
 *   type or tags, and verifying amount matches existing split sum.
 * - If splits are explicitly empty ([]): transitions split item to normal.
 * - If splits are provided: enforces 2-5 lines, sum, and type. */
export const assertSplitEditInvariant = (params: SplitEditInvariantParams): void => {
  const {
    existingSplits,
    currentAmount,
    currentType,
    newSplits,
    newAmount,
    newType,
    hasNewCategoryOrTags,
    user,
    db
  } = params

  const isCurrentlySplit = existingSplits.length >= 2

  if (newSplits === undefined) {
    if (!isCurrentlySplit) return

    if (hasNewCategoryOrTags || newType !== undefined) {
      throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_FIELDS_REQUIRE_SPLITS).output
    }

    if (newAmount !== undefined) {
      const existingTotal = roundMoney(existingSplits.reduce((sum, split) => sum + split.amount, 0))
      if (existingTotal !== newAmount) {
        throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output
      }
    }
    return
  }

  if (newSplits.length === 0) return

  const categoriesById = loadCategoriesById(db, newSplits.map(split => split.categoryId), user)
  assertSplitLines({
    lines: newSplits,
    amount: newAmount ?? currentAmount,
    type: newType ?? currentType,
    categoriesById
  })
}

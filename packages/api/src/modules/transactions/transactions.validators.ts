import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { TRANSACTION, schema, roundMoney } from '@soker90/finper-db'
import { db as sqliteDb } from '../../db'
import { isValidId, assertSplitLines, loadCategoriesById, normalizeSplitLineAmounts } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'

const { transactions, categories, accounts } = schema

const validateTwoDecimals = (value: number, helpers: Joi.CustomHelpers) => {
  if (roundMoney(value) !== value) {
    return helpers.error('number.precision', { limit: 2 })
  }
  return value
}

const splitSchema = Joi.object({
  category: Joi.string().required(),
  amount: Joi.number().positive().custom(validateTwoDecimals).required(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
})

const bodySchema = {
  date: Joi.number().required(),
  category: Joi.string().required(),
  amount: Joi.number().custom(validateTwoDecimals).required(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable).required(),
  account: Joi.string().required(),
  note: Joi.string(),
  store: Joi.string(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  splits: Joi.array().items(splitSchema).max(5).optional()
}

const createSchema = Joi.object({ ...bodySchema, user: Joi.string() })
const editSchema = Joi.object(bodySchema)
const patchSchema = Joi.object({
  date: Joi.number(),
  category: Joi.string(),
  amount: Joi.number().custom(validateTwoDecimals),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable),
  account: Joi.string(),
  note: Joi.string().allow(null, ''),
  store: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  splits: Joi.array().items(splitSchema).max(5).optional()
}).min(1)

const getSchema = Joi.object({
  date: Joi.number(),
  category: Joi.string(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable),
  account: Joi.string(),
  store: Joi.string(),
  page: Joi.number()
})

const getCategory = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const row = sqliteDb.select({ id: categories.id, type: categories.type }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!row) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  return row
}

const assertAccountExists = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

const validateSplits = (params: { splits?: Array<{ category: string, amount: number }>, amount: number, type: string, user: string }) => {
  if (!params.splits) return
  const categoriesById = loadCategoriesById(sqliteDb, params.splits.map(split => split.category), params.user)
  assertSplitLines({
    lines: params.splits.map(split => ({ categoryId: split.category, amount: split.amount })),
    amount: params.amount,
    type: params.type,
    categoriesById
  })
}

export const validateTransactionCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  const normalizedValue = { ...value, amount: roundMoney(value.amount), splits: normalizeSplitLineAmounts(value.splits) }
  if (normalizedValue.category) getCategory(normalizedValue.category, params.user)
  assertAccountExists(normalizedValue.account, params.user)
  validateSplits({ ...normalizedValue, user: params.user })
  return normalizedValue
}

export const validateTransactionExist = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exists = sqliteDb.select({ id: transactions.id }).from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
}

export const validateTransactionEditParams = ({ params, body, user }: { params: Record<string, any>, body: Record<string, any>, user: string }) => {
  validateTransactionExist(params.id, user)
  const { error, value } = editSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  const normalizedValue = { ...value, amount: roundMoney(value.amount), splits: normalizeSplitLineAmounts(value.splits) }
  if (normalizedValue.category) getCategory(normalizedValue.category, user)
  assertAccountExists(normalizedValue.account, user)
  validateSplits({ ...normalizedValue, user })
  return { id: params.id, value: { ...normalizedValue, user } }
}

export const validateTransactionPatchParams = ({ params, body, user }: { params: Record<string, any>, body: Record<string, any>, user: string }) => {
  validateTransactionExist(params.id, user)
  const { error, value } = patchSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  const normalizedValue = {
    ...value,
    ...(value.amount !== undefined && { amount: roundMoney(value.amount) }),
    ...(value.splits !== undefined && { splits: normalizeSplitLineAmounts(value.splits) })
  }
  if (normalizedValue.category !== undefined) getCategory(normalizedValue.category, user)
  if (normalizedValue.account !== undefined) assertAccountExists(normalizedValue.account, user)
  return { id: params.id, value: { ...normalizedValue, user } }
}

export const validateTransactionGetParams = (query?: Record<string, any>) => {
  const { error, value } = getSchema.validate(query)
  if (error) throw Boom.badData(error.message).output
  return value
}

import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { TRANSACTION } from '@soker90/finper-models'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'

const { transactions, categories, accounts } = schema

const bodySchema = {
  date: Joi.number().required(),
  category: Joi.string().required(),
  amount: Joi.number().required(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable).required(),
  account: Joi.string().required(),
  note: Joi.string(),
  store: Joi.string(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
}

const createSchema = Joi.object({ ...bodySchema, user: Joi.string() })
const editSchema = Joi.object(bodySchema)
const getSchema = Joi.object({
  date: Joi.number(),
  category: Joi.string(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable),
  account: Joi.string(),
  store: Joi.string(),
  page: Joi.number()
})

const assertCategoryExists = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exists = sqliteDb.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
}

const assertAccountExists = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

export const validateTransactionCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  assertCategoryExists(params.category, params.user)
  assertAccountExists(params.account, params.user)
  return value
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
  return { id: params.id, value: { ...value, user } }
}

export const validateTransactionGetParams = (query?: Record<string, any>) => {
  const { error, value } = getSchema.validate(query)
  if (error) throw Boom.badData(error.message).output
  return value
}

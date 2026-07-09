import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { yields, accounts, categories } = schema

const YIELD_TYPES = ['interest', 'cashback']

const assertAccountExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: accounts.id, name: accounts.name }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  return exists.name
}

const assertCategoryExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
}

const createSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid(...YIELD_TYPES).required(),
  accountId: Joi.string().required(),
  categoryId: Joi.string().required(),
  user: Joi.string()
})

const editSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid(...YIELD_TYPES),
  accountId: Joi.string(),
  categoryId: Joi.string()
})

export const validateYieldCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  const accountName = assertAccountExists(params.accountId, params.user)
  assertCategoryExists(params.categoryId, params.user)

  if (!value.name) {
    const typeLabel = value.type === 'interest' ? 'Intereses' : 'Cashback'
    value.name = `${accountName} - ${typeLabel}`
  }

  return value
}

export const validateYieldExist = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: yields.id }).from(yields)
    .where(and(eq(yields.id, id), eq(yields.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.YIELD.NOT_FOUND).output
}

export const validateYieldEditParams = ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  validateYieldExist(params.id, user)
  const { error, value } = editSchema.validate(body)
  if (error) throw Boom.badData(error.message).output

  if (body.accountId || body.type) {
    const currentYield = sqliteDb.select().from(yields).where(and(eq(yields.id, params.id), eq(yields.user, user))).get()
    if (currentYield) {
      const targetAccountId = body.accountId || currentYield.accountId
      const targetType = body.type || currentYield.type
      const accountName = assertAccountExists(targetAccountId, user)
      const typeLabel = targetType === 'interest' ? 'Intereses' : 'Cashback'
      value.name = `${accountName} - ${typeLabel}`
    }
  } else if (body.accountId) {
    assertAccountExists(body.accountId, user)
  }

  if (body.categoryId) assertCategoryExists(body.categoryId, user)
  return { id: params.id, value }
}

export const validateYieldLinkParams = ({ transactionIds }: { transactionIds: any }) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw Boom.badData(ERROR_MESSAGE.YIELD.TRANSACTION_IDS_REQUIRED).output
  }
  return transactionIds as string[]
}

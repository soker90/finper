import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and, ne } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { yields, accounts, categories, yieldSettlements } = schema

const YIELD_TYPES = ['interest', 'cashback']

const assertAccountExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

const assertCategoryExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
}

const assertNoDuplicateYield = ({ accountId, type, user, excludeYieldId }: { accountId: string, type: string, user: string, excludeYieldId?: string }) => {
  const conditions = [
    eq(yields.accountId, accountId),
    eq(yields.type, type),
    eq(yields.user, user)
  ]
  if (excludeYieldId) {
    conditions.push(ne(yields.id, excludeYieldId))
  }
  const duplicate = sqliteDb.select({ id: yields.id }).from(yields)
    .where(and(...conditions)).get()
  if (duplicate) {
    throw Boom.badData(ERROR_MESSAGE.YIELD.ALREADY_EXISTS).output
  }
}

const createSchema = Joi.object({
  type: Joi.string().valid(...YIELD_TYPES).required(),
  accountId: Joi.string().required(),
  categoryIds: Joi.array().items(Joi.string()).min(1).required(),
  user: Joi.string()
})

const editSchema = Joi.object({
  type: Joi.string().valid(...YIELD_TYPES).optional(),
  accountId: Joi.string().optional(),
  categoryIds: Joi.array().items(Joi.string()).min(1).optional()
})

export const validateYieldCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  assertAccountExists(params.accountId, params.user)
  for (const catId of params.categoryIds) {
    assertCategoryExists(catId, params.user)
  }
  assertNoDuplicateYield({ accountId: params.accountId, type: params.type, user: params.user })
  return value
}

export const validateSettlementBelongsToYield = ({ yieldId, settlementId, user }: { yieldId: string, settlementId: string, user: string }) => {
  const exists = sqliteDb.select({ id: yieldSettlements.id }).from(yieldSettlements)
    .where(and(
      eq(yieldSettlements.id, settlementId),
      eq(yieldSettlements.yieldId, yieldId),
      eq(yieldSettlements.user, user)
    )).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.YIELD.SETTLEMENT_NOT_FOUND).output
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

  const currentYield = sqliteDb.select().from(yields).where(and(eq(yields.id, params.id), eq(yields.user, user))).get()
  if (!currentYield) throw Boom.notFound(ERROR_MESSAGE.YIELD.NOT_FOUND).output

  if (body.accountId || body.type) {
    const targetAccountId = body.accountId || currentYield.accountId
    const targetType = body.type || currentYield.type
    assertAccountExists(targetAccountId, user)
    assertNoDuplicateYield({ accountId: targetAccountId, type: targetType, user, excludeYieldId: params.id })
  }

  if (body.categoryIds) {
    for (const catId of body.categoryIds) {
      assertCategoryExists(catId, user)
    }
  }

  return { id: params.id, value }
}

const linkSchema = Joi.object({
  transactionIds: Joi.array().items(Joi.string()).min(1).required(),
  settlementId: Joi.string().optional().allow(null, ''),
  tae: Joi.number().optional().allow(null),
  averageBalance: Joi.number().optional().allow(null)
})

export const validateYieldLinkParams = (body: Record<string, any>) => {
  const { error, value } = linkSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

const editSettlementSchema = Joi.object({
  tae: Joi.number().optional().allow(null),
  averageBalance: Joi.number().optional().allow(null)
})

export const validateSettlementEditParams = ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  validateYieldExist(params.id, user)
  validateSettlementBelongsToYield({ yieldId: params.id, settlementId: params.settlementId, user })
  const { error, value } = editSettlementSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return { id: params.id, settlementId: params.settlementId, value }
}

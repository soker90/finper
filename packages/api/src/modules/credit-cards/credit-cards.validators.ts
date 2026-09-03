import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { schema, roundMoney } from '@soker90/finper-db'
import { db as sqliteDb } from '../../db'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { creditCardsRepository } from './credit-cards.repository'
import type { CreateCreditCardData, UpdateCreditCardData, CreateCreditCardMovementData, UpdateCreditCardMovementData, PayDebtPayload, CreditCardRow } from './credit-cards.repository'

const { accounts, categories } = schema

const splitSchema = Joi.object({
  categoryId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
})

const createCardSchema = Joi.object({
  name: Joi.string().required(),
  accountId: Joi.string().required(),
  limit: Joi.number().min(0).allow(null),
  logoBank: Joi.string().allow(null, '')
})

const editCardSchema = Joi.object({
  name: Joi.string(),
  accountId: Joi.string(),
  limit: Joi.number().min(0).allow(null),
  logoBank: Joi.string().allow(null, '')
}).min(1)

const createMovementSchema = Joi.object({
  date: Joi.number().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('expense', 'income').default('expense'),
  categoryId: Joi.string().required(),
  // storeId accepts a free-text store name (like transactions' `store` field);
  // it is resolved to an actual store id via an upsert-by-name in the
  // controller (see storesService.getAndReplaceStore), scoped to the user.
  storeId: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  splits: Joi.array().items(splitSchema).optional()
})

const editMovementSchema = Joi.object({
  date: Joi.number(),
  amount: Joi.number().positive(),
  type: Joi.string().valid('expense', 'income'),
  categoryId: Joi.string(),
  storeId: Joi.string().allow(null, ''),
  note: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  splits: Joi.array().items(splitSchema).optional()
}).min(1)

const payDebtSchema = Joi.object({
  movementIds: Joi.array().items(Joi.string()).min(1),
  amount: Joi.number().positive(),
  all: Joi.boolean()
}).xor('movementIds', 'amount', 'all')

const assertAccountExists = (id: string, user: string): void => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

const getCategory = (id: string, user: string) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const row = sqliteDb.select({ id: categories.id, type: categories.type }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!row) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  return row
}

const assertCategoryExists = (id: string, user: string): void => {
  getCategory(id, user)
}

const validateSplits = (params: { splits?: Array<{ categoryId: string, amount: number }>, amount?: number, type?: string, user: string }) => {
  if (!params.splits) return
  if (params.splits.length === 1) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_MIN).output
  if (params.splits.length < 2) return
  if (params.amount === undefined) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output

  const total = roundMoney(params.splits.reduce((sum, split) => sum + split.amount, 0))
  if (total !== roundMoney(params.amount)) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_SUM_MISMATCH).output

  const movementType = params.type ?? 'expense'
  for (const split of params.splits) {
    const category = getCategory(split.categoryId, params.user)
    if (category.type !== movementType) throw Boom.badData(ERROR_MESSAGE.TRANSACTION.SPLIT_TYPE_MISMATCH).output
  }
}

export const validateCreditCardCreateParams = (body: Record<string, any>, user: string): CreateCreditCardData => {
  const { error, value } = createCardSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  assertAccountExists(value.accountId, user)
  return value
}

export const validateCreditCardExist = async (id: string, user: string): Promise<CreditCardRow> => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exist = await creditCardsRepository.findById(id, user)
  if (!exist) throw Boom.notFound(ERROR_MESSAGE.CREDIT_CARD.NOT_FOUND).output
  return exist
}

export const validateCreditCardEditParams = async ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): Promise<{ id: string, value: UpdateCreditCardData }> => {
  await validateCreditCardExist(params.id, user)
  const { error, value } = editCardSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  if (value.accountId !== undefined) assertAccountExists(value.accountId, user)
  return { id: params.id, value }
}

export const validateCreditCardMovementCreateParams = (body: Record<string, any>, user: string): Omit<CreateCreditCardMovementData, 'creditCardId'> => {
  const { error, value } = createMovementSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  assertCategoryExists(value.categoryId, user)
  validateSplits({ ...value, user })
  return value
}

export const validateCreditCardMovementEditParams = (body: Record<string, any>, user: string): UpdateCreditCardMovementData => {
  const { error, value } = editMovementSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  if (value.categoryId !== undefined) assertCategoryExists(value.categoryId, user)
  validateSplits({ ...value, user })
  return value
}

export const validateCreditCardPayDebtParams = (body: Record<string, any>): PayDebtPayload => {
  const { error, value } = payDebtSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

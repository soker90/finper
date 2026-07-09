import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { yields, accounts } = schema

const YIELD_TYPES = ['interest', 'cashback']

const assertAccountExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

const createSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(...YIELD_TYPES).required(),
  accountId: Joi.string().required(),
  user: Joi.string()
})

const editSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string().valid(...YIELD_TYPES),
  accountId: Joi.string()
})

export const validateYieldCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  assertAccountExists(params.accountId, params.user)
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
  if (body.accountId) assertAccountExists(body.accountId, user)
  return { id: params.id, value }
}

export const validateYieldLinkParams = ({ transactionIds }: { transactionIds: any }) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw Boom.badData(ERROR_MESSAGE.YIELD.TRANSACTION_IDS_REQUIRED).output
  }
  return transactionIds as string[]
}

import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { subscriptions, categories, accounts, subscriptionCandidates } = schema

const assertCategoryExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
}

const assertAccountExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
}

const createSchema = Joi.object({
  name: Joi.string().required(),
  amount: Joi.number().positive().required(),
  cycle: Joi.number().integer().min(1).max(60).required(),
  categoryId: Joi.string().required(),
  accountId: Joi.string().required(),
  logoUrl: Joi.string().uri().allow(''),
  user: Joi.string()
})

const editSchema = Joi.object({
  name: Joi.string(),
  amount: Joi.number().positive(),
  cycle: Joi.number().integer().min(1).max(60),
  categoryId: Joi.string(),
  accountId: Joi.string(),
  logoUrl: Joi.string().uri().allow('')
})

export const validateSubscriptionCreateParams = (params: Record<string, any>) => {
  const { error, value } = createSchema.validate(params)
  if (error) throw Boom.badData(error.message).output
  assertCategoryExists(params.categoryId, params.user)
  assertAccountExists(params.accountId, params.user)
  return value
}

export const validateSubscriptionExist = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: subscriptions.id }).from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.SUBSCRIPTION.NOT_FOUND).output
}

export const validateSubscriptionEditParams = ({ params, body, user }: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  validateSubscriptionExist(params.id, user)
  const { error, value } = editSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  if (body.categoryId) assertCategoryExists(body.categoryId, user)
  if (body.accountId) assertAccountExists(body.accountId, user)
  return { id: params.id, value }
}

// Parte B: link-transactions requiere un array no vacío de ids (422 si no).
export const validateSubscriptionLinkParams = ({ id, transactionIds, user }: Record<string, any>) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw Boom.badData(ERROR_MESSAGE.SUBSCRIPTION.TRANSACTION_IDS_REQUIRED).output
  }
  return { id, transactionIds, user }
}

// Parte C: candidate existe (404). 1:1 con el viejo (solo existencia).
export const validateCandidateExist = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: subscriptionCandidates.id }).from(subscriptionCandidates)
    .where(and(eq(subscriptionCandidates.id, id), eq(subscriptionCandidates.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.SUBSCRIPTION_CANDIDATE.NOT_FOUND).output
}

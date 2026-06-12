import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'

const { categories } = schema

const assertCategoryExists = (id: string, user: string) => {
  const exists = sqliteDb.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), eq(categories.user, user))).get()
  if (!exists) throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
}

export const validateBudgetGet = (query: Record<string, any>) => {
  const schemaJoi = Joi.object({
    year: Joi.number().required(),
    month: Joi.number()
  })
  const { error, value } = schemaJoi.validate(query)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateBudgetEditParams = ({
  params, body, user
}: { params: Record<string, string>, body: Record<string, any>, user: string }) => {
  if (params.category) {
    assertCategoryExists(params.category, user)
  }

  const schemaParams = Joi.object({
    category: Joi.string().required(),
    month: Joi.number().required(),
    year: Joi.number().required()
  })
  const { error, value } = schemaParams.validate(params)
  if (error) throw Boom.badData(ERROR_MESSAGE.BUDGET.YEAR_MONTH_INVALID).output

  const schemaBody = Joi.object({ amount: Joi.number().required() })
  const { error: errorAmount, value: amount } = schemaBody.validate(body)
  if (errorAmount) throw Boom.badData(ERROR_MESSAGE.BUDGET.INVALID_AMOUNT).output

  return { ...value, ...amount, user }
}

export const validateBudgetCopy = ({
  body, user
}: { body: Record<string, any>, user: string }) => {
  const schemaJoi = Joi.object({
    year: Joi.number().min(2000).max(2100).required(),
    month: Joi.number().min(0).max(11).required(),
    yearOrigin: Joi.number().min(2000).max(2100).required(),
    monthOrigin: Joi.number().min(0).max(11).required()
  })
  const { error, value } = schemaJoi.validate(body)
  if (error) throw Boom.badData(error.message).output
  return { ...value, user }
}

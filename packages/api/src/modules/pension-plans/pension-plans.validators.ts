import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'

const { pensionPlans } = schema

const planCreateSchema = Joi.object({
  name: Joi.string().required()
})

const planEditSchema = Joi.object({
  name: Joi.string()
}).min(1)

const movementCreateSchema = Joi.object({
  date: Joi.number().required(),
  employeeAmount: Joi.number().required(),
  employeeUnits: Joi.number().required(),
  companyAmount: Joi.number().required(),
  companyUnits: Joi.number().required(),
  value: Joi.number().required()
})

const movementEditSchema = Joi.object({
  date: Joi.number(),
  employeeAmount: Joi.number(),
  employeeUnits: Joi.number(),
  companyAmount: Joi.number(),
  companyUnits: Joi.number(),
  value: Joi.number()
}).min(1)

export const validatePlanExist = ({ id, user }: { id: string, user: string }) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exist = sqliteDb.select({ id: pensionPlans.id }).from(pensionPlans)
    .where(and(eq(pensionPlans.id, id), eq(pensionPlans.user, user))).get()
  if (!exist) throw Boom.notFound(ERROR_MESSAGE.PENSION_PLAN.NOT_FOUND).output
}

export const validatePlanCreateParams = (body: any) => {
  const { error, value } = planCreateSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validatePlanEditParams = ({ params, body, user }: { params: any, body: any, user: string }) => {
  validatePlanExist({ id: params.id, user })
  const { error, value } = planEditSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return { id: params.id, value }
}

export const validateMovementCreateParams = (body: any) => {
  const { error, value } = movementCreateSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateMovementEditParams = (body: any) => {
  const { error, value } = movementEditSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'

const { pensions } = schema

const pensionPayloadSchema = Joi.object({
  date: Joi.number().required(),
  employeeAmount: Joi.number().required(),
  employeeUnits: Joi.number().required(),
  companyAmount: Joi.number().required(),
  companyUnits: Joi.number().required(),
  value: Joi.number().required()
})

export const validatePensionExist = ({ id, user }: { id: string, user: string }) => {
  if (!isValidId(id)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  const exist = sqliteDb.select({ id: pensions.id }).from(pensions)
    .where(and(eq(pensions.id, id), eq(pensions.user, user))).get()
  if (!exist) throw Boom.notFound(ERROR_MESSAGE.PENSION.NOT_FOUND).output
}

export const validatePensionCreateParams = (body: any) => {
  const { error, value } = pensionPayloadSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validatePensionEditParams = ({ params, body, user }: { params: any, body: any, user: string }) => {
  validatePensionExist({ id: params.id, user })
  const { error, value } = pensionPayloadSchema.validate(body)
  if (error) throw Boom.badData(error.message).output
  return { id: params.id, value }
}

import Joi from 'joi'
import Boom from '@hapi/boom'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { schema } from '@soker90/finper-db'
import { isValidId } from '../../utils'

const { loans } = schema

export const validateLoanExist = async ({ id, user, message }: { id: string, user: string, message?: string }) => {
  if (!isValidId(id)) {
    throw Boom.badRequest('Invalid loan id').output
  }
  const exist = sqliteDb.select({ id: loans.id }).from(loans)
    .where(and(eq(loans.id, id), eq(loans.user, user))).get()
  if (!exist) {
    throw Boom.notFound(message ?? 'El préstamo no existe').output
  }
}

export const validateLoanCreateParams = async (data: Record<string, any>) => {
  const schemaJoi = Joi.object({
    name: Joi.string().required(),
    initialAmount: Joi.number().positive().required(),
    interestRate: Joi.number().min(0).required(),
    startDate: Joi.number().required(),
    monthlyPayment: Joi.number().positive().required(),
    account: Joi.string().required(),
    category: Joi.string().required(),
    user: Joi.string().required(),
    initialEstimatedCost: Joi.forbidden(),
    pendingAmount: Joi.forbidden()
  })

  const { error, value } = schemaJoi.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateLoanEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, any>, user: string }): Promise<{ id: string, value: Record<string, any> }> => {
  await validateLoanExist({ id: params.id, user })

  const schemaJoi = Joi.object({
    name: Joi.string(),
    account: Joi.string(),
    category: Joi.string()
  })

  const { error, value } = schemaJoi.validate(body)
  if (error) throw Boom.badData(error.message).output

  return { id: params.id, value }
}

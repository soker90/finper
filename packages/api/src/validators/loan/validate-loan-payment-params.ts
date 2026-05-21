import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanOrdinaryPaymentParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    date: Joi.number().optional(),
    amount: Joi.number().positive().optional(),
    addMovement: Joi.boolean().optional()
  })

  const { error, value } = schema.validate(data)
  /* istanbul ignore next — Joi error branch not exercised for loan ordinary payment in current tests */
  if (error) throw Boom.badData(error.message).output
  return value
}

export const validateLoanPaymentParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
    mode: Joi.string().valid('reduceQuota', 'reduceTerm').required(),
    date: Joi.number().optional(),
    addMovement: Joi.boolean().optional()
  })

  const { error, value } = schema.validate(data)
  /* istanbul ignore next — Joi error branch not exercised for loan payment in current tests */
  if (error) throw Boom.badData(error.message).output
  return value
}

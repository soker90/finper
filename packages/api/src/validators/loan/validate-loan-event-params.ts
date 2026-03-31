import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanEventParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    date: Joi.number().required(),
    newRate: Joi.number().min(0).required(),
    newPayment: Joi.number().positive().required(),
    user: Joi.string().required(),
    loan: Joi.string()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

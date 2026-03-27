import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanEditPaymentParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    date: Joi.number(),
    amount: Joi.number().positive(),
    interest: Joi.number().min(0),
    principal: Joi.number().positive(),
    type: Joi.string().valid('ordinary', 'extraordinary'),
    user: Joi.string().required(),
    loan: Joi.string(),
    paymentId: Joi.string()
  }).min(2) // at least user + one field

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

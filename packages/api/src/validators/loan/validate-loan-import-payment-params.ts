import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanImportPaymentParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    date: Joi.number().required(),
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('ordinary', 'extraordinary').default('ordinary'),
    user: Joi.string().required(),
    loan: Joi.string()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

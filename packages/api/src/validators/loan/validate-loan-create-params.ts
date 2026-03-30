import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanCreateParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
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

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

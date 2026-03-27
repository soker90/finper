import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanCreateParams = async (data: Record<string, any>) => {
  const paymentSchema = Joi.object({
    date: Joi.number().required(),
    amount: Joi.number().required(),
    interest: Joi.number().default(0),
    principal: Joi.number(),
    type: Joi.string().valid('ordinary', 'extraordinary').default('ordinary')
  })

  const schema = Joi.object({
    name: Joi.string().required(),
    initialAmount: Joi.number().positive().required(),
    pendingAmount: Joi.number().positive().optional(),
    interestRate: Joi.number().min(0).required(),
    startDate: Joi.number().required(),
    monthlyPayment: Joi.number().positive().required(),
    account: Joi.string().required(),
    category: Joi.string().required(),
    user: Joi.string().required(),
    payments: Joi.array().items(paymentSchema).optional()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

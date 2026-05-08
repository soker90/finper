import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateFireProjectionParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    currentBalance: Joi.number().required(),
    monthlyContribution: Joi.number().default(0),
    annualReturnRate: Joi.number().min(0).max(100).default(7),
    withdrawalRate: Joi.number().min(1).max(20).default(4),
    annualExpenses: Joi.number().required(),
    totalDebts: Joi.number().default(0),
    totalLoansPending: Joi.number().default(0),
    totalReceivable: Joi.number().default(0),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}

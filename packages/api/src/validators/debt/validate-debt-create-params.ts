import Joi from 'joi'
import Boom from '@hapi/boom'
import { DebtType } from '@soker90/finper-models'

export const validateDebtCreateParams = async (data: Record<string, string>) => {
  const schema = Joi.object({
    from: Joi.string().required(),
    date: Joi.number(),
    amount: Joi.number().required(),
    paymentDate: Joi.number(),
    concept: Joi.string(),
    type: Joi.string().valid(DebtType.TO, DebtType.FROM).required(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

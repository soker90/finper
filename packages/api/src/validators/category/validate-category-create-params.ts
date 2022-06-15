import Joi from 'joi'
import Boom from '@hapi/boom'
import { TransactionType } from '@soker90/finper-models'

export const validateCategoryCreateParams = (input: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable).required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
